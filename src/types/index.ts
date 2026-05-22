export type Difficulty = 'Beginner' | 'Intermediate' | 'Professional';
export type Screen =
  | 'login' | 'signup' | 'confirmation'
  | 'home' | 'difficulty' | 'level' | 'question'
  | 'profile' | 'analytics';

export interface User {
  userId:    string; // Cognito sub (UUID)
  firstName: string;
  lastName:  string;
  dob:       string; // YYYY-MM-DD
  email:     string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LevelProgress {
  [difficulty: string]: { [level: number]: number };
}

export interface AnswerRecord {
  questionId:    number;
  selectedIndex: number;
  isCorrect:     boolean;
}

export interface SessionScore {
  difficulty: Difficulty;
  level:      number;
  score:      number;
  jobRole:    string;
}
