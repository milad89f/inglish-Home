import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthScreen from './src/screens/AuthScreen';
import LLMFeaturesScreen from './src/screens/LLMFeaturesScreen';
import VideosScreen from './src/screens/VideosScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
// Import the original App component as MainApp
import MainAppComponent from './MainApp';
import { authAPI } from './src/services/api';

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'courses', 'llm', 'profile', 'videos', 'reports'
  const [navigationParams, setNavigationParams] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Web için console log
    if (Platform.OS === 'web') {
      console.log('🌐 Running on Web platform');
      console.log('🔗 API Base URL:', 'http://localhost:3001/api/v1');
    }
    
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setError(null);
      const authenticated = await authAPI.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userInfo = await authAPI.getStoredUserInfo();
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError(error.message || 'Authentication check failed');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    // تحديث user state مع البيانات الكاملة
    const userInfo = await authAPI.getStoredUserInfo();
    setUser({
      ...userData,
      ...userInfo,
    });
    setIsAuthenticated(true);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentScreen('home');
  };

  // Error display
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={checkAuth}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <Text style={styles.debugText}>
              Check browser console (F12) for more details
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
          {Platform.OS === 'web' && (
            <Text style={styles.debugText}>
              If this takes too long, check browser console (F12)
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'home' && styles.tabActive]}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabText, currentScreen === 'home' && styles.tabTextActive]}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'llm' && styles.tabActive]}
          onPress={() => setCurrentScreen('llm')}
        >
          <Text style={styles.tabIcon}>🤖</Text>
          <Text style={[styles.tabText, currentScreen === 'llm' && styles.tabTextActive]}>
            AI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'profile' && styles.tabActive]}
          onPress={async () => {
            setCurrentScreen('profile');
            // تحديث بيانات المستخدم عند فتح Profile
            const userInfo = await authAPI.getStoredUserInfo();
            setUser(userInfo);
          }}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabText, currentScreen === 'profile' && styles.tabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {currentScreen === 'home' && (
          <MainAppComponent
            navigation={{
              navigate: (screen, params) => {
                setNavigationParams(params);
                setCurrentScreen(screen);
              },
              goBack: () => {
                setCurrentScreen('home');
                setNavigationParams(null);
              },
            }}
          />
        )}
        {currentScreen === 'llm' && <LLMFeaturesScreen />}
        {currentScreen === 'profile' && (
          <ProfileScreen
            onLogout={handleLogout}
            navigation={{
              addListener: (event, callback) => {
                // Simulate navigation focus event when screen is shown
                if (currentScreen === 'profile') {
                  callback();
                }
                return () => {}; // cleanup function
              },
            }}
          />
        )}
        {currentScreen === 'Videos' && navigationParams && (
          <VideosScreen
            route={{ params: navigationParams }}
            navigation={{
              goBack: () => {
                setCurrentScreen('home');
                setNavigationParams(null);
              },
            }}
          />
        )}
        {currentScreen === 'Reports' && navigationParams && (
          <ReportsScreen
            route={{ params: navigationParams }}
            navigation={{
              goBack: () => {
                setCurrentScreen('home');
                setNavigationParams(null);
              },
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#0ea5e9',
    fontSize: 18,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
    borderBottomWidth: 0,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

