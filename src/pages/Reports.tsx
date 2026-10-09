import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ArrowDownLeft, Receipt, ShoppingCart, ShoppingBag } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { subscribeSales, subscribePurchases, subscribeExpenses, subscribePayments } from '../services/firestoreService';
import { Sale, Purchase, Expense, Payment } from '../types';

interface ReportsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function Reports({ onBack, onNavigate }: ReportsProps) {
  const { currentUser } = useAuth();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubSale = subscribeSales(currentUser.uid, setSales);
    const unsubPurch = subscribePurchases(currentUser.uid, setPurchases);
    const unsubExp = subscribeExpenses(currentUser.uid, setExpenses);
    const unsubPay = subscribePayments(currentUser.uid, setPayments);
    return () => {
      unsubSale();
      unsubPurch();
      unsubExp();
      unsubPay();
    };
  }, [currentUser]);

  // Date filtering logic
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    itemDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeFilter === 'today') {
      return itemDate.getTime() === today.getTime();
    }
    if (timeFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return itemDate >= weekAgo && itemDate <= today;
    }
    if (timeFilter === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return itemDate >= monthStart && itemDate <= today;
    }
    if (timeFilter === 'custom') {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }
    return true;
  };

  const filteredSales = sales.filter(s => isDateInRange(s.saleDate || s.createdAt));
  const filteredPurchases = purchases.filter(p => isDateInRange(p.purchaseDate || p.createdAt));
  const filteredExpenses = expenses.filter(e => isDateInRange(e.expenseDate || e.createdAt));
  const filteredPayments = payments.filter(p => isDateInRange(p.paymentDate || p.createdAt));

  // Calculations
  const totalSales = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  const totalReceived = filteredSales.reduce((acc, s) => acc + s.paidAmount, 0) + 
                        filteredPayments.filter(p => p.type === 'receivable').reduce((acc, p) => acc + p.amount, 0);

  const totalDue = filteredSales.reduce((acc, s) => acc + s.dueAmount, 0);

  // Profit = Sales Total - Purchase Cost - Expenses
  const estimatedProfit = totalSales - totalPurchases - totalExpenses;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Business Reports" showBack onBack={onBack} onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Filter Pills */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="grid grid-cols-4 gap-1 w-full">
            <button
              onClick={() => setTimeFilter('today')}
              className={`py-1.5 text-xs font-bold rounded-xl transition ${
                timeFilter === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`py-1.5 text-xs font-bold rounded-xl transition ${
                timeFilter === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`py-1.5 text-xs font-bold rounded-xl transition ${
                timeFilter === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('custom')}
              className={`py-1.5 text-xs font-bold rounded-xl transition ${
                timeFilter === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {timeFilter === 'custom' && (
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Estimated Profit Banner */}
        <div className={`rounded-3xl p-5 text-white shadow-xl ${
          estimatedProfit >= 0 ? 'bg-gradient-to-tr from-emerald-700 to-teal-600' : 'bg-gradient-to-tr from-rose-700 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-100/90 uppercase tracking-wider">Estimated Net Profit</span>
              <p className="text-2xl font-extrabold mt-1">₹{estimatedProfit.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-[11px] text-white/80 mt-2 font-medium">
            Formula: Sales - Purchases - Expenses
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sales */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="flex items-center space-x-2 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600">Total Sales</span>
            </div>
            <p className="text-base font-extrabold text-blue-800">₹{totalSales.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400">{filteredSales.length} bills recorded</p>
          </div>

          {/* Purchases */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="flex items-center space-x-2 text-rose-600">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600">Total Purchases</span>
            </div>
            <p className="text-base font-extrabold text-rose-800">₹{totalPurchases.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400">{filteredPurchases.length} purchase bills</p>
          </div>

          {/* Expenses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Receipt className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600">Total Expenses</span>
            </div>
            <p className="text-base font-extrabold text-emerald-800">₹{totalExpenses.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400">{filteredExpenses.length} expense entries</p>
          </div>

          {/* Total Received */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="flex items-center space-x-2 text-teal-600">
              <ArrowDownLeft className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600">Total Received</span>
            </div>
            <p className="text-base font-extrabold text-teal-800">₹{totalReceived.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400">Cash & online received</p>
          </div>
        </div>

        {/* Due Summary */}
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800">Total Customer Due</span>
            <p className="text-lg font-extrabold text-amber-900 mt-0.5">₹{totalDue.toLocaleString('en-IN')}</p>
          </div>
          <button onClick={() => onNavigate('customers')} className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm">
            View Customers →
          </button>
        </div>
      </main>
    </div>
  );
}
