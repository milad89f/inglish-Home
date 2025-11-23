import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, Audio } from 'expo-av';
import { coursesAPI, videosAPI } from '../services/api';
import Avatar from '../components/Avatar';

export default function VideosScreen({ route, navigation }) {
  const { courseId, courseTitle } = route.params;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getVideos(courseId);
      if (response.data.success) {
        setVideos(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await videosAPI.delete(videoId);
              loadVideos();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  const handlePlayVideo = async (video) => {
    try {
      // Set audio mode before playing
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      setSelectedVideo(video);
      setShowVideoModal(true);
      setIsPlaying(false);
      setIsLooping(false);
    } catch (error) {
      console.error('Error preparing video:', error);
      Alert.alert('Error', 'Failed to load video');
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.setVolumeAsync(1.0);
        await videoRef.current.setIsMutedAsync(false);
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleCloseModal = () => {
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    setShowVideoModal(false);
    setSelectedVideo(null);
    setIsPlaying(false);
    setIsLooping(false);
  };

  // Get video URL (prefer local_uri, fallback to remote_video_url)
  const getVideoUrl = (video) => {
    if (video.local_uri) {
      return video.local_uri;
    }
    return video.remote_video_url;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{courseTitle} - Videos</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos yet</Text>
            <Text style={styles.emptySubtext}>
              Create videos in the Home tab to see them here
            </Text>
          </View>
        ) : (
          videos.map((video) => (
            <View key={video.id} style={styles.videoCard}>
              <Text style={styles.videoText}>{video.text}</Text>
              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoText}>
                  Language: {video.language}
                </Text>
                <Text style={styles.videoInfoText}>
                  Type: {video.video_type || 'normal'}
                </Text>
                {video.position !== null && (
                  <Text style={styles.videoInfoText}>
                    Position: {video.position}
                  </Text>
                )}
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => handlePlayVideo(video)}
                >
                  <Text style={styles.playButtonText}>▶️ Play Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteVideo(video.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedVideo?.text || 'Video Player'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedVideo && (
              <View style={styles.videoPlayerContainer}>
                <Avatar
                  videoUrl={getVideoUrl(selectedVideo)}
                  onPlayPause={handlePlayPause}
                  isPlaying={isPlaying}
                  videoRef={videoRef}
                  onVideoEnd={handleVideoEnd}
                  isLooping={isLooping}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  backButton: {
    color: '#0ea5e9',
    fontSize: 16,
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
  videoCard: {
    backgroundColor: '#16213e',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  videoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  videoInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  videoInfoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  playButton: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  videoPlayerContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

