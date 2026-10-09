import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Key, 
  Bell, 
  ShieldCheck, 
  FileText, 
  Info, 
  LogOut, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Loader2, 
  Store 
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

interface SettingsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Settings({ onBack, onNavigate }: SettingsProps) {
  const { currentUser, userProfile, logout, resetPassword } = useAuth();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);

  const handleSendReset = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      await resetPassword(currentUser.email);
      setPasswordSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Settings" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* User Card */}
        {userProfile && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-lg text-blue-100">
                {userProfile.fullName ? userProfile.fullName[0].toUpperCase() : 'M'}
              </div>
              <div>
                <h2 className="text-base font-bold">{userProfile.fullName}</h2>
                <p className="text-xs text-blue-200">{userProfile.email}</p>
                {userProfile.businessName && (
                  <span className="inline-block px-2 py-0.5 bg-white/10 rounded-md text-[10px] mt-1 font-semibold">
                    {userProfile.businessName}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition"
            >
              View
            </button>
          </div>
        )}

        {/* Options List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
          {/* My Profile */}
          <button
            onClick={() => onNavigate('profile')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-bold">My Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Business Details */}
          <button
            onClick={() => onNavigate('profile-setup')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">Business Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Change Password */}
          <button
            onClick={() => { setPasswordSent(false); setShowPasswordModal(true); }}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <Key className="w-4 h-4 text-amber-600" />
              <span className="font-bold">Change Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Notification Settings */}
          <button
            onClick={() => setShowNotificationModal(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4 text-purple-600" />
              <span className="font-bold">Notification Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Privacy Policy */}
          <button
            onClick={() => setShowPolicyModal(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-bold">Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Terms & Conditions */}
          <button
            onClick={() => setShowTermsModal(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="font-bold">Terms & Conditions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* About My Hisab */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 transition"
          >
            <div className="flex items-center space-x-3">
              <Info className="w-4 h-4 text-sky-600" />
              <span className="font-bold">About My Hisab</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Logout */}
          <button
            onClick={async () => await logout()}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-rose-50 text-rose-600 transition"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span className="font-bold">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSent ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs space-y-2 border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold">Password Reset Email Sent!</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Please check your Gmail ({currentUser?.email}) to reset your password.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  A password reset link will be sent to your Gmail <strong>({currentUser?.email})</strong>.
                </p>
                <button
                  onClick={handleSendReset}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Password Reset Link</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Notification Settings</h3>
              <button onClick={() => setShowNotificationModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-800">Due Payment Reminders</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-800">Low Stock Alerts</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Privacy Policy</h3>
              <button onClick={() => setShowPolicyModal(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              My Hisab respects your data privacy. All your accounting data is stored fully encrypted and secure using Firebase Firestore. Your data is never shared with any third party.
            </p>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Terms & Conditions</h3>
              <button onClick={() => setShowTermsModal(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              My Hisab application is intended for managing personal and business accounts. Users are solely responsible for the accuracy of data entered into the app.
            </p>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl">
            <div className="w-14 h-14 bg-blue-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">My Hisab</h3>
            <p className="text-xs text-blue-800 font-bold">Your Trusted Business Partner</p>
            <p className="text-[11px] text-slate-500">Version 2.0.0 (Mobile Accounting)</p>
            <button onClick={() => setShowAboutModal(false)} className="w-full py-2 bg-slate-100 font-bold text-xs rounded-xl text-slate-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
