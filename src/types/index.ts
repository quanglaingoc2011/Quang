export type WordCategory = 
  | 'Animals'
  | 'Food & Drinks'
  | 'Colors & Shapes'
  | 'Family & Home'
  | 'School & Stationery'
  | 'Toys & Hobbies'
  | 'Clothes & Body'
  | 'Nature & Weather'
  | 'Actions & Daily';

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  vietnamese: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'phrase';
  category: WordCategory;
  emoji: string;
  exampleEn: string;
  exampleVi: string;
  synonyms?: string[];
}

export interface DialogueLine {
  speaker: string;
  avatar: string;
  en: string;
  vi: string;
}

export interface Dialogue {
  id: string;
  title: string;
  vietnameseTitle: string;
  category: string;
  level: 'Dễ' | 'Trung bình';
  context: string;
  lines: DialogueLine[];
  keyWords: string[];
}

export type WordStatus = 'new' | 'learning' | 'mastered';

export interface UserWordProgress {
  wordId: string;
  userId: string;
  status: WordStatus;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: string;
  starred: boolean;
}

export interface UserDialogueProgress {
  dialogueId: string;
  userId: string;
  completed: boolean;
  lastPracticedAt: string;
  score: number;
}

export interface UserDailyStat {
  date: string; // YYYY-MM-DD
  userId: string;
  wordsReviewed: number;
  dialoguesRead: number;
}

export interface UserProfileData {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  streakDays: number;
  lastActiveDate: string;
  totalWordsLearned: number;
  totalDialoguesCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 'dictionary' | 'flashcards' | 'dialogues' | 'analytics';
