import React from 'react';
import { Store, Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-xs w-full flex flex-col items-center text-center border border-slate-100">
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 animate-pulse">
          <Store className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Hisab</h1>
        <p className="text-xs text-blue-600 font-medium mt-1">Your Trusted Business Partner</p>
        
        <div className="mt-8 flex flex-col items-center">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-500 mt-2">Loading...</span>
        </div>
      </div>
    </div>
  );
}
