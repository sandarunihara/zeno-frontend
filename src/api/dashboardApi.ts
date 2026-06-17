import { axiosClient } from './axiosClient';

export interface MoodLog {
  id: number;
  userId: string;
  energyScore: number;
  sentiment?: string | null;
  dataSource: string; 
  loggedAt: string; 
  isLight: boolean;
}

export interface MoodlogResponse {
    success: boolean;
    moodLog: MoodLog;
    message: string;
}

export interface Task {
  id: number;
  userId: string; // UUID is handled as a string in TS
  title: string;
  description?: string; // Optional because it can be null
  effort_level: string; 
  deadline?: string | null;    // ISO-8601 string format (e.g., "2026-04-23T19:40:00")
  is_critical: boolean;
  status: string;
  parentTaskId?: number | null;
  hasMicroSteps: boolean;
  microSteps?: Task[] | null;
}

export interface DashboardResponse {
  currentEnergyScore: number;
  empatheticMessage: string;
  askConsent: boolean;
  displayTasks: Task[];
}

export interface AiTranscriptRequest {
  transcript: string;
}

export interface AiTAskResponce{
    success: boolean;
    message: string;
    data: Task[];
}

export const dashboardApi = {
    getMoodlog: async (): Promise<MoodlogResponse> =>{
        const response = await axiosClient.get<MoodlogResponse>('/api/core/mood/latest');
        return response.data;
    },

    createorupdateMoodlog: async (mood: number,isLight: boolean): Promise<MoodlogResponse> =>{
        const response = await axiosClient.post<MoodlogResponse>(`/api/core/mood/create/${mood}/${isLight}`);
        
        return response.data;
    },

    getDashboardTasks: async (keepItLight?: boolean): Promise<DashboardResponse> => {
        const response = await axiosClient.get<DashboardResponse>('/api/core/tasks/dashboard', {
            params: { 
                keepItLight 
            }
        });
        return response.data;
    },
    
    createTaskFromTranscript: async (transcript: string): Promise<AiTAskResponce> => {
        const payload: AiTranscriptRequest = { transcript };
        const response = await axiosClient.post<AiTAskResponce>('/api/core/tasks/ai-transcript', payload);
        return response.data;
    }
};