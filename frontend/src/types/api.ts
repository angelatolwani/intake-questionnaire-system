export interface User {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Question {
  id: number;
  type: 'mcq' | 'input';
  options: string[];
  question: string;
  created_at: string;
  updated_at?: string;
}

export interface Questionnaire {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface QuestionnaireWithQuestions extends Questionnaire {
  questions: Question[];
}

export interface Answer {
  question_id: number;
  value: string[];
}

export interface Response {
  id: string;
  user_id: string;
  questionnaire_id: number;
  answers: Answer[];
  created_at: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}
