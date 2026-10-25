import React, { useMemo } from 'react';
import {
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  PieChart,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { UserWordProgress, UserDialogueProgress, UserDailyStat, WordCategory } from '../types';
import { VOCABULARY_LIST } from '../data/dictionary';
import { DIALOGUES_LIST } from '../data/dialogues';

interface AnalyticsViewProps {
  wordProgressMap: Record<string, UserWordProgress>;
  dialogueProgressMap: Record<string, UserDialogueProgress>;
  dailyStatsMap: Record<string, UserDailyStat>;
  streakDays: number;
  onNavigateToFlashcards?: () => void;
  onNavigateToDialogues?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  wordProgressMap,
  dialogueProgressMap,
  dailyStatsMap,
  streakDays,
  onNavigateToFlashcards,
  onNavigateToDialogues,
}) => {
  // 1. Overall stats calculation
  const totalWords = VOCABULARY_LIST.length;
  const totalDialogues = DIALOGUES_LIST.length;

  const masteredWordsCount = useMemo(() => {
    return Object.values(wordProgressMap).filter((p) => p.status === 'mastered').length;
  }, [wordProgressMap]);

  const learningWordsCount = useMemo(() => {
    return Object.values(wordProgressMap).filter((p) => p.status === 'learning').length;
  }, [wordProgressMap]);

  const unstudiedWordsCount = totalWords - masteredWordsCount - learningWordsCount;

  const completedDialoguesCount = useMemo(() => {
    return Object.values(dialogueProgressMap).filter((p) => p.completed).length;
  }, [dialogueProgressMap]);

  // Total reviews and accuracy
  const { totalReviews, totalCorrect, accuracyRate } = useMemo(() => {
    let reviews = 0;
    let correct = 0;
    Object.values(wordProgressMap).forEach((p) => {
      reviews += p.reviewCount || 0;
      correct += p.correctCount || 0;
    });
    const acc = reviews > 0 ? Math.round((correct / reviews) * 100) : 100;
    return { totalReviews: reviews, totalCorrect: correct, accuracyRate: acc };
  }, [wordProgressMap]);

  // 2. Weekly Bar Chart Data (last 7 days)
  const weeklyData = useMemo(() => {
    const days: { dateStr: string; label: string; count: number; dialogues: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Day name in Vietnamese (T2, T3, T4, T5, T6, T7, CN)
      const dayIndex = d.getDay();
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const label = dayNames[dayIndex];

      const stat = dailyStatsMap[dateStr];
      const count = stat?.wordsReviewed || 0;
      const dialogues = stat?.dialoguesRead || 0;

      days.push({
        dateStr,
        label,
        count,
        dialogues,
      });
    }

    return days;
  }, [dailyStatsMap]);

  const maxDailyCount = useMemo(() => {
    const max = Math.max(...weeklyData.map((d) => d.count), 5);
    return max;
  }, [weeklyData]);

  // 3. Category Breakdown
  const categoriesStats = useMemo(() => {
    const categories: WordCategory[] = [
      'Animals',
      'Food & Drinks',
      'Colors & Shapes',
      'Family & Home',
      'School & Stationery',
      'Toys & Hobbies',
      'Clothes & Body',
      'Nature & Weather',
      'Actions & Daily',
    ];

    return categories.map((cat) => {
      const catWords = VOCABULARY_LIST.filter((w) => w.category === cat);
      const totalInCat = catWords.length;
      const masteredInCat = catWords.filter(
        (w) => wordProgressMap[w.id]?.status === 'mastered'
      ).length;
      const percentage = Math.round((masteredInCat / totalInCat) * 100);

      return {
        category: cat,
        total: totalInCat,
        mastered: masteredInCat,
        percentage,
      };
    });
  }, [wordProgressMap]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-amber-900 text-xs font-bold mb-3 border border-amber-200">
            <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Nhật ký & Báo cáo học tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Bảng theo dõi tiến độ của Bé
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Ghi nhận mọi nỗ lực mỗi ngày: số từ đã ghi nhớ, cuộc hội thoại đã đọc và biểu đồ hoạt động tuần.
          </p>
        </div>
        <div className="hidden lg:block absolute -right-4 -bottom-6 text-9xl opacity-30 select-none pointer-events-none">
          📊
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Mastered Words */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Từ đã thuộc
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {masteredWordsCount}
            <span className="text-sm font-semibold text-slate-400"> / {totalWords}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(masteredWordsCount / totalWords) * 100}%` }}
            />
          </div>
        </div>

        {/* Dialogues Read */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hội thoại xong
            </span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {completedDialoguesCount}
            <span className="text-sm font-semibold text-slate-400"> / {totalDialogues}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${(completedDialoguesCount / totalDialogues) * 100}%` }}
            />
          </div>
        </div>

        {/* Learning Streak */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chuỗi ngày học
            </span>
            <span className="p-2 rounded-xl bg-orange-50 text-orange-500">
              <Flame className="w-4 h-4 fill-current" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {streakDays} <span className="text-sm font-semibold text-slate-400">ngày liên tục</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {streakDays > 1 ? 'Bé giữ phong độ rất tốt! 🔥' : 'Học mỗi ngày để tăng chuỗi ngày nhé'}
          </p>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tỷ lệ nhớ đúng
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {accuracyRate}%
          </div>
          <p className="text-[11px] text-slate-500">
            Đã ôn {totalReviews} lượt flashcard
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Weekly Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                Biểu đồ hoạt động 7 ngày gần nhất
              </h3>
              <p className="text-xs text-slate-500">
                Số lượt từ vựng bé đã ôn tập mỗi ngày
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {weeklyData.reduce((acc, curr) => acc + curr.count, 0)} lượt tuần này
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 border-b border-slate-100">
              {weeklyData.map((item, index) => {
                const heightPercent = Math.max((item.count / maxDailyCount) * 100, 8);
                const isToday = index === weeklyData.length - 1;

                return (
                  <div key={item.dateStr} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <span className="text-[10px] font-bold text-slate-600 opacity-80 group-hover:opacity-100 transition-opacity">
                      {item.count > 0 ? `${item.count} từ` : '0'}
                    </span>

                    {/* Bar */}
                    <div className="w-full max-w-[40px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-sm'
                            : item.count > 0
                            ? 'bg-amber-300 hover:bg-amber-400'
                            : 'bg-slate-200'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* Day label */}
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-amber-600 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                      {isToday && <span className="block text-[9px] -mt-0.5">Nay</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Vocabulary Mastery Doughnut & Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Tình trạng 105 từ vựng
            </h3>
            <p className="text-xs text-slate-500">
              Mức độ thành thạo các từ trong kho
            </p>
          </div>

          {/* Visual Doughnut Bar */}
          <div className="space-y-3 pt-2">
            <div className="h-5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5">
              <div
                className="bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${(masteredWordsCount / totalWords) * 100}%` }}
                title={`Đã thuộc: ${masteredWordsCount}`}
              />
              <div
                className="bg-orange-400 transition-all duration-500"
                style={{ width: `${(learningWordsCount / totalWords) * 100}%` }}
                title={`Đang học: ${learningWordsCount}`}
              />
              <div
                className="bg-slate-200 rounded-r-full transition-all duration-500"
                style={{ width: `${(unstudiedWordsCount / totalWords) * 100}%` }}
                title={`Chưa học: ${unstudiedWordsCount}`}
              />
            </div>

            {/* Legend */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Đã thành thạo</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-700">
                  {masteredWordsCount} từ ({Math.round((masteredWordsCount / totalWords) * 100)}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-orange-50/70 border border-orange-100/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Đang luyện tập</span>
                </div>
                <span className="text-sm font-extrabold text-orange-700">
                  {learningWordsCount} từ ({Math.round((learningWordsCount / totalWords) * 100)}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-xs font-bold text-slate-600">Chưa bắt đầu</span>
                </div>
                <span className="text-sm font-bold text-slate-600">
                  {unstudiedWordsCount} từ ({Math.round((unstudiedWordsCount / totalWords) * 100)}%)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToFlashcards}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tiếp tục ôn Flashcard</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Progress Bars */}
      <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tiến độ nắm vững theo 9 chủ đề
          </h3>
          <p className="text-xs text-slate-500">
            Xem chủ đề nào bé đã ghi nhớ xuất sắc nhất
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {categoriesStats.map((cat) => (
            <div
              key={cat.category}
              className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100/70 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {cat.category}
                </span>
                <span className="text-xs font-extrabold text-amber-800">
                  {cat.mastered}/{cat.total}
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Hoàn thành</span>
                <span className="font-bold text-slate-600">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
