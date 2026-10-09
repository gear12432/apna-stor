export interface UserProfile {
  uid: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  businessName?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  createdAt: string;
  updatedAt: string;
  accountStatus: 'active' | 'suspended';
}

export interface Customer {
  customerId: string;
  name: string;
  mobile?: string;
  address?: string;
  notes?: string;
  totalReceivable: number; // Lene hain (Customer owes business)
  totalPayable: number;    // Dene hain (Business owes customer)
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  name: string;
  sku?: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockLimit: number;
  unit: string; // e.g., Pcs, Kg, Ltr, Packet
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  saleId: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Other';
  paidAmount: number;
  dueAmount: number;
  note?: string;
  saleDate: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Purchase {
  purchaseId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  note?: string;
  purchaseDate: string;
  createdAt: string;
}

export interface Expense {
  expenseId: string;
  category: 'Shop Rent' | 'Electricity' | 'Transport' | 'Salary' | 'Goods / Material' | 'Food / Refreshment' | 'Others';
  title: string;
  amount: number;
  note?: string;
  expenseDate: string;
  createdAt: string;
}

export interface Payment {
  paymentId: string;
  customerId: string;
  customerName: string;
  type: 'receivable' | 'payable'; // receivable = received payment from customer, payable = paid payment to customer/supplier
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Other';
  note?: string;
  paymentDate: string;
  createdAt: string;
}

export interface DailyWork {
  workId: string;
  customerName: string;
  mobile?: string;
  workTitle: string;
  description?: string;
  totalAmount: number;
  advance: number;
  remainingAmount: number;
  workDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface Reminder {
  reminderId: string;
  title: string;
  description?: string;
  amount?: number;
  reminderDate: string;
  type: 'Payment' | 'Bill' | 'Rent' | 'Stock' | 'Work' | 'Other';
  status: 'Pending' | 'Completed';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  paymentMethod?: string;
  time: string;
  type: 'sale' | 'purchase' | 'expense' | 'payment' | 'work';
  timestamp: string;
}
