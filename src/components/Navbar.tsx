import React from 'react';
import { BookOpen, Layers, MessageSquare, BarChart3, Flame, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User | null;
  streakDays: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  streakDays,
  onOpenAuth,
}) => {
  const tabs = [
    { id: 'dictionary' as ActiveTab, label: 'Từ điển', icon: BookOpen, count: '105' },
    { id: 'flashcards' as ActiveTab, label: 'Flashcard', icon: Layers, highlight: true },
    { id: 'dialogues' as ActiveTab, label: 'Hội thoại', icon: MessageSquare, count: '20' },
    { id: 'analytics' as ActiveTab, label: 'Bảng theo dõi', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div
            onClick={() => onTabChange('dictionary')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
              🦁
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">
                  English with Me
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Cho Bé
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Học tiếng Anh nhẹ nhàng & vui vẻ
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-amber-50/70 p-1 rounded-2xl border border-amber-100/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-amber-700 shadow-xs border border-amber-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/60 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Streak & User Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 font-bold text-xs sm:text-sm shadow-xs"
              title="Chuỗi ngày học liên tục"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-current animate-pulse" />
              <span>{streakDays} ngày</span>
            </div>

            {/* Auth Button */}
            {user ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Bé'}
                    className="w-7 h-7 rounded-full object-cover border border-amber-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-300 text-amber-900 font-bold flex items-center justify-center text-xs">
                    {user.displayName?.[0] || 'B'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || 'Tài khoản'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
              >
                <UserIcon className="w-4 h-4 text-amber-400" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar at top (compact) */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-amber-100/70">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
