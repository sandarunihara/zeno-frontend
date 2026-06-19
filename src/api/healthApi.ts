import { axiosClient } from './axiosClient';

export interface StepBucketResponse {
  success: boolean;
  message: string;
  totalSteps: number;
  bucket1: number;
  bucket2: number;
  bucket3: number;
  bucket4: number;
}

export const healthApi = {
  getStepsToday: async (): Promise<StepBucketResponse> => {
    const response = await axiosClient.get<StepBucketResponse>('/api/core/health/steps/today');
    return response.data;
  }
};
