import axios from 'axios';
import { LoginResponse, Questionnaire, QuestionnaireWithQuestions, Response, User } from '../types/api';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
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
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post<LoginResponse>('/token', formData);
  return response.data;
};

export const register = async (username: string, password: string): Promise<User> => {
  const response = await api.post<User>('/users/', { username, password });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/users/me/');
  return response.data;
};

export const getQuestionnaires = async (): Promise<Questionnaire[]> => {
  const response = await api.get<Questionnaire[]>('/questionnaires/');
  return response.data;
};

export const getQuestionnaire = async (id: number): Promise<QuestionnaireWithQuestions> => {
  const response = await api.get<QuestionnaireWithQuestions>(`/questionnaires/${id}`);
  return response.data;
};

export const submitResponse = async (
  questionnaireId: number,
  answers: { question_id: number; value: string[] }[]
): Promise<Response> => {
  const response = await api.post<Response>('/responses/', {
    questionnaire_id: questionnaireId,
    answers,
  });
  return response.data;
};

// Admin endpoints
export const getAllResponses = async (): Promise<Response[]> => {
  const response = await api.get<Response[]>('/admin/responses/');
  return response.data;
};

export const getUserResponses = async (userId: string): Promise<Response[]> => {
  const response = await api.get<Response[]>(`/admin/users/${userId}/responses`);
  return response.data;
};
