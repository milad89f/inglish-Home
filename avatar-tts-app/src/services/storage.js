import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'savedTalks';
const IDLE_TALK_KEY = 'idleTalkId';
const SUCCESS_TALK_KEY = 'successTalkId';
const RETRY_TALK_KEY = 'retryTalkId';

export async function getSavedTalks() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
}

export async function saveTalk({ text, language, remoteVideoUrl }) {
  const id = uuidv4();
  const fileName = `${id}.mp4`;
  const localUri = FileSystem.documentDirectory + fileName;

  // Download remote video to local app storage
  await FileSystem.downloadAsync(remoteVideoUrl, localUri);

  const newItem = {
    id,
    text,
    language,
    localUri,
    remoteVideoUrl: remoteVideoUrl, // حفظ remoteVideoUrl
    remote_video_url: remoteVideoUrl, // حفظ أيضاً باسم snake_case
    createdAt: Date.now(),
  };

  const current = await getSavedTalks();
  const next = [...current, newItem]; // Add to end (ascending order - oldest first)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return newItem;
}

export async function updateTalk(talkId, updates) {
  try {
    const current = await getSavedTalks();
    const updated = current.map(t => 
      t.id === talkId ? { ...t, ...updates } : t
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error updating talk in storage:', error);
    return false;
  }
}

export async function getIdleTalkId() {
  try {
    return await AsyncStorage.getItem(IDLE_TALK_KEY);
  } catch (e) {
    return null;
  }
}

export async function setIdleTalkId(talkId) {
  try {
    await AsyncStorage.setItem(IDLE_TALK_KEY, talkId);
  } catch (e) {
    console.warn('Failed to save idle talk ID:', e);
  }
}

export async function getSuccessTalkId() {
  try {
    return await AsyncStorage.getItem(SUCCESS_TALK_KEY);
  } catch (e) {
    return null;
  }
}

export async function setSuccessTalkId(talkId) {
  try {
    await AsyncStorage.setItem(SUCCESS_TALK_KEY, talkId);
  } catch (e) {
    console.warn('Failed to save success talk ID:', e);
  }
}

export async function getRetryTalkId() {
  try {
    return await AsyncStorage.getItem(RETRY_TALK_KEY);
  } catch (e) {
    return null;
  }
}

export async function setRetryTalkId(talkId) {
  try {
    await AsyncStorage.setItem(RETRY_TALK_KEY, talkId);
  } catch (e) {
    console.warn('Failed to save retry talk ID:', e);
  }
}

export async function deleteTalk(talkId) {
  try {
    const current = await getSavedTalks();
    const talkToDelete = current.find(t => t.id === talkId);
    
    if (talkToDelete) {
      // Delete the local video file
      try {
        const fileInfo = await FileSystem.getInfoAsync(talkToDelete.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(talkToDelete.localUri, { idempotent: true });
        }
      } catch (fileError) {
        console.warn('Failed to delete video file:', fileError);
      }
    }
    
    // Remove from storage
    const updated = current.filter(t => t.id !== talkId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // If this was the idle talk, clear idle setting
    const idleId = await getIdleTalkId();
    if (idleId === talkId) {
      await AsyncStorage.removeItem(IDLE_TALK_KEY);
    }
    
    // If this was the success talk, clear success setting
    const successId = await getSuccessTalkId();
    if (successId === talkId) {
      await AsyncStorage.removeItem(SUCCESS_TALK_KEY);
    }
    
    // If this was the retry talk, clear retry setting
    const retryId = await getRetryTalkId();
    if (retryId === talkId) {
      await AsyncStorage.removeItem(RETRY_TALK_KEY);
    }
    
    return true;
  } catch (e) {
    console.error('Failed to delete talk:', e);
    return false;
  }
}

export async function reorderTalk(talkId, direction) {
  // direction: 'up' or 'down'
  try {
    const current = await getSavedTalks();
    const index = current.findIndex(t => t.id === talkId);
    
    if (index === -1) return false;
    
    let newIndex;
    if (direction === 'up') {
      if (index === 0) return false; // Already at top
      newIndex = index - 1;
    } else if (direction === 'down') {
      if (index === current.length - 1) return false; // Already at bottom
      newIndex = index + 1;
    } else {
      return false;
    }
    
    // Swap items
    const reordered = [...current];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
    return { newIndex };
  } catch (e) {
    console.error('Failed to reorder talk:', e);
    return false;
  }
}


