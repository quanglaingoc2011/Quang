import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  MessageSquare,
  Volume2,
  CheckCircle,
  Play,
  Pause,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Dialogue, UserDialogueProgress, VocabularyWord, UserWordProgress } from '../types';
import { DIALOGUES_LIST } from '../data/dialogues';
import { lookupDictionaryWord, VOCABULARY_LIST } from '../data/dictionary';
import { speakEnglish, stopSpeaking, playChimeSound, playCelebrationSound } from '../utils/audio';
import { recordDialogueCompletion } from '../services/progressService';
import { WordPopupModal } from './WordPopupModal';

// Supplementary lookup for common words in dialogues
const COMMON_DIALOGUE_WORDS: Record<string, Partial<VocabularyWord>> = {
  hello: { word: 'Hello', phonetic: '/həˈloʊ/', vietnamese: 'Xin chào', category: 'Actions & Daily', emoji: '👋', exampleEn: 'Hello, how are you today?', exampleVi: 'Xin chào, hôm nay bạn thế nào?' },
  hi: { word: 'Hi', phonetic: '/haɪ/', vietnamese: 'Chào bạn', category: 'Actions & Daily', emoji: '🖐️', exampleEn: 'Hi my friend!', exampleVi: 'Chào người bạn của tôi!' },
  name: { word: 'Name', phonetic: '/neɪm/', vietnamese: 'Tên gọi', category: 'Actions & Daily', emoji: '🏷️', exampleEn: 'My name is Alex.', exampleVi: 'Tên của tôi là Alex.' },
  what: { word: 'What', phonetic: '/wɑːt/', vietnamese: 'Cái gì / Điều gì', category: 'Actions & Daily', emoji: '❓', exampleEn: 'What is this?', exampleVi: 'Đây là cái gì thế?' },
  is: { word: 'Is', phonetic: '/ɪz/', vietnamese: 'Là / Ở (thì, là, ở)', category: 'Actions & Daily', emoji: '✨', exampleEn: 'She is my sister.', exampleVi: 'Cô ấy là em gái tôi.' },
  my: { word: 'My', phonetic: '/maɪ/', vietnamese: 'Của tôi', category: 'Actions & Daily', emoji: '🙋', exampleEn: 'This is my book.', exampleVi: 'Đây là quyển sách của tôi.' },
  your: { word: 'Your', phonetic: '/jʊr/', vietnamese: 'Của bạn', category: 'Actions & Daily', emoji: '👉', exampleEn: 'What is your hobby?', exampleVi: 'Sở thích của bạn là gì?' },
  nice: { word: 'Nice', phonetic: '/naɪs/', vietnamese: 'Tốt, Đẹp, Dễ chịu', category: 'Actions & Daily', emoji: '👍', exampleEn: 'Have a nice day!', exampleVi: 'Chúc một ngày tốt lành nhé!' },
  meet: { word: 'Meet', phonetic: '/miːt/', vietnamese: 'Gặp gỡ', category: 'Actions & Daily', emoji: '🤝', exampleEn: 'Nice to meet you.', exampleVi: 'Rất vui được gặp bạn.' },
  you: { word: 'You', phonetic: '/juː/', vietnamese: 'Bạn / Các bạn', category: 'Actions & Daily', emoji: '👦', exampleEn: 'How are you?', exampleVi: 'Bạn có khỏe không?' },
  how: { word: 'How', phonetic: '/haʊ/', vietnamese: 'Như thế nào / Bao nhiêu', category: 'Actions & Daily', emoji: '🤔', exampleEn: 'How old are you?', exampleVi: 'Bạn mấy tuổi rồi?' },
  old: { word: 'Old', phonetic: '/oʊld/', vietnamese: 'Tuổi / Cũ', category: 'Actions & Daily', emoji: '⏳', exampleEn: 'I am seven years old.', exampleVi: 'Tớ bảy tuổi rồi.' },
  class: { word: 'Class', phonetic: '/klæs/', vietnamese: 'Lớp học', category: 'School & Stationery', emoji: '🏫', exampleEn: 'We study in the same class.', exampleVi: 'Chúng mình học cùng lớp.' },
  together: { word: 'Together', phonetic: '/təˈɡeðər/', vietnamese: 'Cùng nhau', category: 'Actions & Daily', emoji: '👫', exampleEn: 'Let’s play together.', exampleVi: 'Cùng chơi với nhau nào.' },
  yes: { word: 'Yes', phonetic: '/jes/', vietnamese: 'Có / Vâng / Đúng vậy', category: 'Actions & Daily', emoji: '👌', exampleEn: 'Yes, of course!', exampleVi: 'Vâng, tất nhiên rồi!' },
  no: { word: 'No', phonetic: '/noʊ/', vietnamese: 'Không', category: 'Actions & Daily', emoji: '🙅', exampleEn: 'No, thank you.', exampleVi: 'Dạ không, con cảm ơn.' },
  good: { word: 'Good', phonetic: '/ɡʊd/', vietnamese: 'Tốt / Hay', category: 'Actions & Daily', emoji: '⭐', exampleEn: 'Good morning!', exampleVi: 'Chào buổi sáng!' },
  look: { word: 'Look', phonetic: '/lʊk/', vietnamese: 'Nhìn xem', category: 'Actions & Daily', emoji: '👀', exampleEn: 'Look at the rainbow!', exampleVi: 'Nhìn cầu vồng kìa!' },
  tall: { word: 'Tall', phonetic: '/tɔːl/', vietnamese: 'Cao lớn', category: 'Actions & Daily', emoji: '🦒', exampleEn: 'The giraffe is tall.', exampleVi: 'Hươu cao cổ rất cao.' },
  big: { word: 'Big', phonetic: '/bɪɡ/', vietnamese: 'To lớn', category: 'Actions & Daily', emoji: '🐘', exampleEn: 'The elephant is very big.', exampleVi: 'Con voi rất to lớn.' },
  sweet: { word: 'Sweet', phonetic: '/swiːt/', vietnamese: 'Ngọt ngào', category: 'Food & Drinks', emoji: '🍬', exampleEn: 'Strawberries are sweet.', exampleVi: 'Dâu tây rất ngọt.' },
  clean: { word: 'Clean', phonetic: '/kliːn/', vietnamese: 'Sạch sẽ / Dọn dẹp', category: 'Family & Home', emoji: '✨', exampleEn: 'Keep the room clean.', exampleVi: 'Giữ căn phòng sạch sẽ.' },
  time: { word: 'Time', phonetic: '/taɪm/', vietnamese: 'Thời gian / Giờ giấc', category: 'Actions & Daily', emoji: '⏰', exampleEn: 'Time to go to bed.', exampleVi: 'Đã đến giờ đi ngủ rồi.' },
};

