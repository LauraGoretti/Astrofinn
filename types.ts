export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ACTIVITY = 'ACTIVITY',
}

export enum ActivityId {
  ORBIT_REVOLUTION = 'ORBIT_REVOLUTION',
  SEASONS = 'SEASONS',
  SUNLIGHT_INTENSITY = 'SUNLIGHT_INTENSITY',
  LIGHT_INCIDENCE = 'LIGHT_INCIDENCE',
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
