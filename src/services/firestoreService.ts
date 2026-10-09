import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './firestoreError';
import { 
  UserProfile, 
  Customer, 
  Product, 
  Sale, 
  Purchase, 
  Expense, 
  Payment, 
  DailyWork, 
  Reminder 
} from '../types';

// Helper to remove any undefined properties from objects before saving to Firestore
function cleanFirestoreData<T extends object>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = (data as Record<string, any>)[key];
    if (val !== undefined) {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

// USER PROFILE
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, cleanFirestoreData(profile));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// CUSTOMERS
export function subscribeCustomers(uid: string, callback: (customers: Customer[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/customers`;
  const q = query(collection(db, 'users', uid, 'customers'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: Customer[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Customer);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function saveCustomer(uid: string, customer: Customer): Promise<void> {
  const path = `users/${uid}/customers/${customer.customerId}`;
  try {
    const docRef = doc(db, 'users', uid, 'customers', customer.customerId);
    await setDoc(docRef, cleanFirestoreData(customer), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCustomer(uid: string, customerId: string): Promise<void> {
  const path = `users/${uid}/customers/${customerId}`;
  try {
    const docRef = doc(db, 'users', uid, 'customers', customerId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// PRODUCTS
export function subscribeProducts(uid: string, callback: (products: Product[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/products`;
  const q = query(collection(db, 'users', uid, 'products'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: Product[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Product);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function saveProduct(uid: string, product: Product): Promise<void> {
  const path = `users/${uid}/products/${product.productId}`;
  try {
    const docRef = doc(db, 'users', uid, 'products', product.productId);
    await setDoc(docRef, cleanFirestoreData(product), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateProductStock(uid: string, productId: string, qtyChange: number): Promise<void> {
  const path = `users/${uid}/products/${productId}`;
  try {
    const docRef = doc(db, 'users', uid, 'products', productId);
    await updateDoc(docRef, {
      stockQuantity: increment(qtyChange),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(uid: string, productId: string): Promise<void> {
  const path = `users/${uid}/products/${productId}`;
  try {
    const docRef = doc(db, 'users', uid, 'products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// SALES
export function subscribeSales(uid: string, callback: (sales: Sale[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/sales`;
  const q = query(collection(db, 'users', uid, 'sales'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Sale[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Sale);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function createSaleTransaction(uid: string, sale: Sale): Promise<void> {
  const path = `users/${uid}/sales/${sale.saleId}`;
  try {
    // Write sale record
    const saleDoc = doc(db, 'users', uid, 'sales', sale.saleId);
    await setDoc(saleDoc, cleanFirestoreData(sale));

    // Reduce product stock for each line item
    for (const item of sale.items) {
      if (item.productId) {
        const prodDoc = doc(db, 'users', uid, 'products', item.productId);
        await updateDoc(prodDoc, {
          stockQuantity: increment(-item.quantity),
          updatedAt: new Date().toISOString()
        }).catch(() => {/* handle if product doesn't exist */});
      }
    }

    // Update customer due if customerId exists and dueAmount > 0
    if (sale.customerId && sale.dueAmount > 0) {
      const custDoc = doc(db, 'users', uid, 'customers', sale.customerId);
      await updateDoc(custDoc, {
        totalReceivable: increment(sale.dueAmount),
        updatedAt: new Date().toISOString()
      }).catch(() => {/* handle if customer doc missing */});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteSale(uid: string, saleId: string): Promise<void> {
  const path = `users/${uid}/sales/${saleId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'sales', saleId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// PURCHASES
export function subscribePurchases(uid: string, callback: (purchases: Purchase[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/purchases`;
  const q = query(collection(db, 'users', uid, 'purchases'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Purchase[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Purchase);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function createPurchaseTransaction(uid: string, purchase: Purchase): Promise<void> {
  const path = `users/${uid}/purchases/${purchase.purchaseId}`;
  try {
    const purchDoc = doc(db, 'users', uid, 'purchases', purchase.purchaseId);
    await setDoc(purchDoc, cleanFirestoreData(purchase));

    // Increase stock for each purchased item
    for (const item of purchase.items) {
      if (item.productId) {
        const prodDoc = doc(db, 'users', uid, 'products', item.productId);
        await updateDoc(prodDoc, {
          stockQuantity: increment(item.quantity),
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePurchase(uid: string, purchaseId: string): Promise<void> {
  const path = `users/${uid}/purchases/${purchaseId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'purchases', purchaseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// EXPENSES
export function subscribeExpenses(uid: string, callback: (expenses: Expense[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/expenses`;
  const q = query(collection(db, 'users', uid, 'expenses'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Expense[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Expense);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function saveExpense(uid: string, expense: Expense): Promise<void> {
  const path = `users/${uid}/expenses/${expense.expenseId}`;
  try {
    const docRef = doc(db, 'users', uid, 'expenses', expense.expenseId);
    await setDoc(docRef, cleanFirestoreData(expense), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const path = `users/${uid}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'expenses', expenseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// PAYMENTS
export function subscribePayments(uid: string, callback: (payments: Payment[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/payments`;
  const q = query(collection(db, 'users', uid, 'payments'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Payment[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Payment);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function createPaymentTransaction(uid: string, payment: Payment): Promise<void> {
  const path = `users/${uid}/payments/${payment.paymentId}`;
  try {
    const docRef = doc(db, 'users', uid, 'payments', payment.paymentId);
    await setDoc(docRef, cleanFirestoreData(payment));

    // Update customer balance
    if (payment.customerId) {
      const custDoc = doc(db, 'users', uid, 'customers', payment.customerId);
      if (payment.type === 'receivable') {
        await updateDoc(custDoc, {
          totalReceivable: increment(-payment.amount),
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      } else {
        await updateDoc(custDoc, {
          totalPayable: increment(-payment.amount),
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePayment(uid: string, paymentId: string): Promise<void> {
  const path = `users/${uid}/payments/${paymentId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'payments', paymentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// DAILY WORK
export function subscribeDailyWork(uid: string, callback: (work: DailyWork[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/dailyWork`;
  const q = query(collection(db, 'users', uid, 'dailyWork'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: DailyWork[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as DailyWork);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function saveDailyWork(uid: string, work: DailyWork): Promise<void> {
  const path = `users/${uid}/dailyWork/${work.workId}`;
  try {
    const docRef = doc(db, 'users', uid, 'dailyWork', work.workId);
    await setDoc(docRef, cleanFirestoreData(work), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteDailyWork(uid: string, workId: string): Promise<void> {
  const path = `users/${uid}/dailyWork/${workId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'dailyWork', workId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// REMINDERS
export function subscribeReminders(uid: string, callback: (reminders: Reminder[]) => void, onError?: (err: any) => void) {
  const path = `users/${uid}/reminders`;
  const q = query(collection(db, 'users', uid, 'reminders'), orderBy('reminderDate', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: Reminder[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Reminder);
    });
    callback(list);
  }, (err) => {
    if (onError) onError(err);
    else handleFirestoreError(err, OperationType.LIST, path);
  });
}

export async function saveReminder(uid: string, reminder: Reminder): Promise<void> {
  const path = `users/${uid}/reminders/${reminder.reminderId}`;
  try {
    const docRef = doc(db, 'users', uid, 'reminders', reminder.reminderId);
    await setDoc(docRef, cleanFirestoreData(reminder), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteReminder(uid: string, reminderId: string): Promise<void> {
  const path = `users/${uid}/reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
