import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribeProducts, saveProduct, deleteProduct, updateProductStock } from '../services/firestoreService';
import { Product } from '../types';

interface ProductsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Products({ onBack, onNavigate }: ProductsProps) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('5');
  const [unit, setUnit] = useState('Pcs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeProducts(currentUser.uid, setProducts);
    return () => unsub();
  }, [currentUser]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPurchasePrice('');
    setSalePrice('');
    setStockQuantity('0');
    setLowStockLimit('5');
    setUnit('Pcs');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || '');
    setPurchasePrice(String(p.purchasePrice || 0));
    setSalePrice(String(p.salePrice || 0));
    setStockQuantity(String(p.stockQuantity || 0));
    setLowStockLimit(String(p.lowStockLimit || 5));
    setUnit(p.unit || 'Pcs');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      setError('Please enter product name');
      return;
    }

    setLoading(true);
    try {
      const productId = editingProduct ? editingProduct.productId : `prod_${Date.now()}`;
      const newProduct: Product = {
        productId,
        name: name.trim(),
        sku: sku.trim(),
        purchasePrice: parseFloat(purchasePrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        stockQuantity: parseFloat(stockQuantity) || 0,
        lowStockLimit: parseFloat(lowStockLimit) || 5,
        unit: unit.trim() || 'Pcs',
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveProduct(currentUser.uid, newProduct);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (productId: string, change: number) => {
    if (!currentUser) return;
    try {
      await updateProductStock(currentUser.uid, productId, change);
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!currentUser) return;
    try {
      await deleteProduct(currentUser.uid, productId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const lowStockCount = products.filter(p => p.stockQuantity <= (p.lowStockLimit || 5)).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Stock / Inventory" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Low stock alert banner */}
        {lowStockCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">{lowStockCount} items are low on stock!</span>
            </div>
          </div>
        )}

        {/* Search & Add Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center space-x-1 shrink-0 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Product</span>
          </button>
        </div>

        {/* Product List */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-2.5">
            {filteredProducts.map((p) => {
              const isLowStock = p.stockQuantity <= (p.lowStockLimit || 5);
              return (
                <div key={p.productId} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                        {isLowStock && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Low Stock</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Sale Price: <span className="font-bold text-slate-800">₹{p.salePrice}</span>
                        {p.purchasePrice > 0 && <span className="text-slate-400 ml-2">(Cost: ₹{p.purchasePrice})</span>}
                      </p>
                      {p.sku && <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">Stock Qty</p>
                      <p className={`text-base font-extrabold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                        {p.stockQuantity} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stock Adjustments & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-500">Adjust Stock:</span>
                      <button
                        onClick={() => handleAdjustStock(p.productId, -1)}
                        className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold flex items-center space-x-1"
                        title="Reduce Stock"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>-1</span>
                      </button>
                      <button
                        onClick={() => handleAdjustStock(p.productId, 1)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold flex items-center space-x-1"
                        title="Add Stock"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+1</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(p.productId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation Box */}
                  {deleteConfirmId === p.productId && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                      <p className="font-bold text-rose-800">Are you sure you want to delete this product?</p>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(p.productId)}
                          className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold"
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No products found</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20"
            >
              + Add Product
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sugar 1kg"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Packet">Packet</option>
                    <option value="Box">Box</option>
                    <option value="Meter">Meter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    value={lowStockLimit}
                    onChange={(e) => setLowStockLimit(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Barcode</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. PROD-101"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                  className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center space-x-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Product</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
