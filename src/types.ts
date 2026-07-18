export type UserRole = 'owner' | 'manager' | 'salesperson';

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  isActive: boolean;
  pin?: string; // personal 4-digit PIN for authentication
}

export interface Product {
  id: string;
  name: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  currentQuantity: number;
  lowStockLimit: number;
  barcode?: string;
  image?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
}

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  salespersonId: string;
  salespersonName: string;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit';
  items: SaleItem[];
  totalAmount: number;
  receiptNumber: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'transport'
  | 'fuel'
  | 'electricity'
  | 'salary'
  | 'rent'
  | 'tax'
  | 'repairs'
  | 'miscellaneous';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  description: string;
  salespersonId: string;
  salespersonName: string;
}

export interface StockHistoryLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  productId: string;
  productName: string;
  type: 'sale' | 'add' | 'adjust';
  changeQuantity: number;
  previousQuantity: number;
  newQuantity: number;
  salespersonId: string;
  salespersonName: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string; // ISO string
  read: boolean;
  type: 'low_stock' | 'out_of_stock' | 'low_sales' | 'high_expenses' | 'monthly_report';
}

export interface BusinessSettings {
  businessName: string;
  currency: string;
  businessLogo?: string;
  taxEnabled: boolean;
  taxRate: number; // percentage, e.g. 7.5
  receiptFooter: string;
  darkMode: boolean;
  language: string;
  backupSettings: {
    autoBackup: boolean;
    lastBackupDate?: string;
  };
  pinLockEnabled: boolean;
  pinCode?: string;
  shopCode?: string; // unique 6-character code to register new staff
}

export interface ShopState {
  currentStaffId: string; // logged-in staff member ID
  staff: StaffMember[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stockHistory: StockHistoryLog[];
  notifications: AppNotification[];
  settings: BusinessSettings;
}

export interface AISummaryReport {
  monthlySummary: string;
  predictedLowStock: string[];
  suggestedFastMoving: string[];
  slowMovingInventory: string[];
  spendingWarning: string;
  weeklyHealthReport: string;
  salesPredictionNextMonth: number;
}
