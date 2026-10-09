import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribePurchases, subscribeProducts, createPurchaseTransaction, deletePurchase } from '../services/firestoreService';
import { Purchase, Product, PurchaseItem } from '../types';

interface PurchasesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Purchases({ onBack, onNavigate }: PurchasesProps) {
  const { currentUser } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [paidAmount, setPaidAmount] = useState('0');
  const [note, setNote] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsubPurch = subscribePurchases(currentUser.uid, setPurchases);
    const unsubProd = subscribeProducts(currentUser.uid, setProducts);
    return () => {
      unsubPurch();
      unsubProd();
    };
  }, [currentUser]);

  const openAddModal = () => {
    setSupplierName('');
    setItems([]);
    setSelectedProductId('');
    setCustomItemName('');
    setCustomPrice('');
    setCustomQty('1');
    setPaidAmount('0');
    setNote('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const handleAddProductItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.productId === selectedProductId);
    if (!prod) return;

    const newItem: PurchaseItem = {
      productId: prod.productId,
      productName: prod.name,
      quantity: 1,
      unitPrice: prod.purchasePrice || 0,
      totalPrice: prod.purchasePrice || 0
    };
    setItems([...items, newItem]);
    setSelectedProductId('');
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customPrice) return;
    const price = parseFloat(customPrice) || 0;
    const qty = parseFloat(customQty) || 1;
    const newItem: PurchaseItem = {
      productName: customItemName.trim(),
      quantity: qty,
      unitPrice: price,
      totalPrice: price * qty
    };
    setItems([...items, newItem]);
    setCustomItemName('');
    setCustomPrice('');
    setCustomQty('1');
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((acc, i) => acc + i.totalPrice, 0);
  const paidVal = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, totalAmount - paidVal);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!supplierName.trim()) {
      setError('Please enter supplier name');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const purchaseId = `purch_${Date.now()}`;
      const newPurchase: Purchase = {
        purchaseId,
        supplierName: supplierName.trim(),
        items,
        totalAmount,
        paidAmount: paidVal,
        dueAmount,
        note: note.trim(),
        purchaseDate,
        createdAt: new Date().toISOString()
      };

      await createPurchaseTransaction(currentUser.uid, newPurchase);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving purchase:', err);
      setError('Failed to save purchase entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (purchaseId: string) => {
    if (!currentUser) return;
    try {
      await deletePurchase(currentUser.uid, purchaseId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting purchase:', err);
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Purchase Account" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Search & Add Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier name..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-600 shadow-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 flex items-center space-x-1 shrink-0 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Purchase</span>
          </button>
        </div>

        {/* Purchase List */}
        {filteredPurchases.length > 0 ? (
          <div className="space-y-3">
            {filteredPurchases.map((p) => (
              <div key={p.purchaseId} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.supplierName}</h3>
                    <p className="text-[11px] text-slate-400">{p.purchaseDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-rose-700">₹{p.totalAmount.toLocaleString('en-IN')}</p>
                    {p.dueAmount > 0 && <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">Due: ₹{p.dueAmount}</span>}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs">
                  {p.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>{it.productName} × {it.quantity}</span>
                      <span className="font-semibold text-slate-800">₹{it.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button onClick={() => setDeleteConfirmId(p.purchaseId)} className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center space-x-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {deleteConfirmId === p.purchaseId && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-rose-800">Are you sure you want to delete this purchase entry?</p>
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-white text-slate-600 rounded-lg">Cancel</button>
                      <button onClick={() => handleDelete(p.purchaseId)} className="px-3 py-1 bg-rose-600 text-white rounded-lg">Yes, Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No purchase records found</p>
            <button onClick={openAddModal} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl">
              + Add Purchase
            </button>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full space-y-4 shadow-2xl my-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-bold text-slate-900">Add New Purchase</h3>
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

            <form onSubmit={handleSavePurchase} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Wholesale Traders"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-600"
                  required
                />
              </div>

              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-800">Add Items</label>
                
                {products.length > 0 && (
                  <div className="flex space-x-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.productId} value={p.productId}>{p.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAddProductItem} className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl">
                      + Add
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Item Name"
                    className="col-span-5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Rate ₹"
                    className="col-span-3 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    placeholder="Qty"
                    className="col-span-2 px-1.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-center"
                  />
                  <button type="button" onClick={handleAddCustomItem} className="col-span-2 bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center justify-center">
                    +
                  </button>
                </div>

                {items.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-800">{it.productName} ({it.quantity} × ₹{it.unitPrice})</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">₹{it.totalPrice}</span>
                          <button type="button" onClick={() => removeItem(idx)} className="text-rose-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-rose-50/60 p-3 rounded-2xl border border-rose-100 text-xs">
                <div className="flex justify-between text-sm font-extrabold text-rose-900">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Purchase</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
