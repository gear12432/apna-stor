import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Plus, Trash2, X, AlertCircle, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribePayments, subscribeCustomers, createPaymentTransaction, deletePayment } from '../services/firestoreService';
import { Payment, Customer } from '../types';

interface PaymentsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Payments({ onBack, onNavigate }: PaymentsProps) {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState<'receivable' | 'payable'>('receivable');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Other'>('Cash');
  const [note, setNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsubPay = subscribePayments(currentUser.uid, setPayments);
    const unsubCust = subscribeCustomers(currentUser.uid, setCustomers);
    return () => {
      unsubPay();
      unsubCust();
    };
  }, [currentUser]);

  const openAddModal = (defaultType: 'receivable' | 'payable' = 'receivable') => {
    setSelectedCustomerId('');
    setCustomerName('');
    setType(defaultType);
    setAmount('');
    setPaymentMethod('Cash');
    setNote('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customers.find(c => c.customerId === custId);
    if (found) setCustomerName(found.name);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter valid amount');
      return;
    }

    setLoading(true);
    try {
      const paymentId = `pay_${Date.now()}`;
      const newPayment: Payment = {
        paymentId,
        customerId: selectedCustomerId,
        customerName: customerName.trim(),
        type,
        amount: parseFloat(amount) || 0,
        paymentMethod,
        note: note.trim(),
        paymentDate,
        createdAt: new Date().toISOString()
      };

      await createPaymentTransaction(currentUser.uid, newPayment);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving payment:', err);
      setError('Failed to save payment record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!currentUser) return;
    try {
      await deletePayment(currentUser.uid, paymentId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Payments (In & Out)" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Quick Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openAddModal('receivable')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-3.5 flex items-center justify-center space-x-2 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>+ Payment Received (In)</span>
          </button>
          <button
            onClick={() => openAddModal('payable')}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-3.5 flex items-center justify-center space-x-2 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>- Payment Made (Out)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
        </div>

        {/* Payment History List */}
        {filteredPayments.length > 0 ? (
          <div className="space-y-2.5">
            {filteredPayments.map((p) => {
              const isReceivable = p.type === 'receivable';
              return (
                <div key={p.paymentId} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isReceivable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isReceivable ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{p.customerName}</h3>
                        <p className="text-[11px] text-slate-400">
                          {isReceivable ? 'Received (In)' : 'Paid (Out)'} • {p.paymentMethod} • {p.paymentDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${isReceivable ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isReceivable ? '+' : '-'}₹{p.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {p.note && <p className="text-[11px] text-slate-500 italic pl-12">Note: {p.note}</p>}

                  <div className="flex justify-end pt-1 border-t border-slate-100">
                    <button onClick={() => setDeleteConfirmId(p.paymentId)} className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center space-x-1">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {deleteConfirmId === p.paymentId && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                      <p className="font-bold text-rose-800">Are you sure you want to delete this payment record?</p>
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-white text-slate-600 rounded-lg font-semibold">Cancel</button>
                        <button onClick={() => handleDelete(p.paymentId)} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold">Yes, Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <ArrowLeftRight className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No payment records found</p>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {type === 'receivable' ? 'Payment Received (In)' : 'Payment Made (Out)'}
              </h3>
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('receivable')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      type === 'receivable' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Received (In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('payable')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      type === 'payable' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Paid (Out)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer or Enter Name *</label>
                {customers.length > 0 ? (
                  <select
                    value={selectedCustomerId}
                    onChange={handleCustomerSelect}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-1.5 focus:ring-2"
                  >
                    <option value="">-- Select from list --</option>
                    {customers.map(c => (
                      <option key={c.customerId} value={c.customerId}>{c.name}</option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2"
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
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Remarks..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Payment</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
