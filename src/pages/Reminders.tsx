import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribeReminders, saveReminder, deleteReminder } from '../services/firestoreService';
import { Reminder } from '../types';

interface RemindersProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Reminders({ onBack, onNavigate }: RemindersProps) {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<Reminder['type']>('Payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reminderTypes: Reminder['type'][] = ['Payment', 'Bill', 'Rent', 'Stock', 'Work', 'Other'];

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeReminders(currentUser.uid, setReminders);
    return () => unsub();
  }, [currentUser]);

  const openAddModal = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setReminderDate(new Date().toISOString().split('T')[0]);
    setType('Payment');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) {
      setError('Please enter reminder title');
      return;
    }

    setLoading(true);
    try {
      const reminderId = `rem_${Date.now()}`;
      const newReminder: Reminder = {
        reminderId,
        title: title.trim(),
        description: description.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        reminderDate,
        type,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      await saveReminder(currentUser.uid, newReminder);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving reminder:', err);
      setError('Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (r: Reminder) => {
    if (!currentUser) return;
    try {
      await saveReminder(currentUser.uid, {
        ...r,
        status: r.status === 'Completed' ? 'Pending' : 'Completed'
      });
    } catch (err) {
      console.error('Error toggling reminder status:', err);
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (!currentUser) return;
    try {
      await deleteReminder(currentUser.uid, reminderId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Reminders" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Upcoming Reminders</h2>
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Reminder</span>
          </button>
        </div>

        {reminders.length > 0 ? (
          <div className="space-y-2.5">
            {reminders.map((r) => {
              const isDone = r.status === 'Completed';
              return (
                <div key={r.reminderId} className={`bg-white rounded-2xl p-3.5 border shadow-sm space-y-2 transition ${isDone ? 'opacity-60 bg-slate-50' : 'border-amber-200/80'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleComplete(r)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent hover:border-amber-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div>
                        <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {r.title}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {r.type} • {r.reminderDate}
                        </p>
                        {r.description && <p className="text-xs text-slate-600 mt-1">{r.description}</p>}
                      </div>
                    </div>

                    {r.amount !== undefined && r.amount > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          ₹{r.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button onClick={() => setDeleteConfirmId(r.reminderId)} className="text-slate-400 hover:text-rose-600 text-xs font-semibold">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {deleteConfirmId === r.reminderId && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                      <p className="font-bold text-rose-800">Are you sure you want to delete this reminder?</p>
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-white text-slate-600 rounded-lg">Cancel</button>
                        <button onClick={() => handleDelete(r.reminderId)} className="px-3 py-1 bg-rose-600 text-white rounded-lg">Yes, Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No reminders found</p>
            <button onClick={openAddModal} className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl">
              + Add Reminder
            </button>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Reminder</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {reminderTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electricity Bill / Supplier Payment"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ₹ (Optional)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Reminder</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
