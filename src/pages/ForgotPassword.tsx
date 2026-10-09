import React, { useState } from 'react';
import { Store, Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ForgotPasswordProps {
  onNavigate: (screen: string) => void;
}

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { resetPassword, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [validationErr, setValidationErr] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErr('');
    setAuthError(null);
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setValidationErr('Please enter valid Gmail address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('Password reset link has been sent to your Gmail.');
    } catch (err: any) {
      // Handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-900 to-indigo-700 text-white rounded-2xl shadow-xl mb-3">
          <Store className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Hisab</h1>
        <p className="text-xs text-blue-800 font-semibold mt-1">Your Trusted Business Partner</p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full mx-auto border border-slate-100">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your Gmail to receive a password reset link</p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {(authError || validationErr) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{validationErr || authError}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gmail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition duration-200 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-70 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center space-x-1.5 text-xs text-blue-700 font-bold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
