export enum AppView {
  LANGUAGE_SELECT = 'LANGUAGE_SELECT',
  DASHBOARD = 'DASHBOARD',
  ACTIVITY = 'ACTIVITY',
}

export enum ActivityId {
  LIGHT_INCIDENCE = 'LIGHT_INCIDENCE',
  SEASONS = 'SEASONS',
  ORBIT_REVOLUTION = 'ORBIT_REVOLUTION',
  SIZES_DISTANCES = 'SIZES_DISTANCES',
}

export enum GameMode {
  SOLO = 'SOLO',
  GROUP = 'GROUP',
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AstroCommand {
  role: string;
  action: string;
  question: string;
  answer: string;
}

export interface ActivityConfig {
  id: ActivityId;
  title: string;
  description: string;
  iconName: string; // Using Lucide icon names as strings
  color: string;
}
