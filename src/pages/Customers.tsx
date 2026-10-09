import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomers, saveCustomer, deleteCustomer } from '../services/firestoreService';
import { Customer } from '../types';

interface CustomersProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Customers({ onBack, onNavigate }: CustomersProps) {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [initialReceivable, setInitialReceivable] = useState('');
  const [initialPayable, setInitialPayable] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeCustomers(currentUser.uid, setCustomers);
    return () => unsub();
  }, [currentUser]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setMobile('');
    setAddress('');
    setNotes('');
    setInitialReceivable('0');
    setInitialPayable('0');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setMobile(cust.mobile || '');
    setAddress(cust.address || '');
    setNotes(cust.notes || '');
    setInitialReceivable(String(cust.totalReceivable || 0));
    setInitialPayable(String(cust.totalPayable || 0));
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      setError('Please enter customer name');
      return;
    }

    setLoading(true);
    try {
      const customerId = editingCustomer ? editingCustomer.customerId : `cust_${Date.now()}`;
      const newCustomer: Customer = {
        customerId,
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        notes: notes.trim(),
        totalReceivable: parseFloat(initialReceivable) || 0,
        totalPayable: parseFloat(initialPayable) || 0,
        createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveCustomer(currentUser.uid, newCustomer);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!currentUser) return;
    try {
      await deleteCustomer(currentUser.uid, customerId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.mobile && c.mobile.includes(searchQuery))
  );

  const totalReceivableAll = customers.reduce((acc, c) => acc + (c.totalReceivable || 0), 0);
  const totalPayableAll = customers.reduce((acc, c) => acc + (c.totalPayable || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Customer Account" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Balance Overview Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-700">Total Receivable</span>
            <p className="text-lg font-extrabold text-emerald-800 mt-1">₹{totalReceivableAll.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-rose-700">Total Payable</span>
            <p className="text-lg font-extrabold text-rose-800 mt-1">₹{totalPayableAll.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Search & Add Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 flex items-center space-x-1 shrink-0 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Customer</span>
          </button>
        </div>

        {/* Customer List */}
        {filteredCustomers.length > 0 ? (
          <div className="space-y-2.5">
            {filteredCustomers.map((c) => (
              <div key={c.customerId} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                    {c.mobile && <p className="text-xs text-slate-500 font-medium mt-0.5">{c.mobile}</p>}
                    {c.address && <p className="text-[11px] text-slate-400 mt-0.5">{c.address}</p>}
                  </div>

                  <div className="text-right">
                    {c.totalReceivable > 0 && (
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold rounded-lg">
                        Receivable: ₹{c.totalReceivable.toLocaleString('en-IN')}
                      </span>
                    )}
                    {c.totalPayable > 0 && (
                      <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold rounded-lg mt-1">
                        Payable: ₹{c.totalPayable.toLocaleString('en-IN')}
                      </span>
                    )}
                    {c.totalReceivable === 0 && c.totalPayable === 0 && (
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg">
                        Balanced (₹0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-2">
                    {c.mobile && (
                      <>
                        <a
                          href={`tel:${c.mobile}`}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold flex items-center space-x-1 hover:bg-blue-100"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/91${c.mobile.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold flex items-center space-x-1 hover:bg-emerald-100"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(c.customerId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Box */}
                {deleteConfirmId === c.customerId && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-rose-800">Are you sure you want to delete this customer?</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(c.customerId)}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No customers found</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20"
            >
              + Add Customer
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amit Sharma"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit phone number"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / City / Landmark"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Old Receivable (₹)</label>
                  <input
                    type="number"
                    value={initialReceivable}
                    onChange={(e) => setInitialReceivable(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Old Payable (₹)</label>
                  <input
                    type="number"
                    value={initialPayable}
                    onChange={(e) => setInitialPayable(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional remarks..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 flex items-center space-x-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Customer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
