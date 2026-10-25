import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testFirestoreConnection } from './firebase';
import { ActiveTab, WordCategory, UserWordProgress, UserDialogueProgress, UserDailyStat } from './types';
import {
  getLocalWordProgress,
  getLocalDialogueProgress,
  getLocalDailyStats,
  getLocalProfile,
  syncUserDataFromFirestore,
} from './services/progressService';
import { Navbar } from './components/Navbar';
import { DictionaryView } from './components/DictionaryView';
import { FlashcardReview } from './components/FlashcardReview';
import { DialogueView } from './components/DialogueView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dictionary');
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [flashcardCategory, setFlashcardCategory] = useState<WordCategory | 'all'>('all');

  // Progress state
  const [wordProgressMap, setWordProgressMap] = useState<Record<string, UserWordProgress>>({});
  const [dialogueProgressMap, setDialogueProgressMap] = useState<Record<string, UserDialogueProgress>>({});
  const [dailyStatsMap, setDailyStatsMap] = useState<Record<string, UserDailyStat>>({});
  const [streakDays, setStreakDays] = useState(1);

  // Reload local state into memory
  const reloadProgressData = useCallback(() => {
    setWordProgressMap(getLocalWordProgress());
    setDialogueProgressMap(getLocalDialogueProgress());
    setDailyStatsMap(getLocalDailyStats());
    const profile = getLocalProfile();
    if (profile?.streakDays) {
      setStreakDays(profile.streakDays);
    }
  }, []);

  useEffect(() => {
    // 1. Connection check as mandated
    testFirestoreConnection();

    // 2. Load existing local progress
    reloadProgressData();

    // 3. Listen to auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserDataFromFirestore(currentUser.uid);
        reloadProgressData();
      }
    });

    return () => unsubscribe();
  }, [reloadProgressData]);

  const handleStartFlashcardsWithCategory = (category: WordCategory | 'all') => {
    setFlashcardCategory(category);
    setActiveTab('flashcards');
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        streakDays={streakDays}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dictionary' && (
          <DictionaryView
            wordProgressMap={wordProgressMap}
            onStartFlashcardsWithCategory={handleStartFlashcardsWithCategory}
            onRefreshData={reloadProgressData}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardReview
            wordProgressMap={wordProgressMap}
            initialCategory={flashcardCategory}
            onRefreshData={reloadProgressData}
            onExploreDialogues={() => setActiveTab('dialogues')}
          />
        )}

        {activeTab === 'dialogues' && (
          <DialogueView
            dialogueProgressMap={dialogueProgressMap}
            wordProgressMap={wordProgressMap}
            onRefreshData={reloadProgressData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            wordProgressMap={wordProgressMap}
            dialogueProgressMap={dialogueProgressMap}
            dailyStatsMap={dailyStatsMap}
            streakDays={streakDays}
            onNavigateToFlashcards={() => setActiveTab('flashcards')}
            onNavigateToDialogues={() => setActiveTab('dialogues')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-amber-100 bg-white/60 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span>🦁 English with Me</span>
            <span>•</span>
            <span>Học tiếng Anh thân thiện & đơn giản cho trẻ em</span>
          </div>
          <div className="text-slate-400">
            Dữ liệu đám mây Firebase • Kho 105 từ vựng • 20 đoạn hội thoại
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        user={user}
        onClose={() => setAuthModalOpen(false)}
        onUserChanged={(newUser) => {
          setUser(newUser);
          reloadProgressData();
        }}
      />
    </div>
  );
}
