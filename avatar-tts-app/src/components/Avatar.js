import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');

const Avatar = ({ videoUrl, onPlayPause, isPlaying, videoRef, onVideoEnd, isLooping = false, idleImageUrl = null }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (idleImageUrl && !videoUrl) {
      // Animation للصورة الثابتة (pulse effect)
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [idleImageUrl, videoUrl, pulseAnim]);

  const handleRestart = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.setVolumeAsync(1.0);
        await videoRef.current.setIsMutedAsync(false);
        await videoRef.current.playAsync();
      } catch (error) {
        console.error('Error restarting video:', error);
        // Try to play anyway
        try {
          await videoRef.current.playAsync();
        } catch (retryError) {
          console.error('Retry restart failed:', retryError);
        }
      }
    }
  };

  // إذا كان هناك فيديو، اعرضه
  if (videoUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Katya assistant</Text>
        
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            useNativeControls={false}
            resizeMode="contain"
            shouldPlay={isLooping}
            isLooping={isLooping}
            volume={1.0}
            isMuted={false}
            playsInSilentModeIOS={true}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish && onVideoEnd && !isLooping) {
                onVideoEnd();
              }
            }}
          />
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={onPlayPause}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
          
          {/* Restart Button */}
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestart}
          >
            <Text style={styles.restartButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.instruction}>
          ▶️ Play/Pause | 🔄 Restart from beginning
        </Text>
      </View>
    );
  }

  // إذا لم يكن هناك فيديو، اعرض الصورة الثابتة (idle state)
  if (idleImageUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Katya assistant</Text>
        
        <Animated.View 
          style={[
            styles.imageContainer,
            { opacity: pulseAnim }
          ]}
        >
          <Image
            source={{ uri: idleImageUrl }}
            style={styles.idleImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Katya assistant</Text>
      
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls={false}
          resizeMode="contain"
          shouldPlay={isLooping}
          isLooping={isLooping}
          volume={1.0}
          isMuted={false}
          playsInSilentModeIOS={true}
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish && onVideoEnd && !isLooping) {
              onVideoEnd();
            }
          }}
        />
        
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlayPause}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>
        
        {/* Restart Button */}
        <TouchableOpacity
          style={styles.restartButton}
          onPress={handleRestart}
        >
          <Text style={styles.restartButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instruction}>
        ▶️ Play/Pause | 🔄 Restart from beginning
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2196F3',
    marginBottom: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  videoContainer: {
    position: 'relative',
    width: width - 80,
    height: (width - 80) * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2196F3',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: width - 80,
    height: (width - 80) * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  idleImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  restartButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  restartButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  instruction: {
    fontSize: 15,
    color: '#E0E0E0',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
});

export default Avatar;
