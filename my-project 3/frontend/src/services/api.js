import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';

export const processImage = async (imageFile, speaker = 'female') => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('speaker_name', speaker);
    const response = await axios.post(`${API_BASE_URL}/ocr-tts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data && response.data.audio_url) {
      if (!response.data.audio_url.startsWith('http')) {
        response.data.audio_url = `${API_BASE_URL}${response.data.audio_url}`;
      }
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyAudioUrl = async (audioUrl) => {
  try {
    const response = await axios.head(audioUrl);
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    return false;
  }
};

export const performOcr = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await axios.post(`${API_BASE_URL}/ocr`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const textToSpeech = async (text, speakerName = 'bn_female') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/tts`, null, {
      params: { text, speaker_name: speakerName },
      responseType: 'blob'
    });
    const audioUrl = URL.createObjectURL(response.data);
    return audioUrl;
  } catch (error) {
    throw error;
  }
};
