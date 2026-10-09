import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, Trash2, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribeDailyWork, saveDailyWork, deleteDailyWork } from '../services/firestoreService';
import { DailyWork } from '../types';

interface DailyWorkProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function DailyWorkPage({ onBack, onNavigate }: DailyWorkProps) {
  const { currentUser } = useAuth();
  const [works, setWorks] = useState<DailyWork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingWork, setEditingWork] = useState<DailyWork | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advance, setAdvance] = useState('0');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeDailyWork(currentUser.uid, setWorks);
    return () => unsub();
  }, [currentUser]);

  const openAddModal = () => {
    setEditingWork(null);
    setCustomerName('');
    setMobile('');
    setWorkTitle('');
    setDescription('');
    setTotalAmount('');
    setAdvance('0');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setStatus('Pending');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (w: DailyWork) => {
    setEditingWork(w);
    setCustomerName(w.customerName);
    setMobile(w.mobile || '');
    setWorkTitle(w.workTitle);
    setDescription(w.description || '');
    setTotalAmount(String(w.totalAmount || 0));
    setAdvance(String(w.advance || 0));
    setWorkDate(w.workDate);
    setStatus(w.status);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!workTitle.trim()) {
      setError('Please enter work or service title');
      return;
    }

    setLoading(true);
    try {
      const workId = editingWork ? editingWork.workId : `work_${Date.now()}`;
      const tot = parseFloat(totalAmount) || 0;
      const adv = parseFloat(advance) || 0;
      const rem = Math.max(0, tot - adv);

      const newWork: DailyWork = {
        workId,
        customerName: customerName.trim() || 'Customer',
        mobile: mobile.trim(),
        workTitle: workTitle.trim(),
        description: description.trim(),
        totalAmount: tot,
        advance: adv,
        remainingAmount: rem,
        workDate,
        status,
        createdAt: editingWork ? editingWork.createdAt : new Date().toISOString()
      };

      await saveDailyWork(currentUser.uid, newWork);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving daily work:', err);
      setError('Failed to save work entry');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (w: DailyWork, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    if (!currentUser) return;
    try {
      await saveDailyWork(currentUser.uid, { ...w, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (workId: string) => {
    if (!currentUser) return;
    try {
      await deleteDailyWork(currentUser.uid, workId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting daily work:', err);
    }
  };

  const filteredWorks = works.filter(w => {
    const matchesSearch = w.workTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || w.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Daily Work & Job Services" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Header Action */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search work or customer..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-pink-600 shadow-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="px-3.5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-500/20 flex items-center space-x-1 shrink-0 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Work</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Pending', 'In Progress', 'Completed'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                filterStatus === st ? 'bg-pink-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Works List */}
        {filteredWorks.length > 0 ? (
          <div className="space-y-2.5">
            {filteredWorks.map((w) => (
              <div key={w.workId} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{w.workTitle}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        w.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        w.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Customer: {w.customerName} {w.mobile ? `(${w.mobile})` : ''}</p>
                    <p className="text-[10px] text-slate-400">{w.workDate}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-pink-700">₹{w.totalAmount}</p>
                    {w.remainingAmount > 0 ? (
                      <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                        Due: ₹{w.remainingAmount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        Paid In Full
                      </span>
                    )}
                  </div>
                </div>

                {w.description && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl">{w.description}</p>}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex space-x-1">
                    {w.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(w, 'Completed')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button onClick={() => openEditModal(w)} className="text-slate-500 hover:text-pink-600 font-semibold">Edit</button>
                    <button onClick={() => setDeleteConfirmId(w.workId)} className="text-slate-400 hover:text-rose-600 font-semibold">Delete</button>
                  </div>
                </div>

                {deleteConfirmId === w.workId && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-rose-800">Are you sure you want to delete this job record?</p>
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-white text-slate-600 rounded-lg">Cancel</button>
                      <button onClick={() => handleDelete(w.workId)} className="px-3 py-1 bg-rose-600 text-white rounded-lg">Yes, Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No daily work or job service records found</p>
            <button onClick={openAddModal} className="px-4 py-2 bg-pink-600 text-white font-bold text-xs rounded-xl">
              + Add New Work
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingWork ? 'Edit Work' : 'Add New Work'}</h3>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work / Service Title *</label>
                <input
                  type="text"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="e.g. Mobile Repairing / Plumbing Work"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10 digits"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advance (₹)</label>
                  <input
                    type="number"
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed job description..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Work</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
