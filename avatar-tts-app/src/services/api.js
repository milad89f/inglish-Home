import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Backend API Configuration
// Auto-detect the correct URL based on platform
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    // ⚠️ للجهاز الحقيقي أو Emulator: استخدم IP الكمبيوتر
    // احصل على IP من: ipconfig في PowerShell
    const COMPUTER_IP = '192.168.1.106'; // ⚠️ غيّر هذا إذا تغير IP الكمبيوتر
    
    if (Platform.OS === 'android') {
      // استخدم IP الكمبيوتر بدلاً من 10.0.2.2
      return `http://${COMPUTER_IP}:3001/api/v1`;
    } else if (Platform.OS === 'ios') {
      // للجهاز الحقيقي، استخدم IP الكمبيوتر
      // للـ Simulator، يمكن استخدام localhost
      return `http://${COMPUTER_IP}:3001/api/v1`;
    } else {
      // Web or other platforms
      return 'http://localhost:3001/api/v1';
    }
  } else {
    // Production mode - replace with your actual server URL
    // For device testing, use your computer's IP address
    // Example: 'http://192.168.1.100:3001/api/v1'
    return 'http://YOUR_SERVER_IP:3001/api/v1';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error details for debugging
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('❌ Network Error - Backend not reachable');
      console.error('API URL:', API_BASE_URL);
      console.error('Make sure:');
      console.error('1. Backend server is running (rails server)');
      console.error('2. Backend is accessible at:', API_BASE_URL);
      console.error('3. For Android Emulator, use: http://YOUR_COMPUTER_IP:3001/api/v1');
      console.error('4. For iOS Simulator, use: http://YOUR_COMPUTER_IP:3001/api/v1');
      console.error('5. Get your computer IP from: ipconfig in PowerShell');
      console.error('6. Make sure Windows Firewall allows port 3001');
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid - حذف فقط token و user_id
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_id');
      // الاحتفاظ بـ user_email, user_name, user_membership
    }
    return Promise.reject(error);
  }
);

// ==================== Authentication API ====================

export const authAPI = {
  /**
   * Sign up a new user
   * @param {Object} userData - { email, password, password_confirmation, name, language }
   * @returns {Promise}
   */
  signup: async (userData) => {
    const response = await api.post('/users/signup', { user: userData });
    if (response.data.success && response.data.data.token) {
      const user = response.data.data.user;
      await AsyncStorage.setItem('auth_token', response.data.data.token);
      await AsyncStorage.setItem('user_id', user.id.toString());
      await AsyncStorage.setItem('user_membership', user.membership || 'free');
      await AsyncStorage.setItem('user_email', user.email || '');
      await AsyncStorage.setItem('user_name', user.name || '');
    }
    return response;
  },

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise}
   */
  login: async (email, password) => {
    const response = await api.post('/users/login', {
      user: { email, password },
    });
    if (response.data.success && response.data.data.token) {
      const user = response.data.data.user;
      await AsyncStorage.setItem('auth_token', response.data.data.token);
      await AsyncStorage.setItem('user_id', user.id.toString());
      await AsyncStorage.setItem('user_membership', user.membership || 'free');
      await AsyncStorage.setItem('user_email', user.email || '');
      await AsyncStorage.setItem('user_name', user.name || '');
    }
    return response;
  },

  /**
   * Get current authenticated user
   * @returns {Promise}
   */
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  /**
   * Logout - Clear stored tokens only (keep user info for easy re-login)
   */
  logout: async () => {
    // حذف فقط token و user_id لإجبار إعادة تسجيل الدخول
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_id');
    // الاحتفاظ بـ user_email, user_name, user_membership
    // حتى يمكن للمستخدم العودة وتسجيل الدخول بسهولة
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },

  /**
   * Get stored user info
   * @returns {Promise<Object>}
   */
  getStoredUserInfo: async () => {
    const [userId, membership, email, name] = await Promise.all([
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('user_membership'),
      AsyncStorage.getItem('user_email'),
      AsyncStorage.getItem('user_name'),
    ]);
    return {
      id: userId ? parseInt(userId) : null,
      membership: membership || 'free',
      email: email || '',
      name: name || '',
    };
  },
};

// ==================== Courses API ====================

export const coursesAPI = {
  /**
   * Create a new course (Premium only)
   * @param {Object} courseData - { title, description, language, level, is_published }
   * @returns {Promise}
   */
  create: async (courseData) => {
    return await api.post('/courses', { course: courseData });
  },

  /**
   * Get course by ID
   * @param {number} courseId
   * @returns {Promise}
   */
  getById: async (courseId) => {
    return await api.get(`/courses/${courseId}`);
  },

  /**
   * Get all courses for a user
   * @param {number} userId
   * @returns {Promise}
   */
  getUserCourses: async (userId) => {
    return await api.get(`/users/${userId}/courses`);
  },

  /**
   * Get videos for a course
   * @param {number} courseId
   * @returns {Promise}
   */
  getVideos: async (courseId) => {
    return await api.get(`/courses/${courseId}/videos`);
  },

  /**
   * Get reports for a course
   * @param {number} courseId
   * @returns {Promise}
   */
  getReports: async (courseId) => {
    return await api.get(`/courses/${courseId}/reports`);
  },

  /**
   * Get subjects for a course
   * @param {number} courseId
   * @returns {Promise}
   */
  getSubjects: async (courseId) => {
    return await api.get(`/courses/${courseId}/subjects`);
  },

  /**
   * Set a course as active
   * @param {number} courseId
   * @returns {Promise}
   */
  setActive: async (courseId) => {
    return await api.put(`/courses/${courseId}/set_active`);
  },
};

