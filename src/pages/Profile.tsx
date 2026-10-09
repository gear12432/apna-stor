import React, { useState } from 'react';
import { User, Phone, Mail, Building2, MapPin, Edit3, Loader2, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/firestoreService';

interface ProfileProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Profile({ onBack, onNavigate }: ProfileProps) {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(userProfile?.mobileNumber || '');
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [address, setAddress] = useState(userProfile?.address || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!fullName.trim()) {
      setError('Please enter full name');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(currentUser.uid, {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        businessName: businessName.trim(),
        address: address.trim(),
      });
      await refreshUserProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="My Profile" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* User Card Header */}
        <div className="bg-gradient-to-tr from-blue-900 to-indigo-800 rounded-3xl p-6 text-white shadow-xl text-center space-y-2">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center font-extrabold text-3xl mx-auto shadow-inner text-blue-100 border border-white/20">
            {userProfile?.fullName ? userProfile.fullName[0].toUpperCase() : 'M'}
          </div>
          <h2 className="text-xl font-bold">{userProfile?.fullName || 'Business Owner'}</h2>
          <p className="text-xs text-blue-200">{userProfile?.email}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Personal Details</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save</span>}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded-xl">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Name</span>
                  <p className="font-bold text-slate-800">{userProfile?.fullName || '-'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded-xl">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Mobile</span>
                  <p className="font-bold text-slate-800">{userProfile?.mobileNumber || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded-xl">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Gmail</span>
                  <p className="font-bold text-slate-800">{userProfile?.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded-xl">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Business Name</span>
                  <p className="font-bold text-slate-800">{userProfile?.businessName || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded-xl">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Address</span>
                  <p className="font-bold text-slate-800">{userProfile?.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
