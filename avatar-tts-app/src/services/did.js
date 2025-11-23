import axios from 'axios';
import { DID_API_KEY } from '../config/apiKeys';
import { NetworkService, handleNetworkError, retryRequest } from './network';

const DID_BASE_URL = 'https://api.d-id.com';

// Helper function to encode base64 in React Native
const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  // Fallback for React Native
  return Buffer.from(str).toString('base64');
};

const didApi = axios.create({
  baseURL: DID_BASE_URL,
  headers: {
    'Authorization': `Basic ${DID_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

export const createTalk = async (script, sourceUrl, voiceId = 'pNInz6obpgDQGcFmaJgB') => {
  try {
    // Check network connectivity first
    const connectivity = await NetworkService.checkConnectivity();
    if (!connectivity.isConnected) {
      throw new Error('No internet connection. Please check your network settings.');
    }

    console.log('Creating talk with D-ID API...');
    console.log('API Key (first 10 chars):', DID_API_KEY.substring(0, 10) + '...');
    console.log('Script:', script);
    console.log('Source URL:', sourceUrl);
    console.log('Voice ID:', voiceId);
    
    // Validate inputs
    if (!script || script.trim().length === 0) {
      throw new Error('Script cannot be empty');
    }
    
    if (!sourceUrl || sourceUrl.trim().length === 0) {
      throw new Error('Source URL cannot be empty');
    }
    
    if (!voiceId || voiceId.trim().length === 0) {
      throw new Error('Voice ID cannot be empty');
    }
    
    // Try different request formats based on sourceUrl type
    let requestBody;
    
    // Use the same format for all URLs
    requestBody = {
      script: {
        type: 'text',
        input: script,
        provider: {
          type: 'microsoft',
          voice_id: voiceId
        }
      },
      source_url: sourceUrl
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Use retry mechanism for network requests
    const response = await retryRequest(async () => {
      return await didApi.post('/talks', requestBody);
    });
    
    console.log('D-ID API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('D-ID API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Headers:', error.response?.headers);
    console.error('Data:', error.response?.data);
    console.error('Full Error:', error);
    
    // Handle network errors
    const networkError = handleNetworkError(error);
    if (networkError.type === 'network' || networkError.type === 'offline') {
      throw new Error(networkError.message);
    }
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your D-ID API credentials.');
    } else if (error.response?.status === 400) {
      throw new Error(`Bad request: ${error.response?.data?.message || 'Invalid parameters'}`);
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 500) {
      throw new Error('D-ID server error. This might be due to invalid voice ID or avatar URL. Please try with different options.');
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Network connection error. Please check your internet connection and try again.');
    } else {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || 'Failed to create talk');
    }
  }
};

export const getTalk = async (talkId) => {
  try {
    const response = await didApi.get(`/talks/${talkId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching talk:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get talk status');
  }
};

export const getTalks = async () => {
  try {
    const response = await didApi.get('/talks');
    return response.data;
  } catch (error) {
    console.error('Error fetching talks:', error.response?.data || error.message);
    throw error;
  }
};

// Test API key validity
export const testApiKey = async () => {
  try {
    console.log('Testing D-ID API key...');
    const response = await didApi.get('/talks');
    console.log('API key is valid!');
    return true;
  } catch (error) {
    console.error('API key test failed:', error.response?.data || error.message);
    return false;
  }
};

// Validate API configuration
export const validateApiConfiguration = () => {
  const issues = [];
  
  if (!DID_API_KEY || DID_API_KEY.length < 10) {
    issues.push('D-ID API key appears to be invalid or missing');
  }
  
  if (!DID_API_KEY.includes(':')) {
    issues.push('D-ID API key should be in format "email:password" or base64 encoded');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Test specific voice ID with ElevenLabs
export const testVoiceId = async (voiceId) => {
  try {
    console.log(`Testing voice ID: ${voiceId}`);
    
    // Test with a simple text
    const testScript = "Hello, this is a test.";
    const testSourceUrl = "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg";
    
    const response = await didApi.post('/talks', {
      script: {
        type: 'text',
        input: testScript,
        provider: {
          type: 'elevenlabs',
          voice_id: voiceId
        }
      },
      source_url: testSourceUrl,
      config: {
        fluent: true,
        pad_audio: 0.0
      }
    });
    
    console.log('Voice ID test successful:', response.data);
    return { success: true, talkId: response.data.id };
  } catch (error) {
    console.error('Voice ID test failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Fallback voice IDs to try if the primary ones fail
export const FALLBACK_VOICE_IDS = [
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'AZnzlk1XvdvUeBnXmlld', // Domi
  'EXAVITQu4vr4xnSDxMaL', // Bella
  'MF3mGyEYCl7XYWbV9V6O', // Elli
  'TxGEqnHWrfWFTfGW9XjX', // Josh
  'VR6AewLTigWG4xSOukaG', // Arnold
];

// Try multiple voice IDs until one works
export const createTalkWithFallback = async (script, sourceUrl, primaryVoiceId) => {
  const voiceIdsToTry = [primaryVoiceId, ...FALLBACK_VOICE_IDS.filter(id => id !== primaryVoiceId)];
  
  for (let i = 0; i < voiceIdsToTry.length; i++) {
    const voiceId = voiceIdsToTry[i];
    console.log(`Attempting to create talk with voice ID ${i + 1}/${voiceIdsToTry.length}: ${voiceId}`);
    
    try {
      const result = await createTalk(script, sourceUrl, voiceId);
      console.log(`Successfully created talk with voice ID: ${voiceId}`);
      return { ...result, usedVoiceId: voiceId };
    } catch (error) {
      console.error(`Failed with voice ID ${voiceId}:`, error.message);
      
      // If this is the last voice ID, throw the error
      if (i === voiceIdsToTry.length - 1) {
        throw new Error(`All voice IDs failed. Last error: ${error.message}`);
      }
      
      // Otherwise, continue to the next voice ID
      console.log(`Trying next voice ID...`);
    }
  }
};

// Test if avatar URL is accessible
export const testAvatarUrl = async (avatarUrl) => {
  try {
    console.log(`Testing avatar URL: ${avatarUrl}`);
    
    // Simple test with minimal parameters
    const testScript = "Test";
    const testVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Use a reliable voice ID
    
    const response = await didApi.post('/talks', {
      script: {
        type: 'text',
        input: testScript,
        provider: {
          type: 'elevenlabs',
          voice_id: testVoiceId
        }
      },
      source_url: avatarUrl,
      config: {
        fluent: true,
        pad_audio: 0.0
      }
    });
    
    console.log('Avatar URL test successful:', response.data);
    return { success: true, talkId: response.data.id };
  } catch (error) {
    console.error('Avatar URL test failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Test basic API connectivity
export const testBasicApiConnection = async () => {
  try {
    console.log('Testing basic D-ID API connection...');
    console.log('API Key format:', DID_API_KEY.includes(':') ? 'Email:Password format' : 'Token format');
    console.log('API Key length:', DID_API_KEY.length);
    
    // Try a simple GET request to test basic connectivity
    const response = await didApi.get('/talks');
    console.log('Basic API connection successful');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Basic API connection failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test with minimal request
export const testMinimalRequest = async () => {
  try {
    console.log('Testing minimal D-ID request...');
    
    // Try with D-ID's built-in avatar
    const minimalRequest = {
      script: {
        type: 'text',
        input: 'Hello',
        provider: {
          type: 'elevenlabs',
          voice_id: '21m00Tcm4TlvDq8ikWAM'
        }
      },
      source_url: 'amy-jcwCkr1g27',
      config: {
        fluent: false,
        pad_audio: 0.0
      }
    };
    
    console.log('Minimal request body:', JSON.stringify(minimalRequest, null, 2));
    
    const response = await didApi.post('/talks', minimalRequest);
    console.log('Minimal request successful:', response.data);
    return { success: true, talkId: response.data.id };
  } catch (error) {
    console.error('Minimal request failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test with different API endpoint
export const testAlternativeEndpoint = async () => {
  try {
    console.log('Testing alternative D-ID endpoint...');
    
    // Try the presentations endpoint instead
    const response = await didApi.get('/presentations');
    console.log('Alternative endpoint successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Alternative endpoint failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};