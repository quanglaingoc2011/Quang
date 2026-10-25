import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { UserProfileData, UserWordProgress, UserDialogueProgress, UserDailyStat, WordStatus } from '../types';

const LOCAL_STORAGE_KEY_WORDS = 'eng_kids_word_progress';
const LOCAL_STORAGE_KEY_DIALOGUES = 'eng_kids_dialogue_progress';
const LOCAL_STORAGE_KEY_DAILY = 'eng_kids_daily_stats';
const LOCAL_STORAGE_KEY_PROFILE = 'eng_kids_user_profile';

function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Local storage fallbacks
export function getLocalWordProgress(): Record<string, UserWordProgress> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_WORDS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalWordProgress(data: Record<string, UserWordProgress>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_WORDS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving to localStorage', e);
  }
}

export function getLocalDialogueProgress(): Record<string, UserDialogueProgress> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DIALOGUES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalDialogueProgress(data: Record<string, UserDialogueProgress>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_DIALOGUES, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving to localStorage', e);
  }
}

export function getLocalDailyStats(): Record<string, UserDailyStat> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DAILY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalDailyStats(data: Record<string, UserDailyStat>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_DAILY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving to localStorage', e);
  }
}

export function getLocalProfile(): UserProfileData | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(data: UserProfileData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving to localStorage', e);
  }
}

// Service Methods with dual-sync (Firebase if authenticated, plus localStorage cache)

