import axios from 'axios';
import { ResourceResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchResources = async (): Promise<ResourceResponse> => {
  try {
    const response = await api.get('/resources');
    return response.data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    return { 
      resources: [], 
      error: error.response?.data?.error || 'Failed to fetch resources' 
    };
  }
};

export const deleteResource = async (resourceId: string): Promise<boolean> => {
  try {
    await api.delete(`/resources/${resourceId}`);
    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    return false;
  }
};