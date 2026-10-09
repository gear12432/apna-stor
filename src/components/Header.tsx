import React, { useState } from 'react';
import { Store, Bell, MoreVertical, ArrowLeft, User, Settings as SettingsIcon, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
  unreadAlertCount?: number;
}

export default function Header({
  title = "My Hisab",
  subtitle = "Your Trusted Business Partner",
  showBack = false,
  onBack,
  onNavigate,
  unreadAlertCount = 0
}: HeaderProps) {
  const { userProfile, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-4 py-3.5 shadow-md sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-blue-200 border border-white/20 shadow-inner">
              <Store className="w-6 h-6" />
            </div>
          )}

          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              {title}
            </h1>
            <p className="text-[11px] text-blue-200/90 font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1.5">
          {/* Notification Bell */}
          <button
            onClick={() => onNavigate && onNavigate('reminders')}
            className="p-2 rounded-full hover:bg-white/10 text-blue-100 relative transition active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-blue-900 animate-pulse" />
            )}
          </button>

          {/* Three Dot Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-white/10 text-blue-100 transition active:scale-95"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl py-1.5 text-slate-700 z-50 border border-slate-100 text-sm animate-in fade-in zoom-in-95 duration-100">
                  {userProfile && (
                    <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70">
                      <p className="font-semibold text-slate-800 text-xs truncate">{userProfile.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{userProfile.email}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowMenu(false); onNavigate && onNavigate('profile'); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center space-x-2.5 text-slate-700 font-medium"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); onNavigate && onNavigate('settings'); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center space-x-2.5 text-slate-700 font-medium"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-600" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); onNavigate && onNavigate('reports'); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center space-x-2.5 text-slate-700 font-medium"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Reports</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      await logout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2.5 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
