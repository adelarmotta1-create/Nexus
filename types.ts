export type NavigationTab = 'dashboard' | 'professional' | 'body' | 'finance' | 'productivity' | 'reports';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  joinedDate: string;
}

export interface CheckIn {
  energy: number; // 0-10
  mood: string;
  sleepQuality: string;
  sleepHours: number;
  mainGoal: string;
  timestamp: string;
}

export type TaskCategory = 'work' | 'study' | 'workout' | 'routine' | 'wasted' | 'leisure';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  durationMinutes: number;
  xpReward: number;
  date: string; // ISO Date string
}

export interface FunnelStage {
  id: string;
  name: string;
  color: string; // Tailwind border color class or hex
}

export interface Funnel {
  id: string;
  name: string;
  stages: FunnelStage[];
}

export interface Lead {
  id: string;
  funnelId: string;
  name: string;
  company: string;
  status: string;
  value: number;
  probability: number;
  lastContact: string;
  nextAction: string;
  cpfCnpj?: string;
  instagram?: string;
  phone?: string;
  zipCode?: string;
  address?: string;
  number?: string;
  state?: string;
  location?: string; // City
  lat?: number;
  lng?: number;
}

export interface WorkoutProfile {
  sex: string;
  age: number;
  weight: number;
  goal: 'weight_loss' | 'hypertrophy' | 'conditioning' | 'health';
  limitations: string;
}

export interface StudyProfile {
    subject: string;
    currentLevel: 'iniciante' | 'intermediario' | 'avancado';
    goal: string;
    availability: string;
}

export interface StudyTopic {
    id: string;
    subject: string;
    topic: string;
    completed: boolean;
    cachedContent?: string;
    cachedQuestions?: {
        q: string;
        options: string[];
        answer: number;
    }[];
}

export interface WorkoutLog {
    id: string;
    description: string;
    date: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    currentValue: number;
    targetValue: number;
    unit: string; // e.g., 'R$', 'kg', '%', 'leads'
    category: 'finance' | 'body' | 'career' | 'productivity' | 'other';
    deadline?: string;
    status: 'in_progress' | 'completed' | 'failed';
}

export interface Message {
    id: string;
    role: 'user' | 'model' | 'system';
    text: string;
    timestamp: Date;
}

export interface UserStats {
    xp: number;
    level: number;
    streak: number;
}