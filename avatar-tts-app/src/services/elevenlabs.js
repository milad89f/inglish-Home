import axios from 'axios';
import { ELEVENLABS_API_KEY } from '../config/apiKeys';

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

const elevenlabsApi = axios.create({
  baseURL: ELEVENLABS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': ELEVENLABS_API_KEY,
  },
});

export const textToSpeech = async (text, voiceId = '21m00Tcm4TlvDq8ikWAM') => {
  try {
    const response = await elevenlabsApi.post(
      `/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      },
      {
        responseType: 'arraybuffer',
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
};

export const getVoices = async () => {
  try {
    const response = await elevenlabsApi.get('/voices');
    return response.data;
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
};

export const getVoiceSettings = async (voiceId) => {
  try {
    const response = await elevenlabsApi.get(`/voices/${voiceId}/settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching voice settings:', error);
    throw error;
  }
};