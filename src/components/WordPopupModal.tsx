import React, { useState } from 'react';
import { Volume2, VolumeX, Star, CheckCircle, X, Sparkles, BookOpen } from 'lucide-react';
import { VocabularyWord, UserWordProgress } from '../types';
import { speakEnglish, playChimeSound, playStarSound } from '../utils/audio';
import { toggleWordStarred, recordWordReview } from '../services/progressService';

interface WordPopupModalProps {
  word: VocabularyWord;
  progress?: UserWordProgress;
  isOpen: boolean;
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export const WordPopupModal: React.FC<WordPopupModalProps> = ({
  word,
  progress,
  isOpen,
  onClose,
  onProgressUpdated,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowPlaying, setIsSlowPlaying] = useState(false);
  const [isStarred, setIsStarred] = useState(progress?.starred ?? false);
  const [isMastered, setIsMastered] = useState(progress?.status === 'mastered');

  if (!isOpen) return null;

  const handleSpeak = async (slow: boolean = false) => {
    if (slow) {
      setIsSlowPlaying(true);
      await speakEnglish(word.word, true);
      setIsSlowPlaying(false);
    } else {
      setIsPlaying(true);
      await speakEnglish(word.word, false);
      setIsPlaying(false);
    }
  };

  const handleSpeakSentence = async () => {
    setIsPlaying(true);
    await speakEnglish(word.exampleEn, false);
    setIsPlaying(false);
  };

  const handleToggleStar = async () => {
    const updated = await toggleWordStarred(word.id);
    setIsStarred(updated);
    playStarSound();
    onProgressUpdated?.();
  };

  const handleMarkMastered = async () => {
    await recordWordReview(word.id, true);
    setIsMastered(true);
    playChimeSound();
    onProgressUpdated?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background with gentle warm tone */}
        <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-amber-50 px-6 py-5 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{word.emoji}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900">
                {word.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleStar}
                aria-label={isStarred ? "Bỏ yêu thích" : "Yêu thích"}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isStarred
                    ? 'bg-amber-400 text-white shadow-xs'
                    : 'bg-white/80 text-slate-400 hover:text-amber-500 hover:bg-white'
                }`}
                title={isStarred ? 'Đã lưu yêu thích' : 'Lưu vào từ yêu thích'}
              >
                <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ"
                className="p-2 rounded-full bg-white/80 text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {word.word}
            </h3>
            <p className="text-sm font-medium text-amber-700/80 mt-0.5">
              {word.phonetic}
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {/* Vietnamese meaning */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100/80 text-center">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Nghĩa tiếng Việt
            </span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {word.vietnamese}
            </div>
          </div>

          {/* Pronunciation audio controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSpeak(false)}
              disabled={isPlaying}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-5 h-5" />
              <span>Phát âm (1.0x)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSpeak(true)}
              disabled={isSlowPlaying}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>🐢 Chậm (0.7x)</span>
            </button>
          </div>

          {/* Example sentence */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Câu ví dụ
              </span>
              <button
                type="button"
                onClick={handleSpeakSentence}
                aria-label="Nghe câu ví dụ"
                className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Nghe câu
              </button>
            </div>
            <p className="text-sm font-medium text-slate-900">
              "{word.exampleEn}"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              👉 {word.exampleVi}
            </p>
          </div>

          {/* Footer action button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleMarkMastered}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                isMastered
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isMastered ? 'Bé đã thuộc từ này! 🎉' : 'Đánh dấu đã thuộc từ này'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