interface DialogueViewProps {
  dialogueProgressMap: Record<string, UserDialogueProgress>;
  wordProgressMap: Record<string, UserWordProgress>;
  onRefreshData?: () => void;
}

export const DialogueView: React.FC<DialogueViewProps> = ({
  dialogueProgressMap,
  wordProgressMap,
  onRefreshData,
}) => {
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(null);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [activeWordModal, setActiveWordModal] = useState<VocabularyWord | null>(null);
  const [playingLineIndex, setPlayingLineIndex] = useState<number | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);

  // If a dialogue is selected, render the dialogue detail screen
  if (selectedDialogue) {
    const isCompleted = dialogueProgressMap[selectedDialogue.id]?.completed;

    const handleSpeakLine = async (lineText: string, index: number) => {
      stopSpeaking();
      setPlayingLineIndex(index);
      await speakEnglish(lineText, false);
      setPlayingLineIndex(null);
    };

    const handlePlayFullDialogue = async () => {
      if (isPlayingFull) {
        stopSpeaking();
        setIsPlayingFull(false);
        setPlayingLineIndex(null);
        return;
      }

      setIsPlayingFull(true);
      for (let i = 0; i < selectedDialogue.lines.length; i++) {
        setPlayingLineIndex(i);
        await speakEnglish(selectedDialogue.lines[i].en, false);
        // Short pause between lines
        await new Promise((res) => setTimeout(res, 450));
      }
      setPlayingLineIndex(null);
      setIsPlayingFull(false);
    };

    const handleWordClick = (rawWord: string) => {
      const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '');
      if (!clean) return;

      // 1. Check in primary 105 words
      const foundInMain = lookupDictionaryWord(clean);
      if (foundInMain) {
        setActiveWordModal(foundInMain);
        return;
      }

      // 2. Check supplementary words
      const supp = COMMON_DIALOGUE_WORDS[clean];
      if (supp) {
        const constructedWord: VocabularyWord = {
          id: clean,
          word: supp.word || rawWord.replace(/[^a-zA-Z]/g, ''),
          phonetic: supp.phonetic || `/${clean}/`,
          vietnamese: supp.vietnamese || 'Từ vựng',
          partOfSpeech: 'noun',
          category: (supp.category as any) || 'Actions & Daily',
          emoji: supp.emoji || '💬',
          exampleEn: supp.exampleEn || `We use "${clean}" in daily conversations.`,
          exampleVi: supp.exampleVi || `Chúng ta dùng từ "${clean}" trong giao tiếp hàng ngày.`,
        };
        setActiveWordModal(constructedWord);
        return;
      }

      // 3. Fallback generic dictionary card for any valid English word clicked
      const capital = clean.charAt(0).toUpperCase() + clean.slice(1);
      const fallbackWord: VocabularyWord = {
        id: clean,
        word: capital,
        phonetic: `/${clean}/`,
        vietnamese: 'Từ vựng trong đoạn hội thoại',
        partOfSpeech: 'noun',
        category: 'Actions & Daily',
        emoji: '💡',
        exampleEn: `Listen carefully to how "${capital}" is used here.`,
        exampleVi: `Lắng nghe kỹ cách từ "${capital}" được dùng trong câu nhé.`,
      };
      setActiveWordModal(fallbackWord);
    };

    const handleCompleteDialogue = async () => {
      playChimeSound();
      await recordDialogueCompletion(selectedDialogue.id, 100);
      playCelebrationSound();
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
      onRefreshData?.();
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back and Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-3xl p-4 sm:p-5 border border-amber-100 shadow-xs">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setSelectedDialogue(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Danh sách 20 bài</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVietnamese(!showVietnamese)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showVietnamese
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
              title="Ẩn / Hiện dịch nghĩa tiếng Việt"
            >
              {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showVietnamese ? 'Hiện dịch' : 'Ẩn dịch'}</span>
            </button>

            <button
              type="button"
              onClick={handlePlayFullDialogue}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                isPlayingFull
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isPlayingFull ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingFull ? 'Dừng đọc' : 'Nghe toàn bài'}</span>
            </button>
          </div>
        </div>

        {/* Dialogue Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm space-y-6">
          {/* Header */}
          <div className="border-b border-amber-100/70 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <span>{selectedDialogue.category}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
                {selectedDialogue.level}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {selectedDialogue.title}
            </h2>
            <p className="text-base font-semibold text-amber-800 mt-0.5">
              {selectedDialogue.vietnameseTitle}
            </p>
            <p className="text-xs text-slate-500 mt-1 italic">
              Context: {selectedDialogue.context}
            </p>
          </div>

          {/* Interactive instruction tip */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mẹo hay cho bé:</span> Bấm vào{' '}
              <span className="underline decoration-amber-500 decoration-2 font-semibold">
                bất kỳ từ tiếng Anh nào
              </span>{' '}
              trong câu thoại để mở ngay Flashcard tra nghĩa và nghe phát âm nhé!
            </div>
          </div>

          {/* Lines Dialogue List */}
          <div className="space-y-4">
            {selectedDialogue.lines.map((line, idx) => {
              const isSpeakingThis = playingLineIndex === idx;
              // Split sentence into words while keeping punctuation separate
              const tokens = line.en.split(' ');

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSpeakingThis
                      ? 'bg-amber-100/60 border-amber-300 shadow-xs ring-2 ring-amber-300/40'
                      : 'bg-slate-50/60 hover:bg-amber-50/30 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-1 bg-white rounded-xl shadow-2xs border border-slate-100 shrink-0 select-none">
                      {line.avatar}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          {line.speaker}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSpeakLine(line.en, idx)}
                          aria-label={`Nghe câu của ${line.speaker}`}
                          className="p-1 rounded-full text-amber-600 hover:text-amber-800 hover:bg-amber-100/60 transition-all cursor-pointer"
                          title="Nghe câu này"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Clickable Words */}
                      <div className="text-base sm:text-lg font-bold text-slate-900 flex flex-wrap gap-x-1.5 gap-y-1">
                        {tokens.map((token, wIdx) => (
                          <button
                            key={wIdx}
                            type="button"
                            onClick={() => handleWordClick(token)}
                            className="hover:text-amber-700 hover:bg-amber-200/60 rounded-md px-1 -mx-1 transition-all cursor-pointer border-b-2 border-transparent hover:border-amber-500"
                            title="Bấm để xem Flashcard của từ này"
                          >
                            {token}
                          </button>
                        ))}
                      </div>

                      {/* Vietnamese line */}
                      {showVietnamese && (
                        <p className="text-xs sm:text-sm text-slate-600 italic pt-0.5">
                          {line.vi}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom completion button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCompleteDialogue}
              className={`w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-xs transition-all cursor-pointer active:scale-98 ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>
                {isCompleted
                  ? 'Bé đã hoàn thành xuất sắc đoạn này! (Học lại)'
                  : 'Đánh dấu bé đã đọc xong đoạn này 🎉'}
              </span>
            </button>
          </div>
        </div>

        {/* Word Flashcard Popup */}
        {activeWordModal && (
          <WordPopupModal
            word={activeWordModal}
            progress={wordProgressMap[activeWordModal.id]}
            isOpen={true}
            onClose={() => setActiveWordModal(null)}
            onProgressUpdated={onRefreshData}
          />
        )}
      </div>
    );
  }

  // List of 20 Dialogues
  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-amber-900 text-xs font-bold mb-3 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>20 Đoạn hội thoại sinh động & gần gũi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Luyện tập giao tiếp theo tình huống
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Mỗi bài là một cuộc trò chuyện ngắn thường gặp. Khi đọc, bé có thể{' '}
            <span className="font-bold text-amber-800">bấm vào bất kỳ từ nào</span> để xem flashcard và nghe phát âm!
          </p>
        </div>
        <div className="hidden lg:block absolute -right-4 -bottom-6 text-9xl opacity-30 select-none pointer-events-none">
          💬
        </div>
      </div>

      {/* Grid of 20 Dialogues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DIALOGUES_LIST.map((d, index) => {
          const isCompleted = dialogueProgressMap[d.id]?.completed;

          return (
            <div
              key={d.id}
              onClick={() => setSelectedDialogue(d)}
              className={`group bg-white rounded-3xl p-5 border transition-all hover:shadow-md hover:border-amber-300 cursor-pointer flex flex-col justify-between ${
                isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-100'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {d.category}
                    </span>
                  </div>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã học
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-3 group-hover:text-amber-700 transition-colors">
                  {d.title}
                </h3>
                <p className="text-xs font-semibold text-amber-800 mt-0.5">
                  {d.vietnameseTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                  {d.context}
                </p>

                {/* Speaker avatars & line preview */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {d.lines.slice(0, 3).map((l, lIdx) => (
                      <span
                        key={lIdx}
                        className="inline-block w-6 h-6 rounded-full bg-amber-50 text-xs border border-white flex items-center justify-center"
                      >
                        {l.avatar}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {d.lines.length} câu thoại
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                <span>Học bài này</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
