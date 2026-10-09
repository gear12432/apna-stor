import React, { useState } from 'react';
import { Store, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onNavigate: (screen: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const { login, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErr, setValidationErr] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErr('');
    setAuthError(null);

    if (!email.trim()) {
      setValidationErr('Please enter valid Gmail address');
      return;
    }
    if (!password) {
      setValidationErr('Please enter password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
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
          <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to your account</p>
        </div>

        {(authError || validationErr) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{validationErr || authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-blue-700 hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition duration-200 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-70 mt-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-blue-700 font-bold hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