// ==================== LLM API (Premium Only) ====================

export const llmAPI = {
  /**
   * Generate AI-powered analysis (Premium only)
   * @param {Object} reportData - { total_sessions, avg_accuracy, improvement_rate, ... }
   * @returns {Promise}
   */
  generateAnalysis: async (reportData = {}) => {
    return await api.post('/llm/analysis', { report_data: reportData });
  },

  /**
   * Generate AI-powered learning report (Premium only)
   * @param {number} courseId
   * @param {Object} performanceMetrics - { total_sessions, avg_accuracy, improvement_rate, ... }
   * @returns {Promise}
   */
  generateReport: async (courseId, performanceMetrics = {}) => {
    return await api.post('/llm/report', {
      llm: {
        course_id: courseId,
        performance_metrics: performanceMetrics,
      },
    });
  },

  /**
   * Generate AI-powered subject content (Premium only)
   * @param {number} courseId
   * @param {Object} subjectParams - { name, difficulty, language }
   * @returns {Promise}
   */
  generateSubject: async (courseId, subjectParams) => {
    return await api.post('/llm/subject', {
      llm: {
        course_id: courseId,
        ...subjectParams,
      },
    });
  },

  /**
   * Generate AI-powered practice sentences (Premium only)
   * @param {number} courseId
   * @param {Object} sentenceParams - { topic, level, count, language }
   * @returns {Promise}
   */
  generateSentences: async (courseId, sentenceParams) => {
    return await api.post('/llm/sentences', {
      llm: {
        course_id: courseId,
        ...sentenceParams,
      },
    });
  },
};

// ==================== Videos API ====================

export const videosAPI = {
  /**
   * Create a new video for a course
   * @param {number} courseId
   * @param {Object} videoData - { text, language, remote_video_url, local_uri, video_type, position, did_talk_id }
   * @returns {Promise}
   */
  create: async (courseId, videoData) => {
    return await api.post(`/courses/${courseId}/videos`, { video: videoData });
  },

  /**
   * Get video by ID
   * @param {number} videoId
   * @returns {Promise}
   */
  getById: async (videoId) => {
    return await api.get(`/videos/${videoId}`);
  },

  /**
   * Update a video
   * @param {number} videoId
   * @param {Object} videoData - { video_type, position, etc. }
   * @returns {Promise}
   */
  update: async (videoId, videoData) => {
    return await api.put(`/videos/${videoId}`, { video: videoData });
  },

  /**
   * Delete a video
   * @param {number} videoId
   * @returns {Promise}
   */
  delete: async (videoId) => {
    return await api.delete(`/videos/${videoId}`);
  },
};

// ==================== Reports API ====================

export const reportsAPI = {
  /**
   * Create a new report for a video
   * @param {number} courseId
   * @param {number} videoId
   * @param {Object} reportData - { accuracy, reference_text, transcribed_text, incorrect_words, word_details, audio_duration }
   * @returns {Promise}
   */
  create: async (courseId, videoId, reportData) => {
    return await api.post(`/courses/${courseId}/videos/${videoId}/reports`, { report: reportData });
  },

  /**
   * Get report by ID
   * @param {number} reportId
   * @returns {Promise}
   */
  getById: async (reportId) => {
    return await api.get(`/reports/${reportId}`);
  },
};

// ==================== Users API ====================

export const usersAPI = {
  /**
   * Upgrade user membership to premium
   * @param {number} userId
   * @returns {Promise}
   */
  upgrade: async (userId) => {
    const response = await api.put(`/users/${userId}/upgrade`);
    // Update stored membership if upgrade successful
    if (response.data.success && response.data.data.membership === 'premium') {
      await AsyncStorage.setItem('user_membership', 'premium');
    }
    return response;
  },

  /**
   * Change user password
   * @param {number} userId
   * @param {Object} passwordData - { current_password, new_password, new_password_confirmation }
   * @returns {Promise}
   */
  changePassword: async (userId, passwordData) => {
    return await api.put(`/users/${userId}/change_password`, {
      user: passwordData
    });
  },
};

// ==================== Health Check ====================

export const healthAPI = {
  /**
   * Check API health
   * @returns {Promise}
   */
  check: async () => {
    return await api.get('/health');
  },
};

// Export default api instance
export default api;

// Export API base URL for configuration
export { API_BASE_URL };

