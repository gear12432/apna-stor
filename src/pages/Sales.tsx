import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Check, 
  ShoppingCart, 
  AlertCircle, 
  Loader2, 
  History, 
  Camera, 
  User, 
  CheckCircle2, 
  ArrowLeft,
  ShoppingBag,
  Tag,
  CreditCard,
  FileText,
  DollarSign
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeSales, 
  subscribeCustomers, 
  subscribeProducts, 
  createSaleTransaction, 
  deleteSale,
  saveProduct
} from '../services/firestoreService';
import { Sale, Customer, Product, SaleItem } from '../types';

interface SalesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

// Default fallback product images
const DEFAULT_PRODUCT_IMAGES: { [key: string]: string } = {
  besan: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
  dal: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=120&auto=format&fit=crop&q=80",
  biscuit: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&auto=format&fit=crop&q=80",
  sugar: "https://images.unsplash.com/photo-1622484210800-88516571447a?w=120&auto=format&fit=crop&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=80"
};

export default function Sales({ onBack, onNavigate }: SalesProps) {
  const { currentUser } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Tab state: 'pos' (Sell Screen) vs 'history' (Past Sales)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Input states for Product ID and Product Name
  const [productIdInput, setProductIdInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');

  // Real-time lookup feedback state
  const [isCheckingProduct, setIsCheckingProduct] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);

  // Cart state: map of productId -> quantity
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Scanner modal state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');

  // Invoice Screen Modal state
  const [showInvoiceModal, setShowCheckoutModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('Cash Customer');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Other'>('Cash');
  const [paidAmount, setPaidAmount] = useState('0');
  const [note, setNote] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // History search and delete states
  const [historySearch, setHistorySearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Firestore Subscriptions
  useEffect(() => {
    if (!currentUser) return;
    const unsubSales = subscribeSales(currentUser.uid, setSales);
    const unsubCust = subscribeCustomers(currentUser.uid, setCustomers);
    const unsubProd = subscribeProducts(currentUser.uid, (prods) => {
      if (prods.length === 0) {
        seedDefaultProducts(currentUser.uid);
      } else {
        setProducts(prods);
      }
    });

    return () => {
      unsubSales();
      unsubCust();
      unsubProd();
    };
  }, [currentUser]);

  // Seed initial inventory if empty
  const seedDefaultProducts = async (uid: string) => {
    const defaults: Partial<Product>[] = [
      { productId: '1326', name: 'Classic Besan by Flipkart Grocery', sku: '1326', salePrice: 82, purchasePrice: 70, unit: '1 kg', stockQuantity: 50, lowStockLimit: 5 },
      { productId: '1327', name: 'Desi Choice Masoor Dal (Split)', sku: '1327', salePrice: 80, purchasePrice: 65, unit: '1 kg', stockQuantity: 40, lowStockLimit: 5 },
      { productId: '1328', name: 'Classic Chana Dal (Split) by Flipkart Grocery', sku: '1328', salePrice: 149, purchasePrice: 120, unit: '1 kg', stockQuantity: 30, lowStockLimit: 5 },
      { productId: '1329', name: 'Sunfeast Dark Fantasy Biscuit', sku: '1329', salePrice: 40, purchasePrice: 30, unit: '1 Pcs', stockQuantity: 100, lowStockLimit: 10 },
      { productId: '1330', name: 'Fortune Refined Sunflower Oil', sku: '1330', salePrice: 165, purchasePrice: 140, unit: '1 Ltr', stockQuantity: 25, lowStockLimit: 5 }
    ];

    for (const p of defaults) {
      const prod: Product = {
        productId: p.productId!,
        name: p.name!,
        sku: p.sku!,
        salePrice: p.salePrice!,
        purchasePrice: p.purchasePrice!,
        unit: p.unit!,
        stockQuantity: p.stockQuantity!,
        lowStockLimit: p.lowStockLimit!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveProduct(uid, prod).catch(() => {});
    }
  };

  // Real-time Product ID Lookup with Progress Spinner & Green Checkmark
  useEffect(() => {
    const query = productIdInput.trim().toLowerCase();
    if (!query) {
      setIsCheckingProduct(false);
      setMatchedProduct(null);
      return;
    }

    setIsCheckingProduct(true);
    setMatchedProduct(null);

    const timer = setTimeout(() => {
      const found = products.find(
        p => p.productId.toLowerCase() === query || (p.sku && p.sku.toLowerCase() === query)
      );
      setIsCheckingProduct(false);
      if (found) {
        setMatchedProduct(found);
        setProductNameInput(found.name);
      } else {
        setMatchedProduct(null);
      }
    }, 1500); // 1.5 seconds spinner feedback

    return () => clearTimeout(timer);
  }, [productIdInput, products]);

  // Handle Top OK Button click
  const handleOKSearch = () => {
    setError('');
    let targetProduct = matchedProduct;

    if (!targetProduct) {
      const idQuery = productIdInput.trim().toLowerCase();
      const nameQuery = productNameInput.trim().toLowerCase();
      targetProduct = products.find(p => {
        const matchId = idQuery && (p.productId.toLowerCase() === idQuery || (p.sku && p.sku.toLowerCase() === idQuery));
        const matchName = nameQuery && p.name.toLowerCase().includes(nameQuery);
        return matchId || matchName;
      }) || null;
    }

    if (targetProduct) {
      setCart(prev => ({
        ...prev,
        [targetProduct!.productId]: (prev[targetProduct!.productId] || 0) + 1
      }));
      // Reset input fields
      setProductIdInput('');
      setProductNameInput('');
      setMatchedProduct(null);
    } else {
      setError('No product found with this ID or Name');
    }
  };

  // Adjust Quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[productId];
      } else {
        updated[productId] = next;
      }
      return updated;
    });
  };

  // Filtered Products for List View
  const filteredProducts = products.filter(p => {
    const idMatch = !productIdInput.trim() || 
      p.productId.toLowerCase().includes(productIdInput.trim().toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(productIdInput.trim().toLowerCase()));

    const nameMatch = !productNameInput.trim() || 
      p.name.toLowerCase().includes(productNameInput.trim().toLowerCase());

    return idMatch && nameMatch;
  });

  // Calculate cart items
  const cartItemsList: SaleItem[] = Object.entries(cart).map(([prodId, qty]) => {
    const p = products.find(item => item.productId === prodId);
    return {
      productId: prodId,
      productName: p ? p.name : 'Unknown Product',
      quantity: qty,
      unitPrice: p ? p.salePrice : 0,
      totalPrice: (p ? p.salePrice : 0) * qty
    };
  });

  const cartSubtotal = cartItemsList.reduce((acc, item) => acc + item.totalPrice, 0);
  const cartTotalQty = Object.values(cart).reduce((acc, q) => acc + q, 0);

  // Open Invoice Modal when bottom OK button is clicked
  const handleOpenInvoiceScreen = () => {
    if (cartItemsList.length === 0) {
      setError('Please add at least one product (+ or OK) to create invoice');
      return;
    }
    setError('');
    setSelectedCustomerId('');
    setCustomerName('Cash Customer');
    setDiscount('0');
    setPaymentMethod('Cash');
    setPaidAmount(String(cartSubtotal));
    setNote('');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setShowCheckoutModal(true);
  };

  // Save Sale Transaction to Firebase Firestore
  const handleCompleteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (cartItemsList.length === 0) return;

    setLoading(true);
    try {
      const saleId = `sale_${Date.now()}`;
      const discVal = parseFloat(discount) || 0;
      const finalTotal = Math.max(0, cartSubtotal - discVal);
      const paidVal = parseFloat(paidAmount) || 0;
      const dueVal = Math.max(0, finalTotal - paidVal);

      const newSale: Sale = {
        saleId,
        customerId: selectedCustomerId || '',
        customerName: customerName || 'Cash Customer',
        items: cartItemsList,
        subtotal: cartSubtotal,
        discount: discVal,
        totalAmount: finalTotal,
        paymentMethod,
        paidAmount: paidVal,
        dueAmount: dueVal,
        note: note.trim(),
        saleDate,
        createdAt: new Date().toISOString()
      };

      await createSaleTransaction(currentUser.uid, newSale);

      // Clear cart
      setCart({});
      setProductIdInput('');
      setProductNameInput('');
      setShowCheckoutModal(false);
      
      setSuccessToast('Sale completed successfully!');
      setTimeout(() => setSuccessToast(''), 3000);
      
      setActiveTab('history');
    } catch (err) {
      console.error('Error recording sale:', err);
      setError('Failed to save sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (saleId: string) => {
    if (!currentUser) return;
    try {
      await deleteSale(currentUser.uid, saleId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting sale history:', err);
    }
  };

  // Product Image Helper
  const getProductImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('besan')) return DEFAULT_PRODUCT_IMAGES.besan;
    if (lower.includes('dal') || lower.includes('masoor')) return DEFAULT_PRODUCT_IMAGES.dal;
    if (lower.includes('biscuit')) return DEFAULT_PRODUCT_IMAGES.biscuit;
    if (lower.includes('sugar') || lower.includes('sugar')) return DEFAULT_PRODUCT_IMAGES.sugar;
    if (lower.includes('oil')) return DEFAULT_PRODUCT_IMAGES.oil;
    return DEFAULT_PRODUCT_IMAGES.default;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      {/* App Header */}
      <Header title="Sales Account" subtitle="Your Trusted Business Partner" showBack onBack={onBack} onNavigate={onNavigate} />

      {/* Mode Switcher Tabs */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white px-3 py-2 flex items-center justify-between border-b border-purple-800/50 shadow-md">
        <div className="flex items-center space-x-1.5 bg-white/10 p-1 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'pos' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-200 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Sell Screen</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-200 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in">
          {successToast}
        </div>
      )}

      {activeTab === 'pos' ? (
        <main className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          {/* ========================================================= */}
          {/* TOP INPUT ROW MATCHING SCREENSHOT WITH PRODUCT ID CHECKING */}
          {/* ========================================================= */}
          <div className="bg-white p-3 border-b border-slate-200 shadow-sm sticky top-14 z-20">
            <div className="flex items-center space-x-2">
              {/* Product ID Input Box with Spinner & Green Checkmark */}
              <div className="relative w-32 shrink-0">
                <input
                  type="text"
                  value={productIdInput}
                  onChange={(e) => setProductIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOKSearch()}
                  placeholder="1326"
                  className={`w-full pl-3 pr-8 py-2 text-slate-800 bg-white border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-inner transition ${
                    matchedProduct ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-300'
                  }`}
                />
                <div className="absolute right-2 top-2.5 flex items-center pointer-events-none">
                  {isCheckingProduct && (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  )}
                  {!isCheckingProduct && matchedProduct && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                  )}
                </div>
              </div>

              {/* Product Name Input Box */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={productNameInput}
                  onChange={(e) => setProductNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOKSearch()}
                  placeholder="biscuit"
                  className="w-full px-3 py-2 text-slate-800 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-inner"
                />
              </div>

              {/* Scanner Icon Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="p-2 text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition active:scale-95 shrink-0"
                title="Barcode / QR Scanner"
              >
                <QrCode className="w-6 h-6 text-slate-900" />
              </button>

              {/* Top OK Button */}
              <button
                onClick={handleOKSearch}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white font-black text-sm rounded-lg shadow-md transition active:scale-95 shrink-0"
              >
                OK
              </button>
            </div>

            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PRODUCT LIST VIEW */}
          {/* ========================================================= */}
          <div className="flex-1 bg-white divide-y divide-slate-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const qtyInCart = cart[p.productId] || 0;
                const mrpPrice = Math.round(p.salePrice * 1.8);

                return (
                  <div key={p.productId} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition">
                    {/* Left: Product Thumbnail + Title + Weight + Price */}
                    <div className="flex items-center space-x-3.5 pr-2 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                        <img
                          src={getProductImage(p.name)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <ShoppingBag className="w-6 h-6 text-slate-300 absolute pointer-events-none" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {p.unit || '1 kg'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-extrabold text-slate-900">
                            ₹{p.salePrice}
                          </span>
                          <span className="text-xs text-slate-400 line-through font-medium">
                            ₹{mrpPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantity Controls (- [qty] +) */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(p.productId, -1)}
                        className={`w-7 h-7 rounded-md font-bold text-white flex items-center justify-center shadow-xs transition active:scale-95 ${
                          qtyInCart > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
                        }`}
                        disabled={qtyInCart === 0}
                      >
                        <Minus className="w-4 h-4 stroke-[3]" />
                      </button>

                      <span className="w-6 text-center font-bold text-slate-800 text-sm">
                        {qtyInCart}
                      </span>

                      <button
                        onClick={() => updateQuantity(p.productId, 1)}
                        className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 font-bold text-white flex items-center justify-center shadow-xs transition active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <p className="text-sm font-bold text-slate-700">No Products Found</p>
                <p className="text-xs text-slate-400">Type product ID or name above to search</p>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM FLOATING ACTION BAR WITH "OK" BUTTON */}
          {/* ========================================================= */}
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-200 p-3 shadow-2xl z-30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-purple-900 text-white flex items-center justify-center shadow-md">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                {cartTotalQty > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartTotalQty}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                <p className="text-lg font-black text-slate-900 leading-none">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Bottom OK Button requested in screenshot */}
            <button
              onClick={handleOpenInvoiceScreen}
              disabled={cartTotalQty === 0}
              className="px-6 py-3 bg-purple-900 hover:bg-purple-950 disabled:bg-slate-300 text-white font-extrabold text-sm rounded-2xl shadow-lg transition active:scale-95 flex items-center space-x-2"
            >
              <span>OK</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </main>
      ) : (
        /* ========================================================= */
        /* SALES HISTORY VIEW */
        /* ========================================================= */
        <main className="flex-1 p-4 space-y-3 max-w-lg mx-auto w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search customer or invoice..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-600 shadow-sm"
            />
          </div>

          {sales.filter(s => s.customerName.toLowerCase().includes(historySearch.toLowerCase())).length > 0 ? (
            <div className="space-y-3">
              {sales
                .filter(s => s.customerName.toLowerCase().includes(historySearch.toLowerCase()))
                .map((s) => (
                  <div key={s.saleId} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{s.customerName}</h3>
                        <p className="text-[11px] text-slate-400">{s.saleDate} • {s.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-purple-900">₹{s.totalAmount.toLocaleString('en-IN')}</p>
                        {s.dueAmount > 0 ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                            Due: ₹{s.dueAmount}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                            Paid In Full
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Table Summary in History */}
                    <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs">
                      {s.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600">
                          <span>{it.productName} × {it.quantity}</span>
                          <span className="font-semibold text-slate-800">₹{it.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setDeleteConfirmId(s.saleId)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {deleteConfirmId === s.saleId && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                        <p className="font-bold text-rose-800">Are you sure you want to delete this sale record?</p>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(s.saleId)}
                            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Sales History</p>
            </div>
          )}
        </main>
      )}

      {/* BARCODE SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-purple-700" />
                <span>Barcode Scanner</span>
              </h3>
              <button onClick={() => setShowScanner(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-44 bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden text-white border-2 border-dashed border-purple-500">
              <QrCode className="w-16 h-16 text-purple-400 animate-pulse" />
              <div className="absolute inset-x-0 h-0.5 bg-purple-500 shadow-lg shadow-purple-500 animate-bounce" />
              <p className="text-xs text-slate-300 mt-2 font-medium">Scan Barcode / QR Code</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Or type barcode to simulate scan:</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  placeholder="e.g. 1326"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
                <button
                  onClick={() => {
                    setProductIdInput(scannedCode || '1326');
                    setShowScanner(false);
                    setScannedCode('');
                  }}
                  className="px-4 py-2 bg-purple-900 text-white text-xs font-bold rounded-xl"
                >
                  Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL TABLE-FORMATTED INVOICE SCREEN MODAL WITH "SELL" BUTTON */}
      {/* ========================================================= */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl my-auto animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-900" />
                <h3 className="text-base font-extrabold text-slate-900">INVOICE SUMMARY</h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSale} className="space-y-4">
              {/* Customer Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const custId = e.target.value;
                    setSelectedCustomerId(custId);
                    if (!custId) setCustomerName('Cash Customer');
                    else {
                      const found = customers.find(c => c.customerId === custId);
                      if (found) setCustomerName(found.name);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">-- Cash Customer --</option>
                  {customers.map(c => (
                    <option key={c.customerId} value={c.customerId}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* INVOICE PRODUCT TABLE */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-950 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {cartItemsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">{item.productName}</td>
                        <td className="p-2.5 text-center font-extrabold text-purple-900 bg-purple-50/50">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">₹{item.unitPrice}</td>
                        <td className="p-2.5 text-right font-black text-slate-900">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Box */}
              <div className="space-y-2 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Subtotal:</span>
                  <span>₹{cartSubtotal}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Discount (₹):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-right font-bold text-slate-800"
                  />
                </div>

                <div className="flex justify-between text-base font-black text-purple-950 pt-1 border-t border-purple-200">
                  <span>Grand Total:</span>
                  <span>₹{Math.max(0, cartSubtotal - (parseFloat(discount) || 0))}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Paid Amount (₹)</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-3 bg-purple-900 hover:bg-purple-950 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition active:scale-98 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving Sale...</span>
                    </>
                  ) : (
                    <>
                      <span>SELL</span>
                      <Check className="w-5 h-5 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
