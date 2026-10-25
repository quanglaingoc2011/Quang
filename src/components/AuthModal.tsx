import React, { useState } from 'react';
import { X, LogIn, LogOut, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser } from '../firebase';
import { syncUserDataFromFirestore } from '../services/progressService';

interface AuthModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUserChanged: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, user, onClose, onUserChanged }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        await syncUserDataFromFirestore(loggedUser.uid);
        onUserChanged(loggedUser);
        onClose();
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Đăng nhập bằng tài khoản Google chưa thành công. Vui lòng thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onUserChanged(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng đăng nhập"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
            {user ? '🎉' : '🌟'}
          </div>
          <h3 className="text-2xl font-bold">
            {user ? 'Tài khoản của Bé' : 'Đăng nhập Google'}
          </h3>
          <p className="text-amber-100 text-xs mt-1">
            {user ? 'Tiến độ học của bé đã được lưu trữ an toàn' : 'Lưu lại toàn bộ từ vựng và chuỗi ngày học'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-12 h-12 rounded-full border-2 border-amber-300 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-lg">
                    {user.displayName?.[0] || 'B'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-800 truncate">
                    {user.displayName || 'Học viên nhí'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{user.email}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Đồng bộ tiến độ học tập trên đám mây</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Theo dõi số từ đã thuộc và chuỗi ngày học liên tục</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bảo mật an toàn với Firebase Firestore</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Không sợ mất điểm số và số từ bé đã rèn luyện khi đổi máy tính/điện thoại</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Xem biểu đồ báo cáo tiến độ tuần và tháng để phụ huynh nắm bắt</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Đang kết nối...' : 'Tiếp tục với Google'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Chỉ cần 1 chạm, hoàn toàn miễn phí & thân thiện cho bé
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
