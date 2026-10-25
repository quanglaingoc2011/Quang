import React, { useState, useMemo } from 'react';
import { Search, Volume2, Star, CheckCircle, Sparkles, Filter, Play, Layers } from 'lucide-react';
import { VocabularyWord, WordCategory, UserWordProgress, WordStatus } from '../types';
import { VOCABULARY_LIST } from '../data/dictionary';
import { speakEnglish, playStarSound } from '../utils/audio';
import { toggleWordStarred } from '../services/progressService';
import { WordPopupModal } from './WordPopupModal';

interface DictionaryViewProps {
  wordProgressMap: Record<string, UserWordProgress>;
  onStartFlashcardsWithCategory?: (category: WordCategory | 'all') => void;
  onRefreshData?: () => void;
}

const CATEGORIES: { id: WordCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả (105)', icon: '🌈' },
  { id: 'Animals', label: 'Động vật', icon: '🐶' },
  { id: 'Food & Drinks', label: 'Hoa quả & Món ăn', icon: '🍎' },
  { id: 'Colors & Shapes', label: 'Màu sắc & Hình khối', icon: '🎨' },
  { id: 'Family & Home', label: 'Gia đình & Nhà cửa', icon: '🏡' },
  { id: 'School & Stationery', label: 'Trường học & Dụng cụ', icon: '🎒' },
  { id: 'Toys & Hobbies', label: 'Đồ chơi & Sở thích', icon: '⚽' },
  { id: 'Clothes & Body', label: 'Trang phục & Cơ thể', icon: '👕' },
  { id: 'Nature & Weather', label: 'Tự nhiên & Thời tiết', icon: '⛅' },
  { id: 'Actions & Daily', label: 'Hành động hàng ngày', icon: '🏃' },
];

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  wordProgressMap,
  onStartFlashcardsWithCategory,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mastered' | 'learning' | 'starred'>('all');
  const [activeModalWord, setActiveModalWord] = useState<VocabularyWord | null>(null);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  // Filtered words
  const filteredWords = useMemo(() => {
    return VOCABULARY_LIST.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status match
      const p = wordProgressMap[item.id];
      if (statusFilter === 'mastered' && p?.status !== 'mastered') return false;
      if (statusFilter === 'learning' && p?.status !== 'learning') return false;
      if (statusFilter === 'starred' && !p?.starred) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEn = item.word.toLowerCase().includes(q);
        const matchVi = item.vietnamese.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        return matchEn || matchVi || matchCat;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, statusFilter, wordProgressMap]);

  const handleSpeak = async (e: React.MouseEvent, word: VocabularyWord) => {
    e.stopPropagation();
    setSpeakingWordId(word.id);
    await speakEnglish(word.word, false);
    setSpeakingWordId(null);
  };

  const handleToggleStar = async (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    await toggleWordStarred(wordId);
    playStarSound();
    onRefreshData?.();
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-amber-900 text-xs font-bold mb-3 border border-amber-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Kho từ vựng 105 từ chuẩn cho trẻ em</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Tra cứu từ điển & Luyện phát âm
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Mỗi từ đều có phát âm chuẩn, phiên âm quốc tế, hình vẽ biểu tượng và ví dụ gần gũi. Bấm vào loa để nghe giọng đọc bản xứ!
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onStartFlashcardsWithCategory?.(selectedCategory)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Học Flashcard chủ đề này</span>
            </button>
          </div>
        </div>
        <div className="hidden lg:block absolute -right-4 -bottom-6 text-9xl opacity-30 select-none pointer-events-none">
          📖
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ tiếng Anh hoặc tiếng Việt (vd: cat, con mèo, quả táo...)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 p-1"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Đã thuộc
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('learning')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'learning'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đang học
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('starred')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === 'starred'
                  ? 'bg-amber-400 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              Yêu thích
            </button>
          </div>
        </div>

        {/* Category Pills (horizontal scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-slate-700 border border-amber-200/50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Words Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Hiển thị {filteredWords.length} từ vựng
          </p>
          {filteredWords.length > 0 && (
            <span className="text-xs text-slate-400">
              Nhấn vào thẻ từ để xem chi tiết & câu ví dụ
            </span>
          )}
        </div>

        {filteredWords.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 shadow-xs">
            <span className="text-5xl">🔍</span>
            <h3 className="text-lg font-bold text-slate-800 mt-3">
              Không tìm thấy từ phù hợp
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang chủ đề "Tất cả" nhé.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold hover:bg-amber-200 transition-all cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredWords.map((word) => {
              const progress = wordProgressMap[word.id];
              const isMastered = progress?.status === 'mastered';
              const isStarred = progress?.starred;
              const isSpeaking = speakingWordId === word.id;

              return (
                <div
                  key={word.id}
                  onClick={() => setActiveModalWord(word)}
                  className={`group relative bg-white rounded-2xl p-4 border transition-all hover:shadow-md hover:border-amber-300 cursor-pointer flex flex-col justify-between ${
                    isMastered ? 'border-emerald-200/80 bg-emerald-50/20' : 'border-amber-100'
                  }`}
                >
                  <div>
                    {/* Top row: Emoji & Badges */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl p-1 rounded-xl bg-amber-50 group-hover:scale-110 transition-transform">
                          {word.emoji}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                              {word.word}
                            </h3>
                            {isMastered && (
                              <span
                                title="Đã thuộc"
                                className="text-emerald-600"
                              >
                                <CheckCircle className="w-4 h-4 fill-emerald-100" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-amber-700/80 font-mono">
                            {word.phonetic}
                          </span>
                        </div>
                      </div>

                      {/* Top actions: Speaker & Star */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(e, word.id)}
                          aria-label={isStarred ? "Bỏ lưu từ này" : "Lưu từ này"}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            isStarred
                              ? 'text-amber-400 hover:text-amber-500'
                              : 'text-slate-300 hover:text-amber-400'
                          }`}
                          title={isStarred ? 'Bỏ lưu' : 'Lưu từ này'}
                        >
                          <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleSpeak(e, word)}
                          aria-label={`Phát âm ${word.word}`}
                          disabled={isSpeaking}
                          className="p-1.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-all cursor-pointer active:scale-90"
                          title="Phát âm từ này"
                        >
                          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-amber-600' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Vietnamese translation */}
                    <div className="mt-3 text-sm font-semibold text-slate-800">
                      {word.vietnamese}
                    </div>

                    {/* Example snippet */}
                    <div className="mt-1 text-xs text-slate-500 line-clamp-1 italic">
                      "{word.exampleEn}"
                    </div>
                  </div>

                  {/* Bottom category tag */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 font-medium">
                      {word.category}
                    </span>
                    <span className="text-amber-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Xem thẻ ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Word Modal */}
      {activeModalWord && (
        <WordPopupModal
          word={activeModalWord}
          progress={wordProgressMap[activeModalWord.id]}
          isOpen={true}
          onClose={() => setActiveModalWord(null)}
          onProgressUpdated={onRefreshData}
        />
      )}
    </div>
  );
};
