import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  Star,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { VocabularyWord, WordCategory, UserWordProgress } from '../types';
import { VOCABULARY_LIST } from '../data/dictionary';
import { speakEnglish, playChimeSound, playFlipSound, playCelebrationSound, playGentleTryAgainSound } from '../utils/audio';
import { recordWordReview, toggleWordStarred } from '../services/progressService';

interface FlashcardReviewProps {
  wordProgressMap: Record<string, UserWordProgress>;
  initialCategory?: WordCategory | 'all';
  onRefreshData?: () => void;
  onExploreDialogues?: () => void;
}

type StudyMode = 'old_words' | 'starred' | 'by_category' | 'all';

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  wordProgressMap,
  initialCategory = 'all',
  onRefreshData,
  onExploreDialogues,
}) => {
  const [studyMode, setStudyMode] = useState<StudyMode>(
    // If user has old words in progress, default to old words, otherwise all
    Object.keys(wordProgressMap).length > 0 ? 'old_words' : 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ correct: number; incorrect: number }>({
    correct: 0,
    incorrect: 0,
  });

  // Build deck based on selected mode
  const deck: VocabularyWord[] = useMemo(() => {
    let list: VocabularyWord[] = [];

    if (studyMode === 'old_words') {
      // Filter words that have been reviewed before or are in progress/learning
      const reviewedWordIds = Object.keys(wordProgressMap);
      if (reviewedWordIds.length > 0) {
        list = VOCABULARY_LIST.filter((w) => reviewedWordIds.includes(w.id));
      } else {
        // If user hasn't studied any word yet, give first 15 words to start!
        list = VOCABULARY_LIST.slice(0, 15);
      }
    } else if (studyMode === 'starred') {
      list = VOCABULARY_LIST.filter((w) => wordProgressMap[w.id]?.starred);
      if (list.length === 0) {
        // Fallback to first 10
        list = VOCABULARY_LIST.slice(0, 10);
      }
    } else if (studyMode === 'by_category') {
      if (selectedCategory === 'all') {
        list = VOCABULARY_LIST.slice(0, 20);
      } else {
        list = VOCABULARY_LIST.filter((w) => w.category === selectedCategory);
      }
    } else {
      // 'all' mode: shuffle or slice 20 words for a focused kid session
      list = VOCABULARY_LIST.slice(0, 20);
    }

    return list.length > 0 ? list : VOCABULARY_LIST.slice(0, 15);
  }, [studyMode, selectedCategory, wordProgressMap]);

  const currentWord = deck[currentIndex];

  useEffect(() => {
    // When deck changes, reset index and flip state
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionResults({ correct: 0, incorrect: 0 });
  }, [studyMode, selectedCategory]);

  const handleFlip = () => {
    playFlipSound();
    setIsFlipped(!isFlipped);
  };

  const handleSpeakCurrent = async (slow: boolean = false) => {
    if (!currentWord) return;
    await speakEnglish(currentWord.word, slow);
  };

  const handleSpeakSentence = async () => {
    if (!currentWord) return;
    await speakEnglish(currentWord.exampleEn, false);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentWord) return;

    if (isCorrect) {
      playChimeSound();
      setSessionResults((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      playGentleTryAgainSound();
      setSessionResults((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    // Persist to service & Firestore
    await recordWordReview(currentWord.id, isCorrect);
    onRefreshData?.();

    // Advance to next card or complete
    if (currentIndex + 1 < deck.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished deck!
      setIsCompleted(true);
      playCelebrationSound();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionResults({ correct: 0, incorrect: 0 });
  };

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    await toggleWordStarred(currentWord.id);
    onRefreshData?.();
  };

  const isCurrentStarred = currentWord ? !!wordProgressMap[currentWord.id]?.starred : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Mode Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>🃏</span> Luyện tập Flashcard
            </h2>
            <p className="text-xs text-slate-500">
              Lật thẻ, nghe phát âm và kiểm tra trí nhớ của bé
            </p>
          </div>

          {/* Mode Selector Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStudyMode('old_words')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                studyMode === 'old_words'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔄 Ôn từ cũ ({Object.keys(wordProgressMap).length || 15})
            </button>
            <button
              type="button"
              onClick={() => setStudyMode('by_category')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                studyMode === 'by_category'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📁 Theo chủ đề
            </button>
            <button
              type="button"
              onClick={() => setStudyMode('starred')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                studyMode === 'starred'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⭐ Yêu thích
            </button>
            <button
              type="button"
              onClick={() => setStudyMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                studyMode === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌟 20 từ ngẫu nhiên
            </button>
          </div>
        </div>

        {/* Category selector if in category mode */}
        {studyMode === 'by_category' && (
          <div className="mt-3 pt-3 border-t border-amber-100/70 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                'Animals',
                'Food & Drinks',
                'Colors & Shapes',
                'Family & Home',
                'School & Stationery',
                'Toys & Hobbies',
                'Clothes & Body',
                'Nature & Weather',
                'Actions & Daily',
              ] as WordCategory[]
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-amber-50 text-slate-700 hover:bg-amber-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Completion Celebration Screen */}
      {isCompleted ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-amber-100 shadow-md space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner animate-bounce">
            🏆
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Xuất sắc quá Bé ơi!
            </h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Bé đã hoàn thành xuất sắc lượt ôn tập với{' '}
              <span className="font-bold text-emerald-600">{deck.length} từ vựng</span>!
            </p>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="text-3xl font-extrabold text-emerald-600">
                {sessionResults.correct}
              </span>
              <p className="text-xs font-bold text-emerald-800 mt-1">Đã nhớ tốt ✅</p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center">
              <span className="text-3xl font-extrabold text-orange-600">
                {sessionResults.incorrect}
              </span>
              <p className="text-xs font-bold text-orange-800 mt-1">Cần ôn lại ⏳</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại lượt này</span>
            </button>
            <button
              type="button"
              onClick={onExploreDialogues}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Học hội thoại tiếp theo 💬</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Active Flashcard Screen */
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
            <span>
              Thẻ {currentIndex + 1} / {deck.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-semibold">
                ✓ {sessionResults.correct} đúng
              </span>
              <span>•</span>
              <span className="text-orange-500 font-semibold">
                ✕ {sessionResults.incorrect} ôn lại
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
            />
          </div>

          {/* 3D Flashcard Container */}
          <div
            onClick={handleFlip}
            className="group relative w-full min-h-[360px] sm:min-h-[400px] bg-white rounded-3xl p-6 sm:p-10 border-2 border-amber-200/80 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer select-none"
          >
            {/* Top Bar on Flashcard */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                {currentWord?.category}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleStar}
                  aria-label={isCurrentStarred ? "Bỏ lưu từ này" : "Lưu từ này"}
                  className={`p-2 rounded-full cursor-pointer transition-all ${
                    isCurrentStarred
                      ? 'bg-amber-400 text-white'
                      : 'bg-slate-100 text-slate-400 hover:text-amber-500'
                  }`}
                  title={isCurrentStarred ? 'Đã lưu yêu thích' : 'Lưu từ này'}
                >
                  <Star className={`w-4 h-4 ${isCurrentStarred ? 'fill-current' : ''}`} />
                </button>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Bấm để lật thẻ
                </span>
              </div>
            </div>

            {/* Front & Back Content */}
            {!isFlipped ? (
              /* FRONT OF CARD (English focus) */
              <div className="my-auto text-center space-y-4 py-6">
                <div className="text-7xl sm:text-8xl animate-in zoom-in-75 duration-200">
                  {currentWord?.emoji}
                </div>
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {currentWord?.word}
                  </h3>
                  <p className="text-base sm:text-lg font-mono text-amber-700/80 mt-1">
                    {currentWord?.phonetic}
                  </p>
                </div>

                {/* Pronunciation speech buttons */}
                <div
                  className="flex items-center justify-center gap-2 pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleSpeakCurrent(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Nghe đọc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeakCurrent(true)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold text-xs transition-all cursor-pointer"
                  >
                    <span>🐢 Đọc chậm</span>
                  </button>
                </div>
              </div>
            ) : (
              /* BACK OF CARD (Vietnamese translation & Example) */
              <div className="my-auto text-center space-y-5 py-4 animate-in fade-in duration-200">
                <div className="inline-block p-2 rounded-2xl bg-amber-50 text-4xl">
                  {currentWord?.emoji}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">
                    Nghĩa Tiếng Việt
                  </span>
                  <h4 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
                    {currentWord?.vietnamese}
                  </h4>
                </div>

                {/* Example sentence box */}
                <div
                  className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-left space-y-1 max-w-lg mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Câu ví dụ:
                    </span>
                    <button
                      type="button"
                      onClick={handleSpeakSentence}
                      aria-label="Nghe câu ví dụ"
                      className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Nghe câu
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    "{currentWord?.exampleEn}"
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    👉 {currentWord?.exampleVi}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="text-center text-xs text-slate-400">
              {!isFlipped
                ? '👆 Chạm vào thẻ hoặc bấm phím Cách để xem nghĩa tiếng Việt'
                : '💡 Hãy chọn một trong hai nút bên dưới để ghi nhận kết quả'}
            </div>
          </div>

          {/* Action Buttons: Did you remember? */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-base shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
              <span>Chưa nhớ (Cần ôn lại)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Đã nhớ rồi! 🎉</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
