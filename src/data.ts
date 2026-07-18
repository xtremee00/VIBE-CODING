import { ShopState, Product, Sale, Expense, StaffMember, StockHistoryLog, AppNotification } from "./types";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Coca-Cola 50cl",
    category: "Drinks",
    buyingPrice: 150,
    sellingPrice: 200,
    currentQuantity: 45,
    lowStockLimit: 10,
    barcode: "6151100021200",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=60"
  },
  {
    id: "p2",
    name: "Peak Milk Liquid Can",
    category: "Groceries",
    buyingPrice: 350,
    sellingPrice: 450,
    currentQuantity: 5,
    lowStockLimit: 15,
    barcode: "8712800000000",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=60"
  },
  {
    id: "p3",
    name: "Indomie Super Pack",
    category: "Groceries",
    buyingPrice: 120,
    sellingPrice: 150,
    currentQuantity: 120,
    lowStockLimit: 20,
    barcode: "6151101231010"
  },
  {
    id: "p4",
    name: "Dettol Soap 65g",
    category: "Toiletries",
    buyingPrice: 220,
    sellingPrice: 280,
    currentQuantity: 22,
    lowStockLimit: 8
  },
  {
    id: "p5",
    name: "Gala Sausage Roll",
    category: "Snacks",
    buyingPrice: 80,
    sellingPrice: 100,
    currentQuantity: 2,
    lowStockLimit: 10
  },
  {
    id: "p6",
    name: "Sardine Titus Can",
    category: "Groceries",
    buyingPrice: 500,
    sellingPrice: 600,
    currentQuantity: 30,
    lowStockLimit: 10
  },
  {
    id: "p7",
    name: "Milo 20g Sachet",
    category: "Groceries",
    buyingPrice: 90,
    sellingPrice: 110,
    currentQuantity: 0,
    lowStockLimit: 15
  }
];

export const DEFAULT_STAFF: StaffMember[] = [
  { id: "s1", name: "Alhaji Ibrahim", role: "owner", email: "ibrahim@shopledger.com", phone: "+2348031234567", isActive: true },
  { id: "s2", name: "Chinedu (Manager)", role: "manager", email: "chinedu@shopledger.com", phone: "+2348057654321", isActive: true },
  { id: "s3", name: "Aminat (Sales)", role: "salesperson", email: "aminat@shopledger.com", phone: "+2348123456789", isActive: true }
];

// Helper to generate dates relative to current date (e.g. today, yesterday, 3 days ago)
const getDateOffset = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_SALES = (): Sale[] => [
  {
    id: "sale-1",
    date: getDateOffset(0), // Today
    time: "10:15",
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)",
    paymentMethod: "cash",
    items: [
      { productId: "p1", productName: "Coca-Cola 50cl", quantity: 5, buyingPrice: 150, sellingPrice: 200 },
      { productId: "p3", productName: "Indomie Super Pack", quantity: 10, buyingPrice: 120, sellingPrice: 150 }
    ],
    totalAmount: 2500,
    receiptNumber: "SL-100234"
  },
  {
    id: "sale-2",
    date: getDateOffset(0), // Today
    time: "14:30",
    salespersonId: "s2",
    salespersonName: "Chinedu (Manager)",
    paymentMethod: "pos",
    items: [
      { productId: "p6", productName: "Sardine Titus Can", quantity: 2, buyingPrice: 500, sellingPrice: 600 },
      { productId: "p4", productName: "Dettol Soap 65g", quantity: 3, buyingPrice: 220, sellingPrice: 280 }
    ],
    totalAmount: 2040,
    receiptNumber: "SL-100235"
  },
  {
    id: "sale-3",
    date: getDateOffset(1), // Yesterday
    time: "11:00",
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)",
    paymentMethod: "transfer",
    items: [
      { productId: "p1", productName: "Coca-Cola 50cl", quantity: 12, buyingPrice: 150, sellingPrice: 200 },
      { productId: "p2", productName: "Peak Milk Liquid Can", quantity: 4, buyingPrice: 350, sellingPrice: 450 }
    ],
    totalAmount: 4200,
    receiptNumber: "SL-100231"
  },
  {
    id: "sale-4",
    date: getDateOffset(2), // 2 days ago
    time: "09:15",
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)",
    paymentMethod: "credit",
    items: [
      { productId: "p3", productName: "Indomie Super Pack", quantity: 24, buyingPrice: 120, sellingPrice: 150 }
    ],
    totalAmount: 3600,
    receiptNumber: "SL-100230",
    notes: "Okey (Supermarket supplier customer) - promised to pay next Tuesday"
  },
  {
    id: "sale-5",
    date: getDateOffset(4), // 4 days ago
    time: "16:45",
    salespersonId: "s1",
    salespersonName: "Alhaji Ibrahim",
    paymentMethod: "cash",
    items: [
      { productId: "p6", productName: "Sardine Titus Can", quantity: 10, buyingPrice: 500, sellingPrice: 600 },
      { productId: "p4", productName: "Dettol Soap 65g", quantity: 5, buyingPrice: 220, sellingPrice: 280 }
    ],
    totalAmount: 7400,
    receiptNumber: "SL-100229"
  },
  {
    id: "sale-6",
    date: getDateOffset(10), // 10 days ago
    time: "12:00",
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)",
    paymentMethod: "pos",
    items: [
      { productId: "p2", productName: "Peak Milk Liquid Can", quantity: 8, buyingPrice: 350, sellingPrice: 450 }
    ],
    totalAmount: 3600,
    receiptNumber: "SL-100228"
  },
  {
    id: "sale-7",
    date: getDateOffset(15), // 15 days ago
    time: "15:20",
    salespersonId: "s2",
    salespersonName: "Chinedu (Manager)",
    paymentMethod: "cash",
    items: [
      { productId: "p1", productName: "Coca-Cola 50cl", quantity: 30, buyingPrice: 150, sellingPrice: 200 },
      { productId: "p3", productName: "Indomie Super Pack", quantity: 50, buyingPrice: 120, sellingPrice: 150 }
    ],
    totalAmount: 13500,
    receiptNumber: "SL-100227"
  }
];

