import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ShoppingCart, 
  ShoppingBag, 
  Receipt, 
  ArrowLeftRight, 
  Users, 
  Package, 
  Briefcase, 
  BarChart3, 
  AlertTriangle, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  PlusCircle,
  Bell,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeCustomers, 
  subscribeProducts, 
  subscribeSales, 
  subscribePurchases, 
  subscribeExpenses, 
  subscribePayments, 
  subscribeDailyWork, 
  subscribeReminders 
} from '../services/firestoreService';
import { Customer, Product, Sale, Purchase, Expense, Payment, DailyWork, Reminder, ActivityLog } from '../types';

interface HomeProps {
  onNavigate: (screen: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { currentUser, userProfile } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dailyWorks, setDailyWorks] = useState<DailyWork[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Real-time Firestore subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const unsubCust = subscribeCustomers(currentUser.uid, setCustomers, () => {});
    const unsubProd = subscribeProducts(currentUser.uid, setProducts, () => {});
    const unsubSale = subscribeSales(currentUser.uid, setSales, () => {});
    const unsubPurch = subscribePurchases(currentUser.uid, setPurchases, () => {});
    const unsubExp = subscribeExpenses(currentUser.uid, setExpenses, () => {});
    const unsubPay = subscribePayments(currentUser.uid, setPayments, () => {});
    const unsubWork = subscribeDailyWork(currentUser.uid, setDailyWorks, () => {});
    const unsubRem = subscribeReminders(currentUser.uid, setReminders, () => {});

    return () => {
      unsubCust();
      unsubProd();
      unsubSale();
      unsubPurch();
      unsubExp();
      unsubPay();
      unsubWork();
      unsubRem();
    };
  }, [currentUser]);

  // Format today's date in English
  const getFormattedDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      weekday: 'long' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Compile Alerts
  const alerts = [];
  
  // Low Stock Alerts
  const lowStockProducts = products.filter(p => p.stockQuantity <= (p.lowStockLimit || 5));
  if (lowStockProducts.length > 0) {
    alerts.push({
      id: 'low-stock',
      title: `${lowStockProducts.length} items low on stock`,
      desc: lowStockProducts.slice(0, 2).map(p => p.name).join(', ') + (lowStockProducts.length > 2 ? '...' : ''),
      type: 'warning',
      screen: 'products'
    });
  }

  // Pending Reminders
  const pendingReminders = reminders.filter(r => r.status === 'Pending');
  if (pendingReminders.length > 0) {
    alerts.push({
      id: 'reminders',
      title: `${pendingReminders.length} pending reminders`,
      desc: pendingReminders[0]?.title || '',
      type: 'info',
      screen: 'reminders'
    });
  }

  // Customers with Due Payments
  const dueCustomers = customers.filter(c => c.totalReceivable > 0);
  if (dueCustomers.length > 0) {
    const totalDue = dueCustomers.reduce((acc, c) => acc + c.totalReceivable, 0);
    alerts.push({
      id: 'due-payments',
      title: `${dueCustomers.length} customers have due payment of ₹${totalDue.toLocaleString('en-IN')}`,
      desc: `Main: ${dueCustomers[0]?.name}`,
      type: 'due',
      screen: 'customers'
    });
  }

  // Pending Daily Works
  const pendingWork = dailyWorks.filter(w => w.status === 'Pending' || w.status === 'In Progress');
  if (pendingWork.length > 0) {
    alerts.push({
      id: 'daily-work',
      title: `${pendingWork.length} service jobs pending`,
      desc: pendingWork[0]?.workTitle || '',
      type: 'work',
      screen: 'daily-work'
    });
  }

  // Compile Recent Activities
  const recentActivities: ActivityLog[] = [];

  sales.slice(0, 5).forEach(s => {
    recentActivities.push({
      id: `sale-${s.saleId}`,
      title: `Sale - ${s.customerName}`,
      subtitle: `${s.paymentMethod} ${s.dueAmount > 0 ? `(Due: ₹${s.dueAmount})` : ''}`,
      amount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sale',
      timestamp: s.createdAt
    });
  });

  expenses.slice(0, 5).forEach(e => {
    recentActivities.push({
      id: `exp-${e.expenseId}`,
      title: `Expense - ${e.title}`,
      subtitle: e.category,
      amount: e.amount,
      time: new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'expense',
      timestamp: e.createdAt
    });
  });

  payments.slice(0, 5).forEach(p => {
    recentActivities.push({
      id: `pay-${p.paymentId}`,
      title: `${p.type === 'receivable' ? 'Payment In' : 'Payment Out'} - ${p.customerName}`,
      subtitle: p.paymentMethod,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      time: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'payment',
      timestamp: p.createdAt
    });
  });

  purchases.slice(0, 5).forEach(p => {
    recentActivities.push({
      id: `purch-${p.purchaseId}`,
      title: `Purchase - ${p.supplierName}`,
      subtitle: `Supplier`,
      amount: p.totalAmount,
      time: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'purchase',
      timestamp: p.createdAt
    });
  });

  // Sort activities newest first
  recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const displayActivities = recentActivities.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-10">
      {/* 1. HOME HEADER */}
      <Header 
        title={userProfile?.businessName || "My Hisab"} 
        subtitle="Your Trusted Business Partner" 
        onNavigate={onNavigate}
        unreadAlertCount={alerts.length}
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* 2. DATE CARD */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TODAY'S ACCOUNT</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{getFormattedDate()}</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('reports')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition"
          >
            Today
          </button>
        </div>

        {/* 3. QUICK ACTION GRID (8 Colorful Cards) */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Card 1: Sale */}
          <button
            onClick={() => onNavigate('sales')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-blue-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <ShoppingCart className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Sale</span>
          </button>

          {/* Card 2: Purchase */}
          <button
            onClick={() => onNavigate('purchases')}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-rose-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <ShoppingBag className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Purchase</span>
          </button>

          {/* Card 3: Expense */}
          <button
            onClick={() => onNavigate('expenses')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-emerald-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <Receipt className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Expense</span>
          </button>

          {/* Card 4: Payment */}
          <button
            onClick={() => onNavigate('payments')}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-amber-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <ArrowLeftRight className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Payment</span>
          </button>

          {/* Card 5: Customer */}
          <button
            onClick={() => onNavigate('customers')}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-purple-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <Users className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Customer</span>
          </button>

          {/* Card 6: Stock */}
          <button
            onClick={() => onNavigate('products')}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-teal-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <Package className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Product</span>
          </button>

          {/* Card 7: Daily Work */}
          <button
            onClick={() => onNavigate('daily-work')}
            className="bg-pink-600 hover:bg-pink-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-pink-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <Briefcase className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Daily Work</span>
          </button>

          {/* Card 8: Report */}
          <button
            onClick={() => onNavigate('reports')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md shadow-indigo-500/20 active:scale-95 transition duration-150 aspect-square"
          >
            <BarChart3 className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Report</span>
          </button>
        </div>

        {/* 4. IMPORTANT ALERTS */}
        <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-amber-900">Important Alerts</h2>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate(alert.screen)}
                  className="bg-white rounded-xl p-3 border border-amber-200/50 flex items-center justify-between cursor-pointer hover:bg-amber-100/30 transition"
                >
                  <div className="pr-2">
                    <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                    {alert.desc && <p className="text-[11px] text-slate-500 mt-0.5">{alert.desc}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 rounded-xl p-3.5 text-center text-xs text-slate-600 flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">No important alerts right now</span>
            </div>
          )}
        </div>

        {/* 5. RECENT ACTIVITY */}
        <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {displayActivities.length > 0 ? (
            <div className="bg-white rounded-xl divide-y divide-slate-100 border border-slate-200/60 shadow-inner overflow-hidden">
              {displayActivities.map((act) => (
                <div key={act.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                      act.type === 'sale' ? 'bg-blue-600' :
                      act.type === 'purchase' ? 'bg-rose-500' :
                      act.type === 'expense' ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}>
                      {act.type === 'sale' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.title}</p>
                      <p className="text-[10px] text-slate-500">{act.subtitle} • {act.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${
                      act.type === 'sale' || (act.type === 'payment' && act.title.includes('Payment In')) 
                        ? 'text-emerald-600' 
                        : 'text-slate-800'
                    }`}>
                      ₹{act.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center text-xs text-slate-500 border border-slate-200/60">
              <p className="font-semibold text-slate-700">No activity recorded today</p>
              <p className="text-[11px] text-slate-400 mt-1">Use quick action buttons above to add entries</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
