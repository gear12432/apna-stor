import React, { useState, useEffect } from 'react';
import { Receipt, Search, Plus, Trash2, X, AlertCircle, Loader2, Tag } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribeExpenses, saveExpense, deleteExpense } from '../services/firestoreService';
import { Expense } from '../types';

interface ExpensesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Expenses({ onBack, onNavigate }: ExpensesProps) {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Others');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories: string[] = [
    'Shop Rent',
    'Electricity',
    'Transport',
    'Salary',
    'Goods / Material',
    'Food / Refreshment',
    'Others'
  ];

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeExpenses(currentUser.uid, setExpenses);
    return () => unsub();
  }, [currentUser]);

  const openAddModal = () => {
    setTitle('');
    setAmount('');
    setCategory('Others');
    setNote('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) {
      setError('Please enter expense title');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter valid amount');
      return;
    }

    setLoading(true);
    try {
      const expenseId = `exp_${Date.now()}`;
      const newExpense: Expense = {
        expenseId,
        category: category as any,
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        note: note.trim(),
        expenseDate,
        createdAt: new Date().toISOString()
      };

      await saveExpense(currentUser.uid, newExpense);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving expense:', err);
      setError('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!currentUser) return;
    try {
      await deleteExpense(currentUser.uid, expenseId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Expense Account" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Expense Summary Box */}
        <div className="bg-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-100">Total Expense Recorded</span>
            <p className="text-xl font-extrabold mt-0.5">₹{totalExpenseAmount.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-white text-emerald-700 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Expense</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCategory === 'All' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expense title..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 shadow-sm"
          />
        </div>

        {/* Expense List */}
        {filteredExpenses.length > 0 ? (
          <div className="space-y-2.5">
            {filteredExpenses.map((e) => (
              <div key={e.expenseId} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{e.title}</h3>
                      <p className="text-[11px] text-slate-400">{e.category} • {e.expenseDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-700">₹{e.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {e.note && <p className="text-[11px] text-slate-500 italic pl-12">Note: {e.note}</p>}

                <div className="flex justify-end pt-1 border-t border-slate-100">
                  <button onClick={() => setDeleteConfirmId(e.expenseId)} className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center space-x-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {deleteConfirmId === e.expenseId && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-rose-800">Are you sure you want to delete this expense?</p>
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-white text-slate-600 rounded-lg font-semibold">Cancel</button>
                      <button onClick={() => handleDelete(e.expenseId)} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold">Yes, Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No expense records found</p>
            <button onClick={openAddModal} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
              + Add Expense
            </button>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Expense</h3>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electricity Bill"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note / Remarks</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Additional remarks..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Expense</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
