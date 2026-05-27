import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/model-info');
  return response.data;
};

export const trainModel = async () => {
  const response = await api.post('/train');
  return response.data;
};

export const classifyText = async (text, model) => {
  const response = await api.post('/classify-text', { text, model });
  return response.data;
};

export const uploadDocument = async (file, model) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);
  
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getHistory = async (category = '', search = '') => {
  const params = {};
  if (category) params.category = category;
  if (search) params.search = search;
  
  const response = await api.get('/history', { params });
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export default {
  getStatus,
  getModelInfo,
  trainModel,
  classifyText,
  uploadDocument,
  getHistory,
  deleteDocument,
  getStats,
};
