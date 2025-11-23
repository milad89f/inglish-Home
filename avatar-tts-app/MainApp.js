import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, Audio } from 'expo-av';
import Avatar from './src/components/Avatar';
import TextInput from './src/components/TextInput';
import { createTalk, getTalk, createTalkWithFallback } from './src/services/did';
import { NetworkService } from './src/services/network';
import { getSavedTalks, saveTalk, getIdleTalkId, setIdleTalkId, deleteTalk, reorderTalk, getSuccessTalkId, setSuccessTalkId, getRetryTalkId, setRetryTalkId, updateTalk } from './src/services/storage';
import { transcribeWithDeepgram } from './src/services/stt';
import { similarityPercent, compareWords } from './src/services/textSimilarity';
import HighlightedText from './src/components/HighlightedText';
import { authAPI, coursesAPI, videosAPI, reportsAPI, usersAPI } from './src/services/api';
import { AVATAR_CONFIG } from './src/config/apiKeys';
import * as FileSystem from 'expo-file-system/legacy';

export default function MainApp({ navigation }) {
  // User and Course state
  const [userId, setUserId] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [allCourses, setAllCourses] = useState([]);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  // Video and text state
  const [inputText, setInputText] = useState('');
  const [selectedLanguage] = useState('en'); // Always English
  const [savedTalks, setSavedTalks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const videoRef = useRef(null);
  const recordingRef = useRef(null);
  const recordingDotAnimation = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  // Recording and STT state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [wordComparison, setWordComparison] = useState([]);
  const [processingSTT, setProcessingSTT] = useState(false);
  const [sttRetryCount, setSttRetryCount] = useState(0);
  const [sttRetryMessage, setSttRetryMessage] = useState('');

  // Video generation state
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState('');

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);

  // Course picker for new videos
  const [showCoursePicker, setShowCoursePicker] = useState(false);

  // Course transfer modal
  const [showCourseTransferModal, setShowCourseTransferModal] = useState(false);
  const [transferringVideo, setTransferringVideo] = useState(false);

  // Internal Tabs (Practice / Courses)
  const [activeTab, setActiveTab] = useState('practice'); // 'practice' or 'courses'

  // Courses Management state (from CoursesScreen)
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [membership, setMembership] = useState('free');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseLanguage, setCourseLanguage] = useState('en');
  const [courseLevel, setCourseLevel] = useState('beginner');

  // Initialize: Get user info and course
  useEffect(() => {
    initializeApp();
  }, []);

  // Load saved talks when course changes
  useEffect(() => {
    if (courseId) {
      loadVideosFromBackend();
    }
  }, [courseId]);

  // Auto-scroll to current item when index changes
  useEffect(() => {
    if (savedTalks.length > 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * 130,
        animated: true
      });
    }
  }, [currentIndex, savedTalks.length]);


  // Load courses when switching to courses tab
  useEffect(() => {
    if (activeTab === 'courses') {
      loadCoursesData();
    }
  }, [activeTab, userId]);

  const initializeApp = async () => {
    try {
      // Check if user is authenticated first
      const isAuth = await authAPI.isAuthenticated();
      if (!isAuth) {
        console.log('User not authenticated');
        setLoadingCourse(false);
        return;
      }
      
      // Get user info
      const userInfo = await authAPI.getStoredUserInfo();
      if (userInfo && userInfo.id) {
        setUserId(userInfo.id);
        
        // Get or create default course
        await getOrCreateDefaultCourse(userInfo.id);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      
      // Handle 401 errors
      if (error.response?.status === 401) {
        await authAPI.logout();
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to initialize app. Please try again.');
      }
    } finally {
      setLoadingCourse(false);
    }
  };

  const getOrCreateDefaultCourse = async (userId) => {
    try {
      // Try to get user's courses
      const response = await coursesAPI.getUserCourses(userId);
      
      // Check if response is successful and has data
      if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        // Store all courses
        setAllCourses(response.data.data);
        
        // Find active course, or use first course if no active course
        const activeCourse = response.data.data.find(c => c.is_active) || response.data.data[0];
        setCourseId(activeCourse.id);
        setCourseInfo(activeCourse);
        console.log('Using course:', activeCourse.id, activeCourse.is_active ? '(Active)' : '');
        return;
      } else {
        console.log('No existing courses found, creating new one...');
        setAllCourses([]);
      }
    } catch (error) {
      // Handle 401 Unauthorized - Token expired or invalid
      if (error.response?.status === 401) {
        console.error('Auth error: Token expired or invalid');
        // Clear stored auth data
        await authAPI.logout();
        // Show alert and reload app (will redirect to login)
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // The AppNavigator will detect missing auth and show login screen
                // Force reload by resetting state
                setUserId(null);
                setCourseId(null);
                setCourseInfo(null);
              },
            },
          ]
        );
        return;
      }
      
      // If 404 or any other error, we'll create a new course
      console.log('Error getting courses, creating new one...', error.response?.status || error.message);
    }
    
    // Create default course if none exists
    try {
      console.log('Attempting to create course with data:', {
        title: 'My Practice Course',
        description: 'Default practice course for avatar videos',
        language: selectedLanguage,
        level: 'beginner',
        is_published: false,
      });
      
      const createResponse = await coursesAPI.create({
        title: 'My Practice Course',
        description: 'Default practice course for avatar videos',
        language: selectedLanguage,
        level: 'beginner',
        is_published: false,
      });
      
      console.log('Course creation response:', createResponse.data);
      
      if (createResponse.data && createResponse.data.success) {
        const newCourse = createResponse.data.data;
        setCourseId(newCourse.id);
        setCourseInfo(newCourse);
        setAllCourses([newCourse]);
        console.log('✅ Default course created successfully:', newCourse.id);
        // Note: Backend will automatically set is_default and is_active for first course
      } else {
        console.error('❌ Failed to create course:', createResponse.data);
        // Continue without course - user can still use local features
      }
    } catch (createError) {
      // Handle 401 Unauthorized
      if (createError.response?.status === 401) {
        console.error('Auth error: Token expired or invalid');
        await authAPI.logout();
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.error('❌ Error creating course:', createError.response?.data || createError.message);
      console.error('Error status:', createError.response?.status);
      console.error('Error URL:', createError.config?.url);
      // Continue without course - user can still use local features
    }
  };

  const loadVideosFromBackend = async () => {
    if (!courseId) {
      // Fallback to local storage if no course
      const localTalks = await getSavedTalks();
      setSavedTalks(localTalks);
      return;
    }
    
    try {
      const response = await coursesAPI.getVideos(courseId);
      if (response.data.success) {
        const backendVideos = response.data.data || [];
        
        // Get local videos
        const localTalks = await getSavedTalks();
        
        // Create a map of backend videos by text+language to avoid duplicates
        const backendMap = new Map();
        backendVideos.forEach(v => {
          const key = `${v.text}_${v.language}`;
          backendMap.set(key, {
            id: v.id.toString(),
            backendId: v.id,
            text: v.text,
            language: v.language,
            localUri: v.local_uri || null,
            remoteVideoUrl: v.remote_video_url,
            remote_video_url: v.remote_video_url, // حفظ أيضاً باسم snake_case للتوافق
            videoType: v.video_type,
            video_type: v.video_type, // حفظ أيضاً باسم snake_case
            didTalkId: v.did_talk_id || null,
            did_talk_id: v.did_talk_id || null, // حفظ أيضاً باسم snake_case
            position: v.position || 0,
            createdAt: new Date(v.created_at).getTime(),
            courseId: courseId,
            courseTitle: courseInfo?.title || 'Unknown Course',
          });
        });
        
        // Merge local videos that don't exist in backend
        const mergedVideos = [...Array.from(backendMap.values())];
        localTalks.forEach(local => {
          const key = `${local.text}_${local.language}`;
          if (!backendMap.has(key)) {
            mergedVideos.push(local);
          }
        });
        
        // Sort by position
        mergedVideos.sort((a, b) => (a.position || 0) - (b.position || 0));
        
        setSavedTalks(mergedVideos);
        
        // Update course info with video count
        if (courseInfo) {
          setCourseInfo({
            ...courseInfo,
            videos_count: mergedVideos.length,
          });
        }
        
        // Note: Idle state is now handled by static image in Avatar component
      }
    } catch (error) {
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        console.error('Auth error: Token expired or invalid');
        await authAPI.logout();
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.error('Error loading videos from backend:', error);
      // Fallback to local storage
      const localTalks = await getSavedTalks();
      setSavedTalks(localTalks);
    }
  };

  const downloadAndSaveVideo = async (video) => {
    if (!video.remoteVideoUrl) return;
    
    try {
      const fileName = `${video.id}.mp4`;
      const localUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.downloadAsync(video.remoteVideoUrl, localUri);
      
      // Update local storage
      const updated = savedTalks.map(t => 
        t.id === video.id ? { ...t, localUri } : t
      );
      setSavedTalks(updated);
      
      return localUri;
    } catch (error) {
      console.error('Error downloading video:', error);
      return null;
    }
  };

  const handleGenerateAvatar = async (targetCourseId = null, targetCourseInfo = null) => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    if (inputText.length > 500) {
      Alert.alert('Error', 'Text must be 500 characters or less');
      return;
    }

    // استخدام الكورس المحدد أو الكورس الحالي
    const finalCourseId = targetCourseId || courseId;
    const finalCourseInfo = targetCourseInfo || courseInfo;

    if (!finalCourseId) {
      Alert.alert('Error', 'Please select a course first');
      return;
    }

    try {
      setGeneratingVideo(true);
      setVideoGenerationProgress('Checking network...');

      // Check network
      const connectivity = await NetworkService.checkConnectivity();
      if (!connectivity.isConnected) {
        Alert.alert('No Internet', 'Please check your internet connection');
        return;
      }

      setVideoGenerationProgress('Creating avatar video...');

      // Always use English voice
      const voiceId = 'en-US-JennyNeural';

      // Create talk with D-ID
      const talkResult = await createTalkWithFallback(
        inputText,
        AVATAR_CONFIG.defaultImageUrl,
        voiceId
      );

      setVideoGenerationProgress('Waiting for video to be ready...');

      // Poll for video URL
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (!videoUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const talkStatus = await getTalk(talkResult.id);
        
        if (talkStatus.status === 'done' && talkStatus.result_url) {
          videoUrl = talkStatus.result_url;
          break;
        }
        
        attempts++;
        setVideoGenerationProgress(`Processing... (${attempts}/${maxAttempts})`);
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out');
      }

      setVideoGenerationProgress('Saving video...');

      // Save locally
      console.log('Saving video locally...', { text: inputText, language: selectedLanguage, videoUrl });
      const savedTalk = await saveTalk({
        text: inputText,
        language: selectedLanguage,
        remoteVideoUrl: videoUrl,
      });
      console.log('✅ Video saved locally:', savedTalk);

      // Save to Backend
      let backendVideoId = null;
      if (finalCourseId) {
        try {
          const videoResponse = await videosAPI.create(finalCourseId, {
            text: inputText,
            language: selectedLanguage,
            remote_video_url: videoUrl,
            local_uri: savedTalk.localUri,
            video_type: 'normal',
            position: savedTalks.length,
            did_talk_id: talkResult.id,
          });

          if (videoResponse.data.success) {
            backendVideoId = videoResponse.data.data.id;
          }
        } catch (backendError) {
          console.error('Error saving to backend:', backendError);
          // Continue - video is saved locally
        }
      }

      // Update UI
      const newTalk = {
        ...savedTalk,
        backendId: backendVideoId,
        courseId: finalCourseId,
        courseTitle: finalCourseInfo?.title || 'Unknown Course',
        remoteVideoUrl: videoUrl, // تأكد من وجود remoteVideoUrl
        remote_video_url: videoUrl, // حفظ أيضاً باسم snake_case
        didTalkId: talkResult.id, // حفظ did_talk_id
        did_talk_id: talkResult.id, // حفظ أيضاً باسم snake_case
        videoType: 'normal',
        video_type: 'normal',
      };
      const updated = [...savedTalks, newTalk];
      setSavedTalks(updated);
      setCurrentIndex(updated.length - 1);
      
      // تحديث AsyncStorage مع remoteVideoUrl وبيانات إضافية
      await updateTalk(savedTalk.id, {
        remoteVideoUrl: videoUrl,
        remote_video_url: videoUrl,
        didTalkId: talkResult.id,
        did_talk_id: talkResult.id,
        videoType: 'normal',
        video_type: 'normal',
        backendId: backendVideoId,
        courseId: finalCourseId,
        courseTitle: finalCourseInfo?.title || 'Unknown Course',
      });
      
      // Show success message with course name
      if (finalCourseInfo?.title) {
        Alert.alert(
          'Success',
          `Video saved successfully in "${finalCourseInfo.title}"!`,
          [{ text: 'OK' }]
        );
      }
      
      // عرض الفيديو مباشرة بعد إنشائه
      if (savedTalk.localUri) {
        setCurrentVideoUrl(savedTalk.localUri);
        setIsLooping(false);
        // تشغيل الفيديو تلقائياً بعد قليل
        setTimeout(async () => {
          if (videoRef.current) {
            try {
              // Set audio mode before playing (fixes Android Audio Focus issue)
              await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
              });
              
              await videoRef.current.setVolumeAsync(1.0);
              await videoRef.current.setIsMutedAsync(false);
              await videoRef.current.playAsync();
              setIsPlaying(true);
            } catch (playError) {
              console.error('Error playing video:', playError);
              // Try without audio focus
              try {
                await videoRef.current.playAsync();
                setIsPlaying(true);
              } catch (retryError) {
                console.error('Retry play failed:', retryError);
              }
            }
          }
        }, 500);
      } else if (videoUrl) {
        // إذا لم يكن localUri موجود، استخدم remoteVideoUrl مباشرة
        setCurrentVideoUrl(videoUrl);
        setIsLooping(false);
      }
      
      setInputText('');
      
      // Reload videos to sync with backend
      if (finalCourseId) {
        await loadVideosFromBackend();
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      Alert.alert('Error', error.message || 'Failed to generate avatar video');
    } finally {
      setGeneratingVideo(false);
      setVideoGenerationProgress('');
    }
  };

  // Handle course selection before generating video
  const handleGenerateWithCourseSelection = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    // إذا كان هناك أكثر من كورس، عرض modal للاختيار
    if (allCourses.length > 1) {
      setShowCoursePicker(true);
    } else if (allCourses.length === 1) {
      // استخدام الكورس الوحيد مباشرة
      const singleCourse = allCourses[0];
      setCourseId(singleCourse.id);
      setCourseInfo(singleCourse);
      await handleGenerateAvatar(singleCourse.id, singleCourse);
    } else if (courseId && courseInfo) {
      // استخدام الكورس الحالي
      await handleGenerateAvatar(courseId, courseInfo);
    } else {
      Alert.alert('Error', 'Please select a course first');
    }
  };

  const handleShowVideo = () => {
    if (savedTalks.length === 0) {
      Alert.alert('No Videos', 'Please create a video first');
      return;
    }

    const current = savedTalks[currentIndex];
    if (current.localUri) {
      setCurrentVideoUrl(current.localUri);
      setIsLooping(false);
    } else if (current.remoteVideoUrl) {
      // Download if needed
      downloadAndSaveVideo(current).then(uri => {
        if (uri) setCurrentVideoUrl(uri);
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const prevTalk = savedTalks[newIndex];
      if (prevTalk) {
        if (prevTalk.localUri) {
          setCurrentVideoUrl(prevTalk.localUri);
          setIsLooping(false);
        } else if (prevTalk.remoteVideoUrl) {
          downloadAndSaveVideo(prevTalk).then(uri => {
            if (uri) setCurrentVideoUrl(uri);
          });
        } else {
          setCurrentVideoUrl(null);
        }
      }
      setTranscribedText('');
      setAccuracy(null);
      setWordComparison([]);
    }
  };

  const handleNext = () => {
    if (currentIndex < savedTalks.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const nextTalk = savedTalks[newIndex];
      if (nextTalk) {
        if (nextTalk.localUri) {
          setCurrentVideoUrl(nextTalk.localUri);
          setIsLooping(false);
        } else if (nextTalk.remoteVideoUrl) {
          downloadAndSaveVideo(nextTalk).then(uri => {
            if (uri) setCurrentVideoUrl(uri);
          });
        } else {
          setCurrentVideoUrl(null);
        }
      }
      setTranscribedText('');
      setAccuracy(null);
      setWordComparison([]);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      // Set audio mode before playing (fixes Android Audio Focus issue)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const status = await videoRef.current.getStatusAsync();
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // Set volume and unmute before playing
        await videoRef.current.setVolumeAsync(1.0);
        await videoRef.current.setIsMutedAsync(false);
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      // Try to play anyway (without audio focus)
      try {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      } catch (retryError) {
        console.error('Retry play failed:', retryError);
        Alert.alert('Audio Error', 'Cannot play video. Please close other audio apps and try again.');
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    // Return to idle state (static image)
    setCurrentVideoUrl(null);
  };

  const handleStartRecording = async () => {
    if (savedTalks.length === 0) {
      Alert.alert('No Videos', 'Please create a video first');
      return;
    }

    try {
      // Request audio recording permissions
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required to use this feature. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On Android, you might need to use Linking.openSettings()
              Alert.alert('Settings', 'Please go to Settings > Apps > [App Name] > Permissions and enable Microphone');
            }}
          ]
        );
        return;
      }

      const { Recording } = Audio;
      const recording = new Recording();
      
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setTranscribedText('');
      setAccuracy(null);
      setWordComparison([]);
      setSttRetryCount(0);
      setSttRetryMessage('');
      
      // Start recording dot animation
      const dotAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingDotAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingDotAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      dotAnimation.start();
      recordingRef.current._dotAnimation = dotAnimation;
      
      // Start recording timer
      const timerInterval = setInterval(async () => {
        if (recordingRef.current) {
          try {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording && status.durationMillis) {
              setRecordingDuration(Math.floor(status.durationMillis / 1000));
            }
          } catch (error) {
            // Ignore timer errors
          }
        } else {
          clearInterval(timerInterval);
        }
      }, 100);
      
      // Store interval ID for cleanup
      recordingRef.current._timerInterval = timerInterval;
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (error.message.includes('permission') || error.message.includes('Permission')) {
        Alert.alert(
          'Permission Denied',
          'Microphone permission is required. Please enable it in your device settings.',
          [
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to start recording: ' + error.message);
      }
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Clear recording timer and animation
      if (recordingRef.current._timerInterval) {
        clearInterval(recordingRef.current._timerInterval);
      }
      if (recordingRef.current._dotAnimation) {
        recordingRef.current._dotAnimation.stop();
      }
      
      setProcessingSTT(true);
      setSttRetryMessage('Processing audio...');
      
      const status = await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

      // Get current sentence
      const current = savedTalks[currentIndex];
      if (!current) return;

      // Transcribe with Deepgram (with retry logic)
      const languageHint = current.language === 'en' ? 'en' : 'tr';
      let transcription;
      
      try {
        transcription = await transcribeWithDeepgram(uri, languageHint, {
          maxRetries: 3,
          retryDelay: 1000,
          onRetry: (attempt, maxRetries, delay) => {
            setSttRetryCount(attempt);
            setSttRetryMessage(`Retrying transcription... (${attempt}/${maxRetries})`);
          },
        });
        setSttRetryCount(0);
        setSttRetryMessage('');
      } catch (sttError) {
        console.error('STT Error after retries:', sttError);
        setProcessingSTT(false);
        setSttRetryCount(0);
        setSttRetryMessage('');
        
        Alert.alert(
          'Transcription Failed',
          'Failed to transcribe audio after multiple attempts. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      setTranscribedText(transcription.text);

      // Calculate accuracy
      const acc = similarityPercent(current.text, transcription.text);
      setAccuracy(acc);

      // Compare words
      const comparison = compareWords(current.text, transcription.words);
      setWordComparison(comparison);

      // Save report to Backend
      // Check for backendId in both camelCase and snake_case formats
      const videoBackendId = current.backendId || current.backend_id || current.id;
      
      if (courseId && videoBackendId && typeof videoBackendId === 'number') {
        try {
          const incorrectWords = comparison
            .filter(w => !w.isCorrect)
            .map(w => w.word);
          
          const wordDetails = comparison.map(w => ({
            word: w.word || '',
            isCorrect: w.isCorrect || false,
            confidence: w.confidence || 0,
          }));

          // Calculate audio duration safely
          const audioDuration = status?.durationMillis 
            ? Math.round(status.durationMillis / 1000) 
            : recordingDuration || 0;

          // Ensure all required fields are present and valid
          const reportData = {
            accuracy: Math.max(0, Math.min(100, acc || 0)), // Ensure accuracy is between 0-100
            reference_text: current.text || '',
            transcribed_text: transcription.text || '',
            incorrect_words: Array.isArray(incorrectWords) ? incorrectWords : [],
            word_details: Array.isArray(wordDetails) ? wordDetails : [],
            audio_duration: Math.max(0, audioDuration), // Ensure audio_duration is non-negative
          };

          console.log('Saving report to backend:', {
            courseId,
            videoId: videoBackendId,
            reportData,
          });

          await reportsAPI.create(courseId, videoBackendId, reportData);
          console.log('✅ Report saved successfully');
        } catch (backendError) {
          // Handle 401 Unauthorized silently (don't interrupt user flow)
          if (backendError.response?.status === 401) {
            console.error('Auth error: Token expired - report not saved');
            // Token will be cleared by interceptor, user will be prompted on next action
          } else {
            console.error('Error saving report to backend:', backendError);
            console.error('Error response:', backendError.response?.data);
            console.error('Error status:', backendError.response?.status);
            // Log the data that was sent for debugging
            console.error('Report data that failed:', {
              courseId,
              videoId: videoBackendId,
              accuracy: acc,
              reference_text: current.text,
              transcribed_text: transcription.text,
              currentVideo: {
                id: current.id,
                backendId: current.backendId,
                backend_id: current.backend_id,
              },
            });
          }
        }
      } else {
        // Log why report wasn't saved
        if (!courseId) {
          console.warn('⚠️ Report not saved: courseId is missing');
        }
        if (!videoBackendId || typeof videoBackendId !== 'number') {
          console.warn('⚠️ Report not saved: video backendId is missing or invalid (video may be local only)', {
            backendId: current.backendId,
            backend_id: current.backend_id,
            id: current.id,
          });
        }
      }

      // Handle video transitions based on accuracy
      if (acc === 100) {
        // Play success video
        getSuccessTalkId().then(successId => {
          if (successId) {
            const successTalk = savedTalks.find(t => t.id === successId);
            if (successTalk && successTalk.localUri) {
              setCurrentVideoUrl(successTalk.localUri);
              setIsLooping(false);
              setTimeout(() => {
                handleVideoEnd();
              }, 5000); // Return to idle after 5 seconds
            }
          }
        });
      } else {
        // Play retry video
        getRetryTalkId().then(retryId => {
          if (retryId) {
            const retryTalk = savedTalks.find(t => t.id === retryId);
            if (retryTalk && retryTalk.localUri) {
              setCurrentVideoUrl(retryTalk.localUri);
              setIsLooping(false);
              setTimeout(() => {
                handleVideoEnd();
              }, 5000);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setProcessingSTT(false);
    }
  };

  const handleDeleteVideo = async (talkId) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete locally
            await deleteTalk(talkId);
            
            // Delete from Backend if exists
            const talk = savedTalks.find(t => t.id === talkId);
            if (talk && talk.backendId) {
              try {
                await videosAPI.delete(talk.backendId);
              } catch (error) {
                console.error('Error deleting from backend:', error);
              }
            }
            
            // Update UI
            const updated = savedTalks.filter(t => t.id !== talkId);
            setSavedTalks(updated);
            
            if (currentIndex >= updated.length && updated.length > 0) {
              setCurrentIndex(updated.length - 1);
            } else if (updated.length === 0) {
              setCurrentIndex(0);
              setCurrentVideoUrl(null);
            }
          },
        },
      ]
    );
  };

  const handleTransferVideo = async (videoId, newCourseId) => {
    try {
      setTransferringVideo(true);
      
      // الحصول على معلومات الفيديو
      const video = savedTalks.find(t => t.id === videoId);
      if (!video) {
        Alert.alert('Error', 'Video not found');
        return;
      }

      // الحصول على معلومات الكورس الجديد
      const newCourse = allCourses.find(c => c.id === newCourseId);
      if (!newCourse) {
        Alert.alert('Error', 'Course not found');
        return;
      }

      // الحصول على remote_video_url (دعم كلا الاسمين: camelCase و snake_case)
      let remoteVideoUrl = video.remoteVideoUrl || video.remote_video_url;
      
      // إذا لم يكن remote_video_url موجوداً، تحقق من localUri
      if (!remoteVideoUrl) {
        const localUri = video.localUri || video.local_uri;
        
        if (localUri) {
          // إذا كان localUri موجوداً لكن remoteVideoUrl مفقود، نستخدم localUri كـ remote_video_url
          // هذا حل مؤقت - في المستقبل يمكن رفع الفيديو المحلي إلى خدمة تخزين سحابية
          Alert.alert(
            'Video URL Missing',
            'This video is saved locally but the remote URL is missing. We will use the local file path. Note: For better compatibility, please regenerate the video.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Continue',
                onPress: async () => {
                  // استخدام localUri كـ remote_video_url (حل مؤقت)
                  await handleTransferVideoWithLocalUri(videoId, newCourseId, localUri);
                }
              }
            ]
          );
          return;
        } else {
          Alert.alert(
            'Error',
            'Cannot assign video to course: Video file is missing. Please regenerate the video first.'
          );
          return;
        }
      }

      // الحصول على did_talk_id (دعم كلا الاسمين)
      const didTalkId = video.didTalkId || video.did_talk_id;
      
      // الحصول على video_type (دعم كلا الاسمين)
      const videoType = video.videoType || video.video_type || 'normal';

      // إعداد البيانات مع التحقق من القيم
      const videoData = {
        text: video.text || '',
        language: video.language || 'en',
        remote_video_url: remoteVideoUrl, // مطلوب
        video_type: videoType,
        position: 0, // سيتم تحديثه تلقائياً من الـ backend
      };

      // إضافة الحقول الاختيارية فقط إذا كانت موجودة
      const localUri = video.localUri || video.local_uri;
      if (localUri) {
        videoData.local_uri = localUri;
      }
      if (didTalkId) {
        videoData.did_talk_id = didTalkId;
      }

      console.log('Transferring video to course:', {
        videoId,
        newCourseId,
        newCourseTitle: newCourse.title,
        videoData,
        hasBackendId: !!video.backendId
      });

      // إذا كان الفيديو موجود في الـ backend (له backendId)، نقله
      // إذا لم يكن موجود، ننشئه في الكورس الجديد
      let newVideoId;
      
      if (video.backendId) {
        // الفيديو موجود في الـ backend - نقله
        // إنشاء فيديو جديد في الكورس الجديد
        const videoResponse = await videosAPI.create(newCourseId, videoData);
        
        if (videoResponse.data && videoResponse.data.success) {
          newVideoId = videoResponse.data.data.id;
          
          // حذف الفيديو القديم من الكورس القديم
          try {
            await videosAPI.delete(video.backendId);
            console.log('Old video deleted successfully:', video.backendId);
          } catch (deleteError) {
            console.error('Error deleting old video:', deleteError);
            // يمكننا المتابعة حتى لو فشل الحذف - الفيديو الجديد تم إنشاؤه
          }
        } else {
          throw new Error(videoResponse.data?.message || 'Failed to create video in new course');
        }
      } else {
        // الفيديو غير موجود في الـ backend - ننشئه في الكورس الجديد (تخصيص)
        const videoResponse = await videosAPI.create(newCourseId, videoData);
        
        if (videoResponse.data && videoResponse.data.success) {
          newVideoId = videoResponse.data.data.id;
        } else {
          throw new Error(videoResponse.data?.message || 'Failed to create video in new course');
        }
      }

      // تحديث القائمة المحلية
      const updated = savedTalks.map(t => 
        t.id === videoId 
          ? { 
              ...t, 
              backendId: newVideoId,
              courseId: newCourseId,
              courseTitle: newCourse.title 
            }
          : t
      );
      setSavedTalks(updated);
      
      // تحديث AsyncStorage أيضاً
      await updateTalk(videoId, {
        backendId: newVideoId,
        courseId: newCourseId,
        courseTitle: newCourse.title,
      });

      // تحديث courseInfo إذا كان الكورس الجديد هو الكورس الحالي
      if (courseId === newCourseId) {
        // إذا كان الكورس الجديد هو الكورس الحالي، قم بإعادة تحميل الفيديوهات
        setCourseInfo(newCourse);
        await loadVideosFromBackend();
      } else {
        // إذا كان الكورس الجديد مختلف، فقط حدث القائمة المحلية
        // (لن يتم تحميل الفيديوهات إلا إذا غير المستخدم الكورس الحالي)
      }

      Alert.alert(
        'Success',
        `Video ${video.backendId ? 'moved' : 'assigned'} to "${newCourse.title}" successfully!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error transferring video:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // عرض رسالة خطأ أكثر تفصيلاً
      let errorMessage = 'Failed to transfer video';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setTransferringVideo(false);
      setShowCourseTransferModal(false);
      setShowSettings(false);
    }
  };

  // دالة مساعدة لنقل الفيديو باستخدام localUri
  const handleTransferVideoWithLocalUri = async (videoId, newCourseId, localUri) => {
    try {
      setTransferringVideo(true);
      
      const video = savedTalks.find(t => t.id === videoId);
      if (!video) {
        Alert.alert('Error', 'Video not found');
        return;
      }

      const newCourse = allCourses.find(c => c.id === newCourseId);
      if (!newCourse) {
        Alert.alert('Error', 'Course not found');
        return;
      }

      // استخدام localUri كـ remote_video_url (حل مؤقت)
      // في المستقبل، يمكن رفع الفيديو إلى خدمة تخزين سحابية
      const videoData = {
        text: video.text || '',
        language: video.language || 'en',
        remote_video_url: localUri, // استخدام localUri كـ remote_video_url
        video_type: (video.videoType || video.video_type || 'normal'),
        position: 0,
      };

      if (localUri) {
        videoData.local_uri = localUri;
      }

      const didTalkId = video.didTalkId || video.did_talk_id;
      if (didTalkId) {
        videoData.did_talk_id = didTalkId;
      }

      const videoResponse = await videosAPI.create(newCourseId, videoData);

      if (videoResponse.data && videoResponse.data.success) {
        const newVideoId = videoResponse.data.data.id;

        // تحديث القائمة المحلية
        const updated = savedTalks.map(t => 
          t.id === videoId 
            ? { 
                ...t, 
                backendId: newVideoId,
                courseId: newCourseId,
                courseTitle: newCourse.title,
                remoteVideoUrl: localUri, // حفظ localUri كـ remoteVideoUrl
                remote_video_url: localUri,
              }
            : t
        );
        setSavedTalks(updated);

        // تحديث AsyncStorage
        await updateTalk(videoId, {
          backendId: newVideoId,
          courseId: newCourseId,
          courseTitle: newCourse.title,
          remoteVideoUrl: localUri,
          remote_video_url: localUri,
        });

        if (courseId === newCourseId) {
          setCourseInfo(newCourse);
          await loadVideosFromBackend();
        }

        Alert.alert(
          'Success',
          `Video assigned to "${newCourse.title}" successfully!`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error transferring video with local URI:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to assign video to course'
      );
    } finally {
      setTransferringVideo(false);
      setShowCourseTransferModal(false);
      setShowSettings(false);
    }
  };

  const handleReorderVideo = async (talkId, direction) => {
    const result = await reorderTalk(talkId, direction);
    if (result) {
      const updated = await getSavedTalks();
      setSavedTalks(updated);
      
      // Update position in Backend
      const talk = savedTalks.find(t => t.id === talkId);
      if (talk && talk.backendId) {
        try {
          await videosAPI.update(talk.backendId, {
            position: result.newIndex,
          });
        } catch (error) {
          console.error('Error updating position in backend:', error);
        }
      }
    }
  };

  const handleSetVideoType = async (talkId, type) => {
    const setter = type === 'idle' ? setIdleTalkId : type === 'success' ? setSuccessTalkId : setRetryTalkId;
    await setter(talkId);
    
    // Update in Backend
    const talk = savedTalks.find(t => t.id === talkId);
    if (talk && talk.backendId) {
      try {
        await videosAPI.update(talk.backendId, {
          video_type: type,
        });
      } catch (error) {
        console.error('Error updating video type in backend:', error);
      }
    }
    
    Alert.alert('Success', `Video set as ${type} video`);
  };

  // ==================== Courses Management Functions ====================
  
  const loadCoursesData = async () => {
    try {
      setLoadingCourses(true);
      const userInfo = await authAPI.getStoredUserInfo();
      setMembership(userInfo.membership || 'free');
      
      if (userInfo.id) {
        const response = await coursesAPI.getUserCourses(userInfo.id);
        if (response.data.success) {
          setCourses(response.data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCreateCourse = async () => {
    if (membership !== 'premium') {
      const existingCount = courses.length;
      if (existingCount >= 1) {
        Alert.alert(
          'Premium Required',
          'Free users can only create one course. Please upgrade to premium to create more courses.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (!courseTitle.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    try {
      setCreating(true);
      const response = await coursesAPI.create({
        title: courseTitle.trim(),
        description: courseDescription.trim() || null,
        language: courseLanguage,
        level: courseLevel,
        is_published: false,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Course created successfully!');
        setCourseTitle('');
        setCourseDescription('');
        setShowCreateForm(false);
        await loadCoursesData();
        // Update allCourses and set as active
        const updatedResponse = await coursesAPI.getUserCourses(userId);
        if (updatedResponse.data.success) {
          setAllCourses(updatedResponse.data.data || []);
          const newCourse = updatedResponse.data.data.find(c => c.id === response.data.data.id);
          if (newCourse) {
            setCourseId(newCourse.id);
            setCourseInfo(newCourse);
          }
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleSetActive = async (courseId) => {
    try {
      const response = await coursesAPI.setActive(courseId);
      if (response.data.success) {
        Alert.alert('Success', 'Course set as active!');
        await loadCoursesData();
        // Update courseInfo
        const course = courses.find(c => c.id === courseId);
        if (course) {
          setCourseId(courseId);
          setCourseInfo({ ...course, is_active: true });
        }
        // Reload all courses
        const updatedResponse = await coursesAPI.getUserCourses(userId);
        if (updatedResponse.data.success) {
          setAllCourses(updatedResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error('Error setting active course:', error);
      Alert.alert('Error', 'Failed to set course as active');
    }
  };

  const handleViewVideos = (courseId, courseTitle) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Videos', { courseId, courseTitle });
    } else {
      Alert.alert('Info', 'Videos: ' + courseTitle);
    }
  };

  const handleViewReports = (courseId, courseTitle) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Reports', { courseId, courseTitle });
    } else {
      Alert.alert('Info', 'Reports: ' + courseTitle);
    }
  };

  const handleUpgrade = async () => {
    if (!userId) return;
    
    Alert.alert(
      'Upgrade to Premium',
      'Are you sure you want to upgrade to Premium?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              const response = await usersAPI.upgrade(userId);
              if (response.data.success) {
                Alert.alert('Success', 'Account upgraded to Premium!');
                setMembership('premium');
                await loadCoursesData();
              }
            } catch (error) {
              console.error('Error upgrading:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to upgrade account');
            }
          },
        },
      ]
    );
  };


  if (loadingCourse) {
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading...</Text>
      </View>
      </SafeAreaView>
    );
  }

  const current = savedTalks[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Top Section - Course Selector */}
        {allCourses.length > 0 && courseInfo && (
          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.courseSelectorCard}
              onPress={() => setShowCourseSelector(true)}
            >
              <View style={styles.courseSelectorHeader}>
                <Text style={styles.courseSelectorIcon}>📚</Text>
                <View style={styles.courseSelectorInfo}>
                  <Text style={styles.courseSelectorTitle}>
                    {courseInfo.title}
                    {courseInfo.is_active && ' ⭐'}
                </Text>
                  <Text style={styles.courseSelectorStats}>
                    {courseInfo.videos_count || 0} videos • {courseInfo.reports_count || 0} reports
                  </Text>
                </View>
                <Text style={styles.courseSelectorArrow}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Internal Tabs Navigation */}
        <View style={styles.internalTabs}>
          <TouchableOpacity
            style={[styles.internalTab, activeTab === 'practice' && styles.internalTabActive]}
            onPress={() => setActiveTab('practice')}
          >
            <Text style={[styles.internalTabText, activeTab === 'practice' && styles.internalTabTextActive]}>
              🎯 Practice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.internalTab, activeTab === 'courses' && styles.internalTabActive]}
            onPress={() => setActiveTab('courses')}
          >
            <Text style={[styles.internalTabText, activeTab === 'courses' && styles.internalTabTextActive]}>
              📚 Courses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Practice Tab Content */}
        {activeTab === 'practice' && (
          <View style={styles.tabContent}>
            {/* Simple Header */}
            <View style={styles.simpleHeader}>
              <Text style={styles.simpleHeaderText}>English Home</Text>
            </View>

        {/* Avatar Display - Always Visible (at the top) */}
        <Avatar
          videoUrl={currentVideoUrl}
          idleImageUrl={AVATAR_CONFIG.defaultImageUrl}
          onPlayPause={handlePlayPause}
          isPlaying={isPlaying}
          videoRef={videoRef}
          onVideoEnd={handleVideoEnd}
          isLooping={isLooping}
        />

        {/* Current Sentence Card - Prominent Display */}
        {savedTalks.length > 0 && current && (
          <View style={styles.currentSentenceCard}>
            <View style={styles.cardHeader}>
              {current.courseTitle && (
                <Text style={styles.cardCourseName}>📚 {current.courseTitle}</Text>
              )}
              <Text style={styles.cardCounter}>
                {currentIndex + 1} / {savedTalks.length}
              </Text>
            </View>
            <Text style={styles.cardSentenceText}>{current.text}</Text>
          </View>
        )}

        {/* Improved Horizontal List */}
        {savedTalks.length > 0 && (
          <View style={styles.videosListContainer}>
            <Text style={styles.videosListTitle}>
              📚 All Sentences ({savedTalks.length})
            </Text>
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.videosListScroll}
              contentContainerStyle={styles.videosListContent}
            >
              {savedTalks.map((talk, index) => (
                <TouchableOpacity
                  key={talk.id}
                  style={[
                    styles.videoItem,
                    index === currentIndex && styles.videoItemActive
                  ]}
                  onPress={() => {
                    setCurrentIndex(index);
                    // Auto-scroll to selected item
                    scrollViewRef.current?.scrollTo({
                      x: index * 130,
                      animated: true
                    });
                    if (talk.localUri) {
                      setCurrentVideoUrl(talk.localUri);
                      setIsLooping(false);
                    } else if (talk.remoteVideoUrl) {
                      downloadAndSaveVideo(talk).then(uri => {
                        if (uri) setCurrentVideoUrl(uri);
                      });
                    }
                    setTranscribedText('');
                    setAccuracy(null);
                    setWordComparison([]);
                  }}
                >
                  <View style={styles.videoItemContent}>
                    <Text style={styles.videoItemNumber}>{index + 1}</Text>
                    <Text 
                      style={[
                        styles.videoItemText,
                        index === currentIndex && styles.videoItemTextActive
                      ]}
                      numberOfLines={3}
                    >
                      {talk.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
      </ScrollView>
          </View>
        )}

        {/* Compact Navigation Bar */}
        {savedTalks.length > 0 && (
          <View style={styles.compactNavBar}>
            <TouchableOpacity
              style={[styles.navButtonCompact, currentIndex === 0 && styles.navButtonDisabled]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
            >
              <Text style={styles.navButtonIcon}>⬅️</Text>
              <Text style={styles.navButtonLabel}>Prev</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.navButtonCompact}
              onPress={handleShowVideo}
            >
              <Text style={styles.navButtonIcon}>▶️</Text>
              <Text style={styles.navButtonLabel}>Play</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButtonCompact, currentIndex === savedTalks.length - 1 && styles.navButtonDisabled]}
              onPress={handleNext}
              disabled={currentIndex === savedTalks.length - 1}
            >
              <Text style={styles.navButtonIcon}>➡️</Text>
              <Text style={styles.navButtonLabel}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Text Input - At the end */}
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter your text here..."
          language="english"
        />

        {/* Recording Section - Display only when recording */}
        {savedTalks.length > 0 && current && isRecording && (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingActiveContainer}>
              <TouchableOpacity
                style={[styles.recordButton, styles.recordButtonStop]}
                onPress={handleStopRecording}
              >
                <Text style={styles.recordButtonText}>⏹️ Stop Recording</Text>
              </TouchableOpacity>
              <View style={styles.recordingIndicator}>
                <Animated.View 
                  style={[
                    styles.recordingDot, 
                    styles.recordingDotActive,
                    { opacity: recordingDotAnimation }
                  ]} 
                />
                <Text style={styles.recordingDuration}>
                  Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            </View>

            {processingSTT && (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#0ea5e9" size="large" />
                <Text style={styles.processingText}>
                  {sttRetryMessage || 'Processing audio...'}
                </Text>
                {sttRetryCount > 0 && (
                  <Text style={styles.retryText}>
                    Retry attempt {sttRetryCount} of 3
                  </Text>
                )}
              </View>
            )}

            {transcribedText && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Your Pronunciation:</Text>
                <HighlightedText words={wordComparison} />
                {accuracy !== null && (
                  <Text style={[styles.accuracyText, accuracy === 100 && styles.accuracyPerfect]}>
                    Accuracy: {accuracy.toFixed(1)}%
                </Text>
                )}
              </View>
            )}
          </View>
        )}
          </View>
        )}

        {/* Courses Tab Content */}
        {activeTab === 'courses' && (
          <View style={styles.tabContent}>
            {membership !== 'premium' && (
              <View style={styles.upgradeBanner}>
                <Text style={styles.upgradeText}>
                  ⭐ Upgrade to Premium to create unlimited courses!
                </Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Create Course Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (membership !== 'premium' && courses.length >= 1) && styles.createButtonDisabled,
                ]}
                onPress={() => setShowCreateForm(!showCreateForm)}
                disabled={membership !== 'premium' && courses.length >= 1}
              >
                <Text style={styles.createButtonText}>
                  {showCreateForm ? 'Cancel' : '+ Create New Course'}
                </Text>
              </TouchableOpacity>

              {/* Create Course Form */}
              {showCreateForm && (membership === 'premium' || courses.length < 1) && (
                <View style={styles.createForm}>
                  <TextInput
                    placeholder="Course Title *"
                    placeholderTextColor="#94a3b8"
                    value={courseTitle}
                    onChangeText={setCourseTitle}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Description (optional)"
                    placeholderTextColor="#94a3b8"
                    value={courseDescription}
                    onChangeText={setCourseDescription}
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.languageContainer}>
                    <Text style={styles.label}>Language:</Text>
                    <View style={styles.languageButtons}>
                      {['en', 'tr'].map((lang) => (
                        <TouchableOpacity
                          key={lang}
                          style={[
                            styles.languageButton,
                            courseLanguage === lang && styles.languageButtonActive,
                          ]}
                          onPress={() => setCourseLanguage(lang)}
                        >
                          <Text
                            style={[
                              styles.languageButtonText,
                              courseLanguage === lang && styles.languageButtonTextActive,
                            ]}
                          >
                            {lang === 'en' ? '🇺🇸 English' : '🇹🇷 Türkçe'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.levelContainer}>
                    <Text style={styles.label}>Level:</Text>
                    <View style={styles.levelButtons}>
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.levelButton,
                            courseLevel === level && styles.levelButtonActive,
                          ]}
                          onPress={() => setCourseLevel(level)}
                        >
                          <Text
                            style={[
                              styles.levelButtonText,
                              courseLevel === level && styles.levelButtonTextActive,
                            ]}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                    onPress={handleCreateCourse}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create Course</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Courses List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Your Courses ({courses.length})
              </Text>

              {loadingCourses ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#0ea5e9" />
                  <Text style={styles.loadingText}>Loading courses...</Text>
                </View>
              ) : courses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📚</Text>
                  <Text style={styles.emptyText}>No courses yet</Text>
                  <Text style={styles.emptySubtext}>
                    {membership === 'premium'
                      ? 'Create your first course above to start learning!'
                      : 'Upgrade to Premium to create unlimited courses'}
                  </Text>
                </View>
              ) : (
                courses.map((course) => (
                  <View
                    key={course.id}
                    style={[
                      styles.courseCard,
                      course.is_active && styles.courseCardActive,
                    ]}
                  >
                    <View style={styles.courseHeader}>
                      <View style={styles.courseTitleContainer}>
                        <Text style={styles.courseTitle}>{course.title}</Text>
                        {course.is_active && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>⭐ Active</Text>
                          </View>
                        )}
                        {course.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>🏠 Default</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.courseBadges}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {course.language?.toUpperCase() || 'EN'}
                          </Text>
                        </View>
                        {course.level && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{course.level}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {course.description && (
                      <Text style={styles.courseDescription}>{course.description}</Text>
                    )}

                    {/* Statistics */}
                    <View style={styles.courseStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statIcon}>🎥</Text>
                        <Text style={styles.statText}>
                          {course.videos_count || 0} Videos
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statIcon}>📊</Text>
                        <Text style={styles.statText}>
                          {course.reports_count || 0} Reports
                        </Text>
                      </View>
                    </View>

                    <View style={styles.courseActions}>
                      {!course.is_active && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonPrimary]}
                          onPress={() => handleSetActive(course.id)}
                        >
                          <Text style={styles.actionButtonText}>⭐ Set Active</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewVideos(course.id, course.title)}
                      >
                        <Text style={styles.actionButtonText}>🎥 Videos</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewReports(course.id, course.title)}
                      >
                        <Text style={styles.actionButtonText}>📊 Reports</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Course Selector Modal */}
      <Modal
        visible={showCourseSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCourseSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Course</Text>
            
            <ScrollView style={styles.courseList}>
              {allCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseOption,
                    course.id === courseId && styles.courseOptionActive
                  ]}
                  onPress={async () => {
                    try {
                      // Set as active if not already active
                      if (!course.is_active) {
                        await coursesAPI.setActive(course.id);
                      }
                      setCourseId(course.id);
                      setCourseInfo(course);
                      setShowCourseSelector(false);
                      // Reload videos for new course
                      await loadVideosFromBackend();
                    } catch (error) {
                      console.error('Error switching course:', error);
                      Alert.alert('Error', 'Failed to switch course');
                    }
                  }}
                >
                  <View style={styles.courseOptionHeader}>
                    <Text style={styles.courseOptionTitle}>{course.title}</Text>
                    {course.is_active && (
                      <Text style={styles.courseOptionActiveBadge}>⭐ Active</Text>
                    )}
                  </View>
                  <Text style={styles.courseOptionStats}>
                    {course.videos_count || 0} videos • {course.reports_count || 0} reports
                  </Text>
                  {course.description && (
                    <Text style={styles.courseOptionDescription} numberOfLines={2}>
                      {course.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCourseSelector(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Course Picker Modal for New Videos */}
      <Modal
        visible={showCoursePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCoursePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Course for New Video</Text>
            <ScrollView style={styles.courseList}>
              {allCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseOption}
                  onPress={async () => {
                    setShowCoursePicker(false);
                    setCourseId(course.id);
                    setCourseInfo(course);
                    await handleGenerateAvatar(course.id, course);
                  }}
                >
                  <View style={styles.courseOptionHeader}>
                    <Text style={styles.courseOptionTitle}>{course.title}</Text>
                    {course.is_active && (
                      <Text style={styles.courseOptionActiveBadge}>⭐ Active</Text>
                    )}
                  </View>
                  <Text style={styles.courseOptionStats}>
                    {course.videos_count || 0} videos • {course.reports_count || 0} reports
                  </Text>
                  {course.description && (
                    <Text style={styles.courseOptionDescription} numberOfLines={2}>
                      {course.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCoursePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Video Settings</Text>
            
            {current && (
              <>
                <Text style={styles.modalSubtitle}>{current.text}</Text>
                {current.courseTitle && (
                  <Text style={styles.modalSubtitle}>
                    📚 Current Course: {current.courseTitle}
                  </Text>
                )}
                
                <View style={styles.modalButtons}>
                  {/* Move to Course Button */}
                  <TouchableOpacity
                    style={[styles.modalButton, styles.transferButton]}
                    onPress={() => {
                      setShowSettings(false);
                      setShowCourseTransferModal(true);
                    }}
                  >
                    <Text style={[styles.modalButtonText, styles.transferButtonText]}>
                      📚 Move to Course
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Delete Button */}
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => {
                      handleDeleteVideo(current.id);
                      setShowSettings(false);
                    }}
                  >
                    <Text style={[styles.modalButtonText, styles.deleteButtonText]}>
                      🗑️ Delete Video
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Course Transfer Modal */}
      <Modal
        visible={showCourseTransferModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCourseTransferModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {current?.backendId ? 'Move Video to Course' : 'Assign Video to Course'}
            </Text>
            
            {current && (
              <>
                <Text style={styles.modalSubtitle}>
                  Current: {current.courseTitle || 'No Course'}
                  {!current.backendId && ' (Local Only)'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  {current.text}
                </Text>
                {!current.backendId && (
                  <Text style={styles.modalInfoText}>
                    ℹ️ This video is saved locally. Assigning it to a course will upload it to the backend.
                  </Text>
                )}
                
                <ScrollView style={styles.courseList}>
                  {allCourses.length === 0 ? (
                    <Text style={styles.emptyText}>No courses available</Text>
                  ) : (
                    allCourses.map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.courseOption,
                          current.courseId === course.id && styles.courseOptionActive
                        ]}
                        onPress={() => {
                          if (current.courseId === course.id) {
                            Alert.alert('Info', 'Video is already in this course');
                            return;
                          }
                          handleTransferVideo(current.id, course.id);
                        }}
                        disabled={transferringVideo || current.courseId === course.id}
                      >
                        <View style={styles.courseOptionHeader}>
                          <Text style={styles.courseOptionTitle}>{course.title}</Text>
                          <View style={styles.courseOptionBadges}>
                            {course.is_active && (
                              <Text style={styles.courseOptionActiveBadge}>⭐ Active</Text>
                            )}
                            {current.courseId === course.id && (
                              <Text style={styles.courseOptionCurrentBadge}>📍 Current</Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.courseOptionStats}>
                          {course.videos_count || 0} videos • {course.reports_count || 0} reports
                        </Text>
                        {course.description && (
                          <Text style={styles.courseOptionDescription} numberOfLines={2}>
                            {course.description}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                
                {transferringVideo && (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text style={styles.processingText}>Moving video...</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCourseTransferModal(false)}
                  disabled={transferringVideo}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Fixed Bottom Bar - Only in Practice Tab */}
      {activeTab === 'practice' && (
        <View style={styles.fixedBottomBar}>
          {/* Generate Avatar Button */}
          <TouchableOpacity
            style={[styles.bottomBarButton, styles.generateButtonBottom, generatingVideo && styles.bottomBarButtonDisabled]}
            onPress={handleGenerateWithCourseSelection}
            disabled={generatingVideo}
          >
            {generatingVideo ? (
              <View style={styles.bottomBarButtonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.bottomBarButtonText} numberOfLines={1}>
                  {videoGenerationProgress || 'Generating...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.bottomBarButtonText}>🎭 Generate</Text>
            )}
          </TouchableOpacity>

          {/* Start Recording Button - Only show if there are saved videos */}
          {savedTalks.length > 0 && current && !isRecording && (
            <TouchableOpacity
              style={[styles.bottomBarButton, styles.recordButtonBottom]}
              onPress={handleStartRecording}
            >
              <Text style={styles.bottomBarButtonText}>🎤 Record</Text>
            </TouchableOpacity>
          )}

          {/* Stop Recording Button - Only show when recording */}
          {isRecording && (
            <TouchableOpacity
              style={[styles.bottomBarButton, styles.recordButtonBottom, styles.recordButtonStopBottom]}
              onPress={handleStopRecording}
            >
              <Text style={styles.bottomBarButtonText}>⏹️ Stop</Text>
            </TouchableOpacity>
          )}

          {/* Settings Button - Only show if there are saved videos */}
          {savedTalks.length > 0 && (
            <TouchableOpacity
              style={[styles.bottomBarButton, styles.settingsButtonBottom]}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.bottomBarButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#2196F3',
    fontSize: 18,
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 80, // Space for fixed bottom bar
  },
  header: {
    padding: 25,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  simpleHeader: {
    marginBottom: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  simpleHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 10,
  },
  courseInfo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  courseInfoText: {
    color: '#4CAF50',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  languageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  languageButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#1a3a5a',
  },
  languageText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  languageTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Current Sentence Card Styles
  currentSentenceCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  cardCourseName: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  cardCounter: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 'bold',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardSentenceText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 10,
    textAlign: 'center',
  },
  cardBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  cardBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  // Improved Videos List Styles
  videosListContainer: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  videosListTitle: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  videosListScroll: {
    maxHeight: 140,
  },
  videosListContent: {
    paddingRight: 10,
  },
  videoItem: {
    minWidth: 120,
    maxWidth: 130,
    marginHorizontal: 8,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  videoItemActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#16213e',
    transform: [{ scale: 1.05 }],
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  videoItemContent: {
    alignItems: 'center',
  },
  videoItemNumber: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: 'bold',
    marginBottom: 6,
    backgroundColor: '#1e293b',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  videoItemText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  videoItemTextActive: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  videoItemType: {
    color: '#FF9800',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  // Compact Navigation Bar Styles
  compactNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  navButtonCompact: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
    minWidth: 80,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navButtonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#64748b',
  },
  recordingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  recordingActiveContainer: {
    marginBottom: 15,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
    marginRight: 8,
  },
  recordingDotActive: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingDuration: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  recordButtonStop: {
    backgroundColor: '#F44336',
    marginBottom: 0,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    padding: 15,
  },
  processingText: {
    color: '#0ea5e9',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  retryText: {
    color: '#fbbf24',
    marginTop: 5,
    fontSize: 12,
    fontStyle: 'italic',
  },
  resultsContainer: {
    marginTop: 15,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  accuracyText: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  accuracyPerfect: {
    color: '#4CAF50',
  },
  settingsButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  modalTitle: {
    color: '#2196F3',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalSubtitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalInfoText: {
    color: '#0ea5e9',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  modalButtons: {
    gap: 10,
  },
  modalButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonText: {
    color: '#2196F3',
    fontSize: 16,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#3a1a1a',
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  transferButton: {
    backgroundColor: '#0f172a',
    borderColor: '#0ea5e9',
  },
  transferButtonText: {
    color: '#0ea5e9',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  courseSelector: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  courseSelectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseSelectorSubtext: {
    color: '#94a3b8',
    fontSize: 12,
  },
  courseList: {
    maxHeight: 400,
    marginVertical: 15,
  },
  courseOption: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  courseOptionActive: {
    borderColor: '#fbbf24',
    borderWidth: 2,
    backgroundColor: '#1e293b',
  },
  courseOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseOptionBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  courseOptionActiveBadge: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  courseOptionCurrentBadge: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  courseOptionStats: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 5,
  },
  courseOptionDescription: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 5,
  },
  topSection: {
    padding: 15,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0ea5e9',
  },
  courseSelectorCard: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  courseSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseSelectorIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  courseSelectorInfo: {
    flex: 1,
  },
  courseSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  courseSelectorStats: {
    fontSize: 12,
    color: '#94a3b8',
  },
  courseSelectorArrow: {
    fontSize: 24,
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  internalTabs: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0ea5e9',
  },
  internalTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  internalTabActive: {
    backgroundColor: '#0ea5e9',
  },
  internalTabText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  internalTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 15,
  },
  upgradeBanner: {
    backgroundColor: '#fbbf24',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#1a1a2e',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  createButtonDisabled: {
    backgroundColor: '#3a3a3a',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createForm: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  languageButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  languageButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  levelContainer: {
    marginBottom: 15,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  levelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  levelButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  levelButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  courseCard: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  courseCardActive: {
    borderColor: '#fbbf24',
    borderWidth: 2,
    backgroundColor: '#1e293b',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseTitleContainer: {
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  badgeText: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 15,
    lineHeight: 20,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  courseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  actionButtonPrimary: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  actionButtonText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '600',
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#16213e',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 1000,
  },
  bottomBarButton: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
  },
  bottomBarButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomBarButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonBottom: {
    backgroundColor: '#0ea5e9',
  },
  recordButtonBottom: {
    backgroundColor: '#4CAF50',
  },
  recordButtonStopBottom: {
    backgroundColor: '#dc2626',
  },
  settingsButtonBottom: {
    backgroundColor: '#64748b',
    flex: 0.5,
  },
});