export const DEFAULT_EXPENSES = (): Expense[] => [
  {
    id: "exp-1",
    date: getDateOffset(0), // Today
    amount: 1500,
    category: "transport",
    description: "Fuel for delivery motorcycle",
    salespersonId: "s2",
    salespersonName: "Chinedu (Manager)"
  },
  {
    id: "exp-2",
    date: getDateOffset(0), // Today
    amount: 5000,
    category: "electricity",
    description: "IKEDC Prepaid meter token",
    salespersonId: "s1",
    salespersonName: "Alhaji Ibrahim"
  },
  {
    id: "exp-3",
    date: getDateOffset(1), // Yesterday
    amount: 800,
    category: "miscellaneous",
    description: "Snacks for shop sanitation helpers",
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)"
  },
  {
    id: "exp-4",
    date: getDateOffset(3), // 3 days ago
    amount: 12000,
    category: "repairs",
    description: "Fixing generator carburetor",
    salespersonId: "s2",
    salespersonName: "Chinedu (Manager)"
  },
  {
    id: "exp-5",
    date: getDateOffset(12), // 12 days ago
    amount: 25000,
    category: "salary",
    description: "Part-time assistant helper salary",
    salespersonId: "s1",
    salespersonName: "Alhaji Ibrahim"
  }
];

export const DEFAULT_STOCK_HISTORY = (): StockHistoryLog[] => [
  {
    id: "log-1",
    date: getDateOffset(0),
    time: "10:15",
    productId: "p1",
    productName: "Coca-Cola 50cl",
    type: "sale",
    changeQuantity: -5,
    previousQuantity: 50,
    newQuantity: 45,
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)"
  },
  {
    id: "log-2",
    date: getDateOffset(0),
    time: "10:15",
    productId: "p3",
    productName: "Indomie Super Pack",
    type: "sale",
    changeQuantity: -10,
    previousQuantity: 130,
    newQuantity: 120,
    salespersonId: "s3",
    salespersonName: "Aminat (Sales)"
  },
  {
    id: "log-3",
    date: getDateOffset(1),
    time: "17:00",
    productId: "p3",
    productName: "Indomie Super Pack",
    type: "add",
    changeQuantity: 100,
    previousQuantity: 30,
    newQuantity: 130,
    salespersonId: "s2",
    salespersonName: "Chinedu (Manager)",
    notes: "Restocked from indomie distributor main truck"
  }
];

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Low Stock Warning ⚠️",
    message: "Peak Milk Liquid Can has only 5 units remaining (Low stock limit: 15). Restock soon to prevent missed sales.",
    date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    read: false,
    type: "low_stock"
  },
  {
    id: "notif-2",
    title: "Critical: Out of Stock! 🚨",
    message: "Milo 20g Sachet is completely out of stock. Customers are frequently asking for this.",
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read: false,
    type: "out_of_stock"
  },
  {
    id: "notif-3",
    title: "Welcome to ShopLedger! 🎉",
    message: "Your smart mobile business record book is ready. Tap products to manage inventory or record your first sale!",
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    read: true,
    type: "monthly_report"
  }
];

export const INITIAL_STATE = (): ShopState => ({
  currentStaffId: "s1", // Defaults to Alhaji Ibrahim (Owner)
  staff: DEFAULT_STAFF,
  products: DEFAULT_PRODUCTS,
  sales: DEFAULT_SALES(),
  expenses: DEFAULT_EXPENSES(),
  stockHistory: DEFAULT_STOCK_HISTORY(),
  notifications: DEFAULT_NOTIFICATIONS,
  settings: {
    businessName: "Ibrahim & Sons Mini Mart",
    currency: "₦",
    taxEnabled: true,
    taxRate: 7.5,
    receiptFooter: "Thank you for shopping with us! Standard terms apply.",
    darkMode: false,
    language: "English",
    backupSettings: {
      autoBackup: true,
      lastBackupDate: new Date().toLocaleDateString()
    },
    pinLockEnabled: false
  }
});
