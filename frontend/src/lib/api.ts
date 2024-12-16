import axios, { AxiosError } from 'axios';
import { LoginResponse, Questionnaire, QuestionnaireWithQuestions, Response, User } from '../types/api';

const api = axios.create({
  baseURL: 'https://questionnaire-backend-l0bs.onrender.com',  // Updated to correct backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Login attempt:', { username, url: api.defaults.baseURL });
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    // Log the request details
    console.log('Request details:', {
      url: `${api.defaults.baseURL}/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: formData.toString()
    });
    
    const response = await api.post<LoginResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Log successful response
    console.log('Login successful:', response.data);
    
    // Store the token
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  } catch (error) {
    // Enhanced error logging
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      console.error('Login error details:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
          data: axiosError.config?.data
        }
      });
    } else {
      console.error('Non-Axios error:', error);
    }
    throw error;
  }
};

export const register = async (username: string, password: string): Promise<User> => {
  try {
    console.log('Attempting registration with:', { username });
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.post<User>('/users/', { username, password });
    
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    console.log('Getting current user');
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.get<User>('/users/me/');
    
    console.log('Current user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const getQuestionnaires = async (): Promise<Questionnaire[]> => {
  try {
    console.log('Getting questionnaires');
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.get<Questionnaire[]>('/questionnaires/');
    
    console.log('Questionnaires response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get questionnaires error:', error);
    throw error;
  }
};

export const getQuestionnaire = async (id: number): Promise<QuestionnaireWithQuestions> => {
  try {
    console.log('Getting questionnaire with id:', id);
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.get<QuestionnaireWithQuestions>(`/questionnaires/${id}`);
    
    console.log('Questionnaire response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get questionnaire error:', error);
    throw error;
  }
};

export const submitResponse = async (
  questionnaireId: number,
  answers: { question_id: number; value: string[] }[]
): Promise<Response> => {
  try {
    console.log('Submitting response for questionnaire with id:', questionnaireId);
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.post<Response>('/responses/', {
      questionnaire_id: questionnaireId,
      answers,
    });
    
    console.log('Submit response response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Submit response error:', error);
    throw error;
  }
};

// Admin endpoints
export const getAllResponses = async (): Promise<Response[]> => {
  try {
    console.log('Getting all responses');
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.get<Response[]>('/admin/responses/');
    
    console.log('All responses response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get all responses error:', error);
    throw error;
  }
};

export const getUserResponses = async (userId: string): Promise<Response[]> => {
  try {
    console.log('Getting responses for user with id:', userId);
    console.log('API URL:', api.defaults.baseURL);
    
    const response = await api.get<Response[]>(`/admin/users/${userId}/responses`);
    
    console.log('User responses response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user responses error:', error);
    throw error;
  }
};