export async function recordWordReview(wordId: string, isCorrect: boolean): Promise<UserWordProgress> {
  const user = auth.currentUser;
  const uid = user ? user.uid : 'guest';
  const now = new Date().toISOString();

  // 1. Update local cache
  const localWords = getLocalWordProgress();
  const existing = localWords[wordId] || {
    wordId,
    userId: uid,
    status: 'new' as WordStatus,
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: now,
    starred: false,
  };

  const newReviewCount = existing.reviewCount + 1;
  const newCorrectCount = existing.correctCount + (isCorrect ? 1 : 0);
  let newStatus: WordStatus = existing.status;

  if (newCorrectCount >= 2 && newCorrectCount / newReviewCount >= 0.7) {
    newStatus = 'mastered';
  } else {
    newStatus = 'learning';
  }

  const updated: UserWordProgress = {
    ...existing,
    userId: uid,
    reviewCount: newReviewCount,
    correctCount: newCorrectCount,
    status: newStatus,
    lastReviewedAt: now,
  };

  localWords[wordId] = updated;
  saveLocalWordProgress(localWords);

  // Record daily activity
  await recordDailyActivity(1, 0);

  // 2. Sync to Firestore if signed in
  if (user && db) {
    const path = `users/${user.uid}/wordProgress/${wordId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'wordProgress', wordId), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  return updated;
}

export async function toggleWordStarred(wordId: string): Promise<boolean> {
  const user = auth.currentUser;
  const uid = user ? user.uid : 'guest';
  const localWords = getLocalWordProgress();
  const existing = localWords[wordId] || {
    wordId,
    userId: uid,
    status: 'new' as WordStatus,
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: new Date().toISOString(),
    starred: false,
  };

  const newStarred = !existing.starred;
  const updated: UserWordProgress = {
    ...existing,
    starred: newStarred,
  };

  localWords[wordId] = updated;
  saveLocalWordProgress(localWords);

  if (user && db) {
    const path = `users/${user.uid}/wordProgress/${wordId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'wordProgress', wordId), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  return newStarred;
}

export async function recordDialogueCompletion(dialogueId: string, score: number = 100): Promise<UserDialogueProgress> {
  const user = auth.currentUser;
  const uid = user ? user.uid : 'guest';
  const now = new Date().toISOString();

  const localDialogues = getLocalDialogueProgress();
  const updated: UserDialogueProgress = {
    dialogueId,
    userId: uid,
    completed: true,
    lastPracticedAt: now,
    score,
  };

  localDialogues[dialogueId] = updated;
  saveLocalDialogueProgress(localDialogues);

  // Record daily activity
  await recordDailyActivity(0, 1);

  if (user && db) {
    const path = `users/${user.uid}/dialogueProgress/${dialogueId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'dialogueProgress', dialogueId), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  return updated;
}

export async function recordDailyActivity(wordsIncrement: number, dialoguesIncrement: number) {
  const today = getTodayString();
  const user = auth.currentUser;
  const uid = user ? user.uid : 'guest';

  const localDaily = getLocalDailyStats();
  const currentStat = localDaily[today] || {
    date: today,
    userId: uid,
    wordsReviewed: 0,
    dialoguesRead: 0,
  };

  const updatedStat: UserDailyStat = {
    ...currentStat,
    wordsReviewed: currentStat.wordsReviewed + wordsIncrement,
    dialoguesRead: currentStat.dialoguesRead + dialoguesIncrement,
  };

  localDaily[today] = updatedStat;
  saveLocalDailyStats(localDaily);

  // Also update streak in user profile
  updateStreak();

  if (user && db) {
    const path = `users/${user.uid}/dailyStats/${today}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'dailyStats', today), updatedStat, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

function updateStreak() {
  const today = getTodayString();
  const profile = getLocalProfile() || {
    userId: auth.currentUser?.uid || 'guest',
    email: auth.currentUser?.email || '',
    displayName: auth.currentUser?.displayName || 'Bé yêu',
    photoURL: auth.currentUser?.photoURL || undefined,
    streakDays: 1,
    lastActiveDate: today,
    totalWordsLearned: 0,
    totalDialoguesCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (profile.lastActiveDate !== today) {
    // Check if consecutive day
    const lastDate = new Date(profile.lastActiveDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      profile.streakDays += 1;
    } else if (diffDays > 1) {
      profile.streakDays = 1;
    }
    profile.lastActiveDate = today;
  }

  profile.updatedAt = new Date().toISOString();
  saveLocalProfile(profile);

  const user = auth.currentUser;
  if (user && db) {
    const path = `users/${user.uid}`;
    setDoc(doc(db, 'users', user.uid), profile, { merge: true }).catch((err) => {
      console.warn('Error saving user profile streak', err);
    });
  }
}

// Initial Sync from Firestore on Login
export async function syncUserDataFromFirestore(userId: string) {
  if (!db) return;

  try {
    // 1. Fetch user profile
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      saveLocalProfile(userDocSnap.data() as UserProfileData);
    }

    // 2. Fetch word progress
    const wordsSnap = await getDocs(collection(db, 'users', userId, 'wordProgress'));
    const remoteWords: Record<string, UserWordProgress> = {};
    wordsSnap.forEach((d) => {
      remoteWords[d.id] = d.data() as UserWordProgress;
    });
    // Merge with local
    const mergedWords = { ...getLocalWordProgress(), ...remoteWords };
    saveLocalWordProgress(mergedWords);

    // 3. Fetch dialogue progress
    const dialoguesSnap = await getDocs(collection(db, 'users', userId, 'dialogueProgress'));
    const remoteDialogues: Record<string, UserDialogueProgress> = {};
    dialoguesSnap.forEach((d) => {
      remoteDialogues[d.id] = d.data() as UserDialogueProgress;
    });
    const mergedDialogues = { ...getLocalDialogueProgress(), ...remoteDialogues };
    saveLocalDialogueProgress(mergedDialogues);

    // 4. Fetch daily stats
    const dailySnap = await getDocs(collection(db, 'users', userId, 'dailyStats'));
    const remoteDaily: Record<string, UserDailyStat> = {};
    dailySnap.forEach((d) => {
      remoteDaily[d.id] = d.data() as UserDailyStat;
    });
    const mergedDaily = { ...getLocalDailyStats(), ...remoteDaily };
    saveLocalDailyStats(mergedDaily);
  } catch (e) {
    console.warn('Sync from firestore encountered non-fatal error:', e);
  }
}
