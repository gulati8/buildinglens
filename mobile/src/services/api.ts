import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../utils/constants';
import type { IdentifyRequest, IdentifyResponse, ErrorResponse } from '../types/api.types';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.data) {
      throw error.response.data;
    }
    throw {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network request failed',
      },
    } as ErrorResponse;
  }
);

export const api = {
  /**
   * Identify building based on device position
   */
  async identifyBuilding(request: IdentifyRequest): Promise<IdentifyResponse> {
    const response = await apiClient.post<IdentifyResponse>('/identify', request);
    return response.data;
  },

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ status: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },
};
