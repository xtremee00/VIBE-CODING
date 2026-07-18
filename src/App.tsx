import React, { useState, useEffect, useMemo } from 'react';
import { ShopState, Product, Sale, Expense, StaffMember, StockHistoryLog, AppNotification, BusinessSettings } from './types';
import { INITIAL_STATE } from './data';
import PinScreen from './components/PinScreen';
import RecordSale from './components/RecordSale';
import RecordExpense from './components/RecordExpense';
import ProductsList from './components/ProductsList';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

import {
  Bell,
  Home,
  ShoppingBag,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  UserCheck,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  ChevronRight,
  Info,
  X,
  Lock,
  Unlock,
  CheckCircle,
  FolderMinus,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<ShopState | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'sales' | 'inventory' | 'reports' | 'settings'>('home');
  const [showPinScreen, setShowPinScreen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  
  // Global search query
  const [globalQuery, setGlobalQuery] = useState<string>("");
  const [showGlobalResults, setShowGlobalResults] = useState<boolean>(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ShopLedger_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
        if (parsed.settings?.pinLockEnabled) {
          setShowPinScreen(true);
        }
      } catch (err) {
        // Fallback to initial seed data
        const initial = INITIAL_STATE();
        setState(initial);
        localStorage.setItem("ShopLedger_state", JSON.stringify(initial));
      }
    } else {
      const initial = INITIAL_STATE();
      setState(initial);
      localStorage.setItem("ShopLedger_state", JSON.stringify(initial));
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = (newState: ShopState) => {
    setState(newState);
    localStorage.setItem("ShopLedger_state", JSON.stringify(newState));
  };

  // Global search matches
  const globalSearchResults = useMemo(() => {
    if (!state || !globalQuery.trim()) return null;
    const q = globalQuery.toLowerCase();
    const { products, sales, expenses, staff } = state;

    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
    );

    const matchedSales = sales.filter(s => 
      s.receiptNumber.toLowerCase().includes(q) || s.salespersonName.toLowerCase().includes(q) || s.paymentMethod.toLowerCase().includes(q)
    );

    const matchedExpenses = expenses.filter(e => 
      e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.salespersonName.toLowerCase().includes(q)
    );

    const matchedStaff = staff.filter(s => 
      s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
    );

    return {
      products: matchedProducts.slice(0, 4),
      sales: matchedSales.slice(0, 4),
      expenses: matchedExpenses.slice(0, 4),
      staff: matchedStaff.slice(0, 4)
    };
  }, [globalQuery, state]);

  const activeStaffMember = state
    ? (state.staff.find(s => s.id === state.currentStaffId) || state.staff[0])
    : null;

  // Prevent unauthorized tab access
  useEffect(() => {
    if (activeStaffMember && activeStaffMember.role === 'salesperson' && (activeTab === 'reports' || activeTab === 'settings')) {
      setActiveTab('home');
    }
  }, [activeStaffMember, activeTab]);

  if (!state) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-3 font-bold">Booting ShopLedger local database...</p>
      </div>
    );
  }

  const { settings, products, sales, expenses, stockHistory, notifications, currentStaffId, staff } = state;

  // Handle sales checkout
  const handleCompleteSale = (saleData: Omit<Sale, 'id'>) => {
    const saleId = `sale-${Date.now()}`;
    const newSale: Sale = {
      ...saleData,
      id: saleId
    };

    // 1. Deduct stock and generate stock adjustment logs
    const updatedProducts = products.map((prod) => {
      const soldItem = saleData.items.find(item => item.productId === prod.id);
      if (soldItem) {
        return {
          ...prod,
          currentQuantity: Math.max(0, prod.currentQuantity - soldItem.quantity)
        };
      }
      return prod;
    });

    // Create history logs
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
    
    const newLogs: StockHistoryLog[] = saleData.items.map((item, idx) => {
      const oldProd = products.find(p => p.id === item.productId)!;
      return {
        id: `log-${Date.now()}-${idx}`,
        date: dateStr,
        time: timeStr,
        productId: item.productId,
        productName: item.productName,
        type: 'sale',
        changeQuantity: -item.quantity,
        previousQuantity: oldProd.currentQuantity,
        newQuantity: Math.max(0, oldProd.currentQuantity - item.quantity),
        salespersonId: activeStaffMember.id,
        salespersonName: activeStaffMember.name
      };
    });

    // 2. Generate Low stock notification warnings
    const newNotifs: AppNotification[] = [];
    saleData.items.forEach(item => {
      const updatedP = updatedProducts.find(p => p.id === item.productId)!;
      if (updatedP.currentQuantity === 0) {
        newNotifs.push({
          id: `notif-${Date.now()}-${item.productId}`,
          title: "Out of Stock! 🚨",
          message: `${updatedP.name} is completely out of stock! Restock immediately.`,
          date: new Date().toISOString(),
          read: false,
          type: "out_of_stock"
        });
      } else if (updatedP.currentQuantity <= updatedP.lowStockLimit) {
        newNotifs.push({
          id: `notif-${Date.now()}-${item.productId}`,
          title: "Low Stock Alert ⚠️",
          message: `${updatedP.name} has reached low stock level (${updatedP.currentQuantity} remaining).`,
          date: new Date().toISOString(),
          read: false,
          type: "low_stock"
        });
      }
    });

    // Save state
    saveState({
      ...state,
      sales: [newSale, ...sales],
      products: updatedProducts,
      stockHistory: [...newLogs, ...stockHistory],
      notifications: [...newNotifs, ...notifications]
    });
  };

  // Handle voiding a sale (restores inventory and removes transaction)
  const handleVoidSale = (saleId: string) => {
    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid) return;

    // Restore stock for each item
    const updatedProducts = products.map((prod) => {
      const soldItem = saleToVoid.items.find(item => item.productId === prod.id);
      if (soldItem) {
        return {
          ...prod,
          currentQuantity: prod.currentQuantity + soldItem.quantity
        };
      }
      return prod;
    });

    // Generate stock adjustment history logs
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

    const voidLogs: StockHistoryLog[] = saleToVoid.items.map((item, idx) => {
      const oldProd = products.find(p => p.id === item.productId)!;
      return {
        id: `log-void-${Date.now()}-${idx}`,
        date: dateStr,
        time: timeStr,
        productId: item.productId,
        productName: item.productName,
        type: 'adjust',
        changeQuantity: item.quantity,
        previousQuantity: oldProd ? oldProd.currentQuantity : 0,
        newQuantity: (oldProd ? oldProd.currentQuantity : 0) + item.quantity,
        salespersonId: activeStaffMember.id,
        salespersonName: activeStaffMember.name,
        notes: `Voided Sale: ${saleToVoid.receiptNumber}`
      };
    });

    saveState({
      ...state,
      sales: sales.filter(s => s.id !== saleId),
      products: updatedProducts,
      stockHistory: [...voidLogs, ...stockHistory]
    });
  };

  // Handle logging expenses
  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };

    saveState({
      ...state,
      expenses: [newExpense, ...expenses]
    });
  };

  // Handle deleting expenses
  const handleDeleteExpense = (id: string) => {
    saveState({
      ...state,
      expenses: expenses.filter(e => e.id !== id)
    });
  };


  // Handle adding product
  const handleAddProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `p-${Date.now()}`
    };

    saveState({
      ...state,
      products: [newProduct, ...products]
    });
  };

  // Handle stock adjustment logs
  const handleAdjustStock = (productId: string, delta: number, type: 'add' | 'adjust', notes?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

    const oldProd = products.find(p => p.id === productId)!;
    const nextQty = Math.max(0, oldProd.currentQuantity + delta);

    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, currentQuantity: nextQty } : p
    );

    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      productId,
      productName: oldProd.name,
      type,
      changeQuantity: delta,
      previousQuantity: oldProd.currentQuantity,
      newQuantity: nextQty,
      salespersonId: activeStaffMember.id,
      salespersonName: activeStaffMember.name,
      notes
    };

    saveState({
      ...state,
      products: updatedProducts,
      stockHistory: [newLog, ...stockHistory]
    });
  };

  // Handle updating settings
  const handleSaveSettings = (newSettings: BusinessSettings) => {
    saveState({
      ...state,
      settings: newSettings
    });
  };

  // Handle database backups JSON exports
  const handleExportState = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ShopLedger_Backup_${settings.businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Handle restoring state
  const handleImportState = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      saveState(parsed);
    } catch (err) {
      alert("Error parsing backup data. Ensure formatting is standard.");
    }
  };

  // Mark all notifications as read
  const markNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveState({
      ...state,
      notifications: updated
    });
  };

  // Clear single notification
  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveState({
      ...state,
      notifications: updated
    });
  };

  // Quick numbers for dashboard home
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === today).reduce((sum, s) => sum + s.totalAmount, 0);
  const todayExpenses = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
  
  let todayCostOfGoods = 0;
  sales.filter(s => s.date === today).forEach(s => {
    s.items.forEach(i => {
      todayCostOfGoods += i.buyingPrice * i.quantity;
    });
  });
  
  const todayProfit = todaySales - todayCostOfGoods - todayExpenses;
  const cashSales = sales.filter(s => s.date === today && s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0);
  const expectedCash = cashSales - todayExpenses; // Sales in cash minus expenses paid

  const lowStockProductsCount = products.filter(p => p.currentQuantity <= p.lowStockLimit && p.currentQuantity > 0).length;
  const outOfStockCount = products.filter(p => p.currentQuantity === 0).length;

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-between font-sans pb-24">
      {/* PIN Lock overlay */}
      {showPinScreen && (
        <PinScreen
          correctPin={settings.pinCode || "1234"}
          businessName={settings.businessName}
          onUnlock={() => setShowPinScreen(false)}
        />
      )}

      {/* Top Header navbar with settings and roles */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Shop Name & Logo initial banner */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              {settings.businessName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">
                {settings.businessName}
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-medium">
                <span>{activeStaffMember.name} • {activeStaffMember.role === 'owner' ? 'Shop Owner' : activeStaffMember.role === 'admin' ? 'Manager' : 'Salesperson'}</span>
                {settings.pinLockEnabled && (
                  <span className="text-[9px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider border border-teal-100">
                    <Lock className="w-2.5 h-2.5" /> PIN Locked
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Search trigger & results input */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
            <input
              id="global-search-header"
              type="text"
              placeholder="Search ledger..."
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setShowGlobalResults(!!e.target.value);
              }}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 focus:bg-white text-xs font-medium transition-all"
            />
            
            {showGlobalResults && globalSearchResults && (
              <div className="absolute top-11 left-0 right-0 bg-white rounded-3xl p-5 shadow-lg border border-gray-100 max-h-96 overflow-y-auto space-y-3.5 z-40 animate-fade-in text-xs text-left">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="font-extrabold text-gray-400 text-[10px] uppercase tracking-wider">Search Results</span>
                  <button id="close-search-results-btn" onClick={() => { setGlobalQuery(""); setShowGlobalResults(false); }} className="text-gray-400 font-bold hover:text-gray-600">Close</button>
                </div>

                {/* Match products */}
                {globalSearchResults.products.length > 0 && (
                  <div>
                    <h4 className="font-black text-gray-400 text-[9px] uppercase tracking-wider mb-1">Products</h4>
                    <div className="space-y-1">
                      {globalSearchResults.products.map(p => (
                        <button
                          id={`search-prod-${p.id}`}
                          key={p.id}
                          onClick={() => {
                            setActiveTab('inventory');
                            setGlobalQuery("");
                            setShowGlobalResults(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors flex justify-between"
                        >
                          <span className="font-bold text-gray-800">{p.name}</span>
                          <span className="font-semibold text-gray-500">{p.category} ({p.currentQuantity} left)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match sales */}
                {globalSearchResults.sales.length > 0 && (
                  <div>
                    <h4 className="font-black text-gray-400 text-[9px] uppercase tracking-wider mb-1">Sales invoices</h4>
                    <div className="space-y-1">
                      {globalSearchResults.sales.map(s => (
                        <button
                          id={`search-sale-${s.id}`}
                          key={s.id}
                          onClick={() => {
                            setActiveTab('reports');
                            setGlobalQuery("");
                            setShowGlobalResults(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors flex justify-between"
                        >
                          <span className="font-bold text-gray-800">{s.receiptNumber}</span>
                          <span className="font-semibold text-gray-500">{settings.currency}{s.totalAmount} by {s.salespersonName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match expenses */}
                {globalSearchResults.expenses.length > 0 && (
                  <div>
                    <h4 className="font-black text-gray-400 text-[9px] uppercase tracking-wider mb-1">Expenses</h4>
                    <div className="space-y-1">
                      {globalSearchResults.expenses.map(e => (
                        <button
                          id={`search-exp-${e.id}`}
                          key={e.id}
                          onClick={() => {
                            setActiveTab('reports');
                            setGlobalQuery("");
                            setShowGlobalResults(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors flex justify-between"
                        >
                          <span className="font-bold text-gray-800">{e.description}</span>
                          <span className="font-semibold text-gray-500">{settings.currency}{e.amount} ({e.category})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {globalSearchResults.products.length === 0 && globalSearchResults.sales.length === 0 && globalSearchResults.expenses.length === 0 && (
                  <p className="text-center text-gray-400 py-4 font-bold">No results match "{globalQuery}"</p>
                )}
              </div>
            )}
          </div>

          {/* Right navbar links: staff changer, bell, notifications popup */}
          <div className="flex items-center gap-3">
            {/* Staff Changer Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-2 rounded-full border border-gray-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 mr-0.5 hidden sm:inline">Personnel:</span>
              <select
                id="staff-changer-dropdown"
                value={currentStaffId}
                onChange={(e) => {
                  saveState({
                    ...state,
                    currentStaffId: e.target.value
                  });
                }}
                className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
              >
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="bell-notif-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    markNotificationsRead();
                  }
                }}
                className="w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center relative cursor-pointer active:scale-95 transition-all"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Popup Dropdown card */}
              {showNotifications && (
                <div className="absolute right-0 top-12 bg-white rounded-3xl p-5 shadow-lg border border-gray-100 w-80 max-h-[400px] overflow-y-auto space-y-3.5 z-40 animate-fade-in text-xs text-left">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="font-extrabold text-gray-400 text-[10px] uppercase tracking-wider">Alerts & Warnings</span>
                    <button
                      id="close-notif-btn"
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 font-bold hover:text-gray-600"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between gap-2.5 relative group"
                        >
                          <div className="space-y-1 pr-5">
                            <span className="font-bold text-[11px] text-gray-900 tracking-tight block">{n.title}</span>
                            <p className="text-[11px] text-gray-500 font-medium leading-normal">{n.message}</p>
                            <span className="text-[9px] text-gray-400 font-medium block">{new Date(n.date).toLocaleDateString()}</span>
                          </div>
                          
                          <button
                            id={`delete-notif-${n.id}`}
                            onClick={() => deleteNotification(n.id)}
                            className="text-gray-400 hover:text-red-500 absolute top-2.5 right-2.5 p-1 bg-white border border-gray-100 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 py-4 font-semibold">No warnings or low stock issues.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container view switching */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            
            {/* Top banner / Greetings */}
            <div className="flex flex-col gap-1 md:gap-2">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Good day, {activeStaffMember.name}
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Here's how {settings.businessName} is performing today, {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.
              </p>
            </div>

            {/* Giant KPIs Display widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeStaffMember.role === 'salesperson' ? (
                <>
                  {/* Today's sales */}
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px] md:col-span-1 lg:col-span-2">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Today's Sales</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {settings.currency}{todaySales.toLocaleString()}
                      </h3>
                    </div>
                    <div className="mt-4 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <span>Gross recorded intake</span>
                    </div>
                  </div>

                  {/* Secure Mode Badge Card */}
                  <div className="bg-teal-950 text-teal-100 p-6 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[140px] md:col-span-1 lg:col-span-2 border border-teal-900">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase text-teal-300 tracking-wider">Shift Privileges</span>
                        <div className="p-2 bg-teal-900 text-teal-300 rounded-xl">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-xl font-extrabold tracking-tight">
                        Secure Salesperson Mode
                      </h3>
                      <p className="text-[11px] text-teal-200/80 mt-1 font-semibold leading-relaxed">
                        Some highly sensitive financial data and shop configurations are restricted for security.
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] text-teal-300 font-bold flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-teal-400 rounded-full animate-pulse mr-1"></span>
                      Active Session is Encrypted & Logged
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Today's sales */}
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Today's Sales</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {settings.currency}{todaySales.toLocaleString()}
                      </h3>
                    </div>
                    <div className="mt-4 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <span>Gross recorded intake</span>
                    </div>
                  </div>

                  {/* Today's expenses */}
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Today's Expenses</span>
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                          <FolderMinus className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {settings.currency}{todayExpenses.toLocaleString()}
                      </h3>
                    </div>
                    <div className="mt-4 text-xs text-gray-400 font-semibold">
                      <span>Logged outgoing costs</span>
                    </div>
                  </div>

                  {/* Today's profit (The stunning dark teal card) */}
                  <div className="bg-teal-900 text-white p-6 rounded-[32px] shadow-md flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase text-teal-200 tracking-wider">Net Profit</span>
                        <div className="p-2 bg-teal-800 text-teal-200 rounded-xl">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black tracking-tight">
                        {todayProfit >= 0 ? "+" : ""}{settings.currency}{todayProfit.toLocaleString()}
                      </h3>
                    </div>
                    <div className="mt-4 text-xs text-teal-200/80 font-semibold">
                      <span>{todayProfit >= 0 ? "Healthy performance" : "Requires review"}</span>
                    </div>
                  </div>

                  {/* Expected cash */}
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Expected Cash</span>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {settings.currency}{expectedCash.toLocaleString()}
                      </h3>
                    </div>
                    <div className="mt-4 text-xs text-amber-600 font-semibold">
                      <span>Cash received minus paid expenses</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions & Low Stock Alerts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Quick Actions bento grid cards (8 columns) */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Record Sale Action Card */}
                <button
                  id="dash-record-sale-btn"
                  onClick={() => setActiveTab('sales')}
                  className="flex items-center gap-5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white p-8 rounded-[24px] transition-all shadow-md cursor-pointer border-0 text-left w-full group"
                >
                  <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold leading-tight">Record Sale</div>
                    <div className="text-sm opacity-90 mt-1 font-medium">Add new transaction</div>
                  </div>
                </button>

                {/* Inventory Action Card */}
                <button
                  id="dash-add-stock-btn"
                  onClick={() => setActiveTab('inventory')}
                  className="flex items-center gap-5 bg-white border-2 border-gray-100 hover:border-teal-200 active:scale-95 p-8 rounded-[24px] transition-all text-gray-800 cursor-pointer text-left w-full group shadow-sm"
                >
                  <div className="bg-gray-100 p-4 rounded-2xl text-gray-600 group-hover:scale-105 transition-transform">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold leading-tight">Inventory</div>
                    <div className="text-sm text-gray-500 mt-1 font-medium">Update stock levels</div>
                  </div>
                </button>
              </div>

              {/* Low Stock Alerts (4 columns) */}
              <div className="lg:col-span-4 bg-orange-50/70 border border-orange-100 p-6 rounded-[24px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-orange-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Low Stock Alert
                  </div>
                  <div className="space-y-3">
                    {products.filter(p => p.currentQuantity <= p.lowStockLimit).length > 0 ? (
                      products.filter(p => p.currentQuantity <= p.lowStockLimit).slice(0, 3).map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 font-semibold truncate max-w-[170px]">{p.name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.currentQuantity === 0 ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"
                          }`}>
                            {p.currentQuantity === 0 ? "Out of Stock" : `${p.currentQuantity} left`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-600 font-medium italic">All catalog items stand strong above stock limits.</p>
                    )}
                  </div>
                </div>
                {products.filter(p => p.currentQuantity <= p.lowStockLimit).length > 3 && (
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="mt-4 text-xs font-bold text-orange-800 hover:underline flex items-center gap-0.5"
                  >
                    View all low-stock items
                  </button>
                )}
              </div>
            </div>

            {/* Quick Record Expense component embedded for fast workflow */}
            {activeStaffMember.role !== 'salesperson' && (
              <div className="pt-2 bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                <RecordExpense
                  currentStaff={activeStaffMember}
                  currency={settings.currency}
                  expenses={expenses}
                  onSave={handleSaveExpense}
                  onDelete={handleDeleteExpense}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <RecordSale
            products={products}
            currentStaff={activeStaffMember}
            taxEnabled={settings.taxEnabled}
            taxRate={settings.taxRate}
            currency={settings.currency}
            receiptFooter={settings.receiptFooter}
            onCompleteSale={handleCompleteSale}
          />
        )}

        {activeTab === 'inventory' && (
          <ProductsList
            products={products}
            currentStaff={activeStaffMember}
            currency={settings.currency}
            onAddProduct={handleAddProduct}
            onAdjustStock={handleAdjustStock}
            stockHistory={stockHistory}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            sales={sales}
            expenses={expenses}
            products={products}
            staff={staff}
            currency={settings.currency}
            businessName={settings.businessName}
            currentStaff={activeStaffMember}
            onVoidSale={handleVoidSale}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            staff={staff}
            onSaveSettings={handleSaveSettings}
            onExportState={handleExportState}
            onImportState={handleImportState}
            currentStaff={activeStaffMember}
          />
        )}
      </main>

      {/* Bottom responsive navigation bar styled with beautiful clean theme */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 z-30 px-6 md:px-16 flex items-center justify-between shadow-sm">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          
          {/* Home Tab */}
          <button
            id="nav-btn-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-teal-600 font-bold scale-105' : 'text-gray-400 font-medium hover:text-gray-600'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>

          {/* Sales Tab */}
          <button
            id="nav-btn-sales"
            onClick={() => setActiveTab('sales')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'sales' ? 'text-teal-600 font-bold scale-105' : 'text-gray-400 font-medium hover:text-gray-600'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sales</span>
          </button>

          {/* Stock/Inventory Tab */}
          <button
            id="nav-btn-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'text-teal-600 font-bold scale-105' : 'text-gray-400 font-medium hover:text-gray-600'
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stock</span>
          </button>

          {/* Reports Tab */}
          {activeStaffMember.role !== 'salesperson' && (
            <button
              id="nav-btn-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'reports' ? 'text-teal-600 font-bold scale-105' : 'text-gray-400 font-medium hover:text-gray-600'
              }`}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Reports</span>
            </button>
          )}

          {/* Settings Tab */}
          {activeStaffMember.role !== 'salesperson' && (
            <button
              id="nav-btn-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'settings' ? 'text-teal-600 font-bold scale-105' : 'text-gray-400 font-medium hover:text-gray-600'
              }`}
            >
              <SettingsIcon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
            </button>
          )}

        </div>
      </nav>
    </div>
  );
}
