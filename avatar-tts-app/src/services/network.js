import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// Network connectivity service
export class NetworkService {
  static async checkConnectivity() {
    try {
      const netInfo = await NetInfo.fetch();
      return {
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
        details: netInfo.details
      };
    } catch (error) {
      console.error('Error checking network connectivity:', error);
      return {
        isConnected: false,
        isInternetReachable: false,
        error: error.message
      };
    }
  }

  static async testApiConnectivity() {
    const results = {
      elevenlabs: false,
      did: false,
      general: false
    };

    try {
      // Test general internet connectivity
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      results.general = response.ok;
    } catch (error) {
      console.error('General connectivity test failed:', error);
    }

    try {
      // Test ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        timeout: 10000
      });
      results.elevenlabs = response.ok;
    } catch (error) {
      console.error('ElevenLabs API test failed:', error);
    }

    try {
      // Test D-ID API
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'GET',
        timeout: 10000
      });
      results.did = response.ok;
    } catch (error) {
      console.error('D-ID API test failed:', error);
    }

    return results;
  }

  static showConnectivityAlert(connectivityResults) {
    const { isConnected, isInternetReachable } = connectivityResults;
    
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (isInternetReachable === false) {
      Alert.alert(
        'Limited Internet Access',
        'Your device is connected to a network but may not have internet access. Please check your connection.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  }

  static async showApiConnectivityAlert() {
    const results = await this.testApiConnectivity();
    
    if (!results.general) {
      Alert.alert(
        'No Internet Connection',
        'Unable to connect to the internet. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!results.elevenlabs && !results.did) {
      Alert.alert(
        'API Services Unavailable',
        'Both ElevenLabs and D-ID APIs are currently unavailable. Please try again later.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!results.did) {
      Alert.alert(
        'D-ID Service Unavailable',
        'The D-ID service is currently unavailable. Avatar generation may not work properly.',
        [{ text: 'OK' }]
      );
    }

    return true;
  }
}

// Network error handler
export const handleNetworkError = (error) => {
  console.error('Network error:', error);
  
  if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
    return {
      type: 'network',
      message: 'Network connection error. Please check your internet connection.',
      retryable: true
    };
  }
  
  if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      retryable: true
    };
  }
  
  if (error.response?.status === 0) {
    return {
      type: 'offline',
      message: 'No internet connection. Please check your network settings.',
      retryable: true
    };
  }
  
  return {
    type: 'unknown',
    message: error.message || 'An unknown error occurred.',
    retryable: false
  };
};

// Retry mechanism for network requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const errorInfo = handleNetworkError(error);
      
      if (!errorInfo.retryable || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

export default NetworkService;
