import React, { useState, useMemo } from 'react';
import { Sale, Expense, Product, StaffMember, AISummaryReport } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Sparkles, Brain, Download, Loader2, ArrowUpRight, Award, Users, AlertCircle, ShoppingCart, Lock, FileText, Search, Trash2, Eye, Printer, Copy, Undo2 } from 'lucide-react';

interface ReportsViewProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  staff: StaffMember[];
  currency: string;
  businessName: string;
  currentStaff: StaffMember;
  onVoidSale?: (saleId: string) => void;
}

export default function ReportsView({
  sales,
  expenses,
  products,
  staff,
  currency,
  businessName,
  currentStaff,
  onVoidSale
}: ReportsViewProps) {
  if (currentStaff.role === 'salesperson') {
    return (
      <div className="animate-fade-in max-w-md mx-auto p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-gray-900">Access Restricted</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Your personnel profile is set to <strong>Salesperson</strong>. Only Managers or the Shop Owner can view business performance charts and sales predictions.
          </p>
        </div>
      </div>
    );
  }
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'transport': return 'Transport';
      case 'fuel': return 'Fuel';
      case 'electricity': return 'Electricity';
      case 'salary': return 'Staff Salary';
      case 'rent': return 'Rent';
      case 'tax': return 'Taxes / Levies';
      case 'repairs': return 'Repairs';
      case 'miscellaneous': return 'Miscellaneous';
      default: return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  const [filterType, setFilterType] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // AI premium state
  const [aiReport, setAiReport] = useState<AISummaryReport | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // Logs filters & states
  const [activeLogTab, setActiveLogTab] = useState<'sales' | 'expenses'>('sales');
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>("");
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'all' | 'cash' | 'transfer' | 'pos' | 'credit'>('all');
  
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("all");

  // Receipt Modal State
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Filter local data based on date ranges
  const dateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Week start (7 days ago)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    // Month start (30 days ago)
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];

    // Year start (365 days ago)
    const lastYear = new Date();
    lastYear.setDate(lastYear.getDate() - 365);
    const lastYearStr = lastYear.toISOString().split('T')[0];

    switch (filterType) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'yesterday':
        return { start: yesterdayStr, end: yesterdayStr };
      case 'week':
        return { start: lastWeekStr, end: todayStr };
      case 'month':
        return { start: lastMonthStr, end: todayStr };
      case 'year':
        return { start: lastYearStr, end: todayStr };
      case 'custom':
        return { start: startDate || "2000-01-01", end: endDate || todayStr };
    }
  }, [filterType, startDate, endDate]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);
  }, [sales, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);
  }, [expenses, dateRange]);

  const searchedSales = useMemo(() => {
    let list = filteredSales;
    if (salesSearchQuery.trim()) {
      const q = salesSearchQuery.toLowerCase();
      list = list.filter(s => 
        s.receiptNumber.toLowerCase().includes(q) ||
        s.salespersonName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        s.items.some(item => item.productName.toLowerCase().includes(q))
      );
    }
    if (salesPaymentFilter !== 'all') {
      list = list.filter(s => s.paymentMethod === salesPaymentFilter);
    }
    return list;
  }, [filteredSales, salesSearchQuery, salesPaymentFilter]);

  const searchedExpenses = useMemo(() => {
    let list = filteredExpenses;
    if (expenseSearchQuery.trim()) {
      const q = expenseSearchQuery.toLowerCase();
      list = list.filter(e => 
        e.description.toLowerCase().includes(q) ||
        e.salespersonName.toLowerCase().includes(q) ||
        getCategoryLabel(e.category).toLowerCase().includes(q)
      );
    }
    if (expenseCategoryFilter !== 'all') {
      list = list.filter(e => e.category === expenseCategoryFilter);
    }
    return list;
  }, [filteredExpenses, expenseSearchQuery, expenseCategoryFilter]);

  // Main metrics calculations
  const totals = useMemo(() => {
    let totalSales = 0;
    let costOfGoods = 0;
    let totalExpenses = 0;

    filteredSales.forEach(s => {
      totalSales += s.totalAmount;
      s.items.forEach(i => {
        costOfGoods += i.buyingPrice * i.quantity;
      });
    });

    filteredExpenses.forEach(e => {
      totalExpenses += e.amount;
    });

    const netProfit = totalSales - costOfGoods - totalExpenses;
    const remainingStockValue = products.reduce((sum, p) => sum + (p.buyingPrice * p.currentQuantity), 0);

    return {
      totalSales,
      costOfGoods,
      totalExpenses,
      netProfit,
      remainingStockValue
    };
  }, [filteredSales, filteredExpenses, products]);

  // Chart daily performance data mapping
  const dailyPerformanceChartData = useMemo(() => {
    const dataMap: { [date: string]: { date: string; Sales: number; Expenses: number } } = {};
    
    // Fill active date ranges
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Safety check for ultra large intervals
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        dataMap[dStr] = { date: dStr.slice(5), Sales: 0, Expenses: 0 };
      }
    }

    filteredSales.forEach(s => {
      const label = diffDays > 31 ? s.date.slice(0, 7) : s.date.slice(5); // Monthly or daily aggregation label
      const fullDate = s.date;
      if (diffDays <= 31) {
        if (dataMap[fullDate]) {
          dataMap[fullDate].Sales += s.totalAmount;
        }
      } else {
        if (!dataMap[label]) {
          dataMap[label] = { date: label, Sales: 0, Expenses: 0 };
        }
        dataMap[label].Sales += s.totalAmount;
      }
    });

    filteredExpenses.forEach(e => {
      const label = diffDays > 31 ? e.date.slice(0, 7) : e.date.slice(5);
      const fullDate = e.date;
      if (diffDays <= 31) {
        if (dataMap[fullDate]) {
          dataMap[fullDate].Expenses += e.amount;
        }
      } else {
        if (!dataMap[label]) {
          dataMap[label] = { date: label, Sales: 0, Expenses: 0 };
        }
        dataMap[label].Expenses += e.amount;
      }
    });

    return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, filteredExpenses, dateRange]);

  // Best / Worst Selling Products calculations
  const productPerformance = useMemo(() => {
    const sellQtyMap: { [id: string]: { name: string; quantity: number; revenue: number; category: string } } = {};
    
    filteredSales.forEach(s => {
      s.items.forEach(i => {
        if (!sellQtyMap[i.productId]) {
          sellQtyMap[i.productId] = { name: i.productName, quantity: 0, revenue: 0, category: "" };
        }
        sellQtyMap[i.productId].quantity += i.quantity;
        sellQtyMap[i.productId].revenue += i.sellingPrice * i.quantity;
      });
    });

    const list = Object.values(sellQtyMap).sort((a, b) => b.quantity - a.quantity);
    return {
      best: list.slice(0, 5),
      worst: list.slice().reverse().slice(0, 5)
    };
  }, [filteredSales]);

  // Staff Leaderboard
  const staffPerformance = useMemo(() => {
    const performanceMap: { 
      [id: string]: { 
        name: string; 
        revenue: number; 
        transactions: number; 
        avgTransaction: number; 
        role: string 
      } 
    } = {};

    staff.forEach(st => {
      performanceMap[st.id] = { name: st.name, revenue: 0, transactions: 0, avgTransaction: 0, role: st.role };
    });

    filteredSales.forEach(s => {
      const entry = performanceMap[s.salespersonId];
      if (entry) {
        entry.revenue += s.totalAmount;
        entry.transactions += 1;
      }
    });

    return Object.values(performanceMap).map(e => ({
      ...e,
      avgTransaction: e.transactions > 0 ? Math.round(e.revenue / e.transactions) : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, staff]);

  // Trigger Gemini API to generate insights
  const handleGenerateAIReport = async () => {
    setLoadingAI(true);
    setAiError("");
    setAiReport(null);

    try {
      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales: sales.map(s => ({
            date: s.date,
            totalAmount: s.totalAmount,
            salespersonName: s.salespersonName,
            paymentMethod: s.paymentMethod,
            items: s.items.map(i => ({ productName: i.productName, quantity: i.quantity, sellingPrice: i.sellingPrice }))
          })),
          expenses: expenses.map(e => e.amount),
          products: products.map(p => ({
            name: p.name,
            category: p.category,
            currentQuantity: p.currentQuantity,
            lowStockLimit: p.lowStockLimit,
            sellingPrice: p.sellingPrice
          })),
          businessName: businessName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI analytics model.");
      }

      const data = await response.json();
      setAiReport(data);
    } catch (err: any) {
      setAiError(err.message || "Failed to call AI server.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleExportTextReport = () => {
    const separator = "---------------------------------------------";
    const reportText = `
=== ShopLedger Business Report ===
Business: ${businessName}
Filter Range: ${dateRange.start} to ${dateRange.end}
Generated On: ${new Date().toLocaleDateString()}
${separator}
Total Sales: ${currency}${totals.totalSales.toLocaleString()}
Total Cost of Goods: ${currency}${totals.costOfGoods.toLocaleString()}
Total Expenses: ${currency}${totals.totalExpenses.toLocaleString()}
Net Business Profit: ${currency}${totals.netProfit.toLocaleString()}
Estimated Inventory Value: ${currency}${totals.remainingStockValue.toLocaleString()}
${separator}
Top selling products:
${productPerformance.best.map((p, idx) => `${idx + 1}. ${p.name} (x${p.quantity} items) - ${currency}${p.revenue.toLocaleString()}`).join("\n")}
${separator}
Staff Sales performance:
${staffPerformance.map((s, idx) => `${idx + 1}. ${s.name} (${s.role}): ${currency}${s.revenue.toLocaleString()} in ${s.transactions} orders`).join("\n")}
${separator}
Thank you for using ShopLedger.
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ShopLedger_Report_${dateRange.start}_to_${dateRange.end}.txt`;
    link.click();
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-24 space-y-6">
      {/* Title & Filters Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <span className="w-3 h-3 bg-teal-600 rounded-full inline-block"></span>
            Shop Reports & Analytics
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">View real-time profit margins, cost analysis, and staff scoreboards.</p>
        </div>

        {/* Filters Select tags */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'year', label: 'Year' },
              { id: 'custom', label: 'Custom' }
            ] as const
          ).map(f => (
            <button
              id={`report-filter-btn-${f.id}`}
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                filterType === f.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom dates picker */}
      {filterType === 'custom' && (
        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-wrap gap-3 items-end animate-fade-in">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              id="report-custom-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">End Date</label>
            <input
              id="report-custom-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-700"
            />
          </div>
        </div>
      )}

      {/* Metric Cards KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Total Sales</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mt-1">
              {currency}{totals.totalSales.toLocaleString()}
            </h3>
          </div>
          <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full w-max flex items-center gap-0.5 self-start">
            <ArrowUpRight className="w-3 h-3" /> Sales Logged
          </span>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Total Expenses</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mt-1">
              {currency}{totals.totalExpenses.toLocaleString()}
            </h3>
          </div>
          <span className="text-[9px] font-black text-red-700 bg-red-50 px-2.5 py-1 rounded-full w-max flex items-center gap-0.5 self-start">
            Spent Logged
          </span>
        </div>

        {/* Profit */}
        <div className="bg-white p-6 rounded-[24px] border border-teal-100 bg-teal-50/20 shadow-sm flex flex-col justify-between h-32">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Net Profit</p>
            <h3 className={`text-xl font-black tracking-tight mt-1 ${totals.netProfit >= 0 ? "text-teal-600" : "text-red-500"}`}>
              {totals.netProfit >= 0 ? "+" : ""}{currency}{totals.netProfit.toLocaleString()}
            </h3>
          </div>
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full w-max self-start ${
            totals.netProfit >= 0 ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"
          }`}>
            Revenue - Cost - Expense
          </span>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Inventory Valuation</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mt-1">
              {currency}{totals.remainingStockValue.toLocaleString()}
            </h3>
          </div>
          <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full w-max self-start">
            Asset Cost Value
          </span>
        </div>
      </div>

      {/* AI PREMIUM ADVANCED ANALYTICS SECTION */}
      <div className="bg-gradient-to-r from-gray-950 via-teal-950 to-gray-900 rounded-[24px] p-6 text-white border border-teal-500/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-md font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400 fill-teal-400 animate-pulse" />
              ShopLedger AI Business Copilot
            </h3>
            <p className="text-xs text-gray-300 font-medium">
              Generate intelligent predictions, weekly plain-language health reports, fast-selling suggestions, and spending audits.
            </p>
          </div>

          <button
            id="ai-generate-btn"
            onClick={handleGenerateAIReport}
            disabled={loadingAI}
            className="h-10 px-5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 border-0 transition-all"
          >
            {loadingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Shop Data...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Get Premium AI Report
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-scale-up pt-4 border-t border-teal-900/40">
            {/* Left AI Column: Health Report & Narrative */}
            <div className="bg-teal-950/20 p-5 rounded-2xl border border-teal-900/20 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 uppercase tracking-wider">
                <Brain className="w-4 h-4" /> Custom Health Report
              </div>
              <p className="text-sm font-semibold leading-relaxed text-gray-200 bg-teal-950/40 p-4 rounded-xl border border-teal-900/30">
                "{aiReport.weeklyHealthReport}"
              </p>
              <div className="text-xs text-gray-300 leading-relaxed font-semibold">
                <span className="font-bold text-white block mb-0.5">Monthly Summary:</span>
                {aiReport.monthlySummary}
              </div>
            </div>

            {/* Right AI Column: Low stock prediction, slow moving, and prediction */}
            <div className="bg-teal-950/20 p-5 rounded-2xl border border-teal-900/20 space-y-4">
              {/* Sales Prediction */}
              <div className="flex justify-between items-center bg-teal-950/40 p-3 rounded-xl border border-teal-900/30">
                <div>
                  <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Predicted Next Month Sales</span>
                  <p className="text-[11px] text-gray-400 mt-0.5">Using multi-day trend estimation</p>
                </div>
                <div className="text-right">
                  <h4 className="text-md font-bold text-emerald-400">{currency}{aiReport.salesPredictionNextMonth.toLocaleString()}</h4>
                </div>
              </div>

              {/* Lists of product items */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="font-bold text-teal-300 block mb-1 uppercase tracking-wider text-[10px]">Restock Soon:</span>
                  {aiReport.predictedLowStock.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-gray-300 font-semibold">
                      {aiReport.predictedLowStock.map((p, i) => <li key={i} className="truncate">{p}</li>)}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">No low-stock items</span>
                  )}
                </div>

                <div>
                  <span className="font-bold text-teal-300 block mb-1 uppercase tracking-wider text-[10px]">Fastest Sellers:</span>
                  {aiReport.suggestedFastMoving.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-gray-300 font-semibold">
                      {aiReport.suggestedFastMoving.map((p, i) => <li key={i} className="truncate">{p}</li>)}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic font-semibold">Data pending sales...</span>
                  )}
                </div>
              </div>

              {/* Spending Warnings */}
              {aiReport.spendingWarning && (
                <div className="text-[11px] text-orange-300 bg-orange-500/5 p-2 rounded-xl border border-orange-500/10 flex items-start gap-1.5 font-semibold leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{aiReport.spendingWarning}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAIN DATA TABLES & GRAPH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart (Column 1-8) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Sales vs Expenses Trend</h3>
            <button
              id="report-export-text-btn"
              onClick={handleExportTextReport}
              className="h-8 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100/50 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download TXT Summary
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            {dailyPerformanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPerformanceChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Sales" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
                No performance records for selected date intervals.
              </div>
            )}
          </div>
        </div>

        {/* Staff leaderboard score Panel (Column 9-12) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
          <div className="border-b border-gray-50 pb-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              Staff Leaderboard
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">Sales performance by active shop personnel.</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[220px]">
            {staffPerformance.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-gray-800 truncate leading-tight">{item.name}</h4>
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider mt-0.5 inline-block">
                      {item.role}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-800">{currency}{item.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">{item.transactions} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP & WORST PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-teal-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Best Selling Products
          </h3>
          <div className="space-y-2.5">
            {productPerformance.best.length > 0 ? (
              productPerformance.best.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                    {index + 1}. {item.name}
                  </span>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md">
                    {item.quantity} sold
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic font-semibold">No sales transactions logged yet.</p>
            )}
          </div>
        </div>

        {/* Least Selling Products */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-red-500 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4" /> Least Selling Products
          </h3>
          <div className="space-y-2.5">
            {productPerformance.best.length > 0 ? (
              productPerformance.worst.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                    {index + 1}. {item.name}
                  </span>
                  <span className="text-xs font-bold text-gray-650 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {item.quantity} sold
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic font-semibold">No sales transactions logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED TRANSACTION LOGS (TABBED VIEW) */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
        
        {/* Tab Header Buttons */}
        <div className="flex border-b border-gray-100 p-1 bg-gray-50/80 rounded-2xl max-w-sm">
          <button
            type="button"
            onClick={() => setActiveLogTab('sales')}
            className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeLogTab === 'sales'
                ? 'bg-teal-900 text-white shadow-sm'
                : 'text-gray-550 hover:text-gray-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Sales History ({filteredSales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveLogTab('expenses')}
            className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeLogTab === 'expenses'
                ? 'bg-teal-900 text-white shadow-sm'
                : 'text-gray-550 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Shop Expenses ({filteredExpenses.length})
          </button>
        </div>

        {/* LOG CONTENT PANELS */}
        {activeLogTab === 'sales' ? (
          <div className="space-y-4">
            {/* Sales Log Header with filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-50 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-teal-600" />
                  Recorded Sales History
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold">
                  Detailed checkout receipts and payment methods logged for this interval.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2 self-start lg:self-auto">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Interval Sales:</span>
                <span className="text-sm font-black text-emerald-700">
                  {currency}{totals.totalSales.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sales Search and Payment filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="relative sm:col-span-8">
                <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search receipt #, product name, salesperson..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-teal-500 focus:bg-white text-xs font-semibold text-gray-700 transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value as any)}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-teal-500 focus:bg-white text-xs font-semibold text-gray-750 transition-all"
                >
                  <option value="all">All Payments</option>
                  <option value="cash">💵 Cash</option>
                  <option value="transfer">🏦 Transfer</option>
                  <option value="pos">💳 Card / POS</option>
                  <option value="credit">⏳ Credit</option>
                </select>
              </div>
            </div>

            {searchedSales.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-2">Receipt #</th>
                        <th className="py-3 px-2">Date & Time</th>
                        <th className="py-3 px-2">Items Bought</th>
                        <th className="py-3 px-2">Logged By</th>
                        <th className="py-3 px-2">Payment</th>
                        <th className="py-3 px-2 text-right">Total Paid</th>
                        <th className="py-3 px-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {searchedSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-3 px-2 text-xs font-extrabold text-teal-800">
                            {sale.receiptNumber}
                          </td>
                          <td className="py-3 px-2 text-[11px] font-bold text-gray-500">
                            {sale.date} <span className="text-[10px] text-gray-400 font-semibold">{sale.time}</span>
                          </td>
                          <td className="py-3 px-2 text-xs max-w-[220px] truncate font-bold text-gray-700">
                            {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                          </td>
                          <td className="py-3 px-2 text-xs font-semibold text-gray-500">
                            {sale.salespersonName}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              sale.paymentMethod === 'cash'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : sale.paymentMethod === 'transfer'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : sale.paymentMethod === 'pos'
                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs font-black text-teal-600 text-right">
                            {currency}{sale.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                title="View details"
                                onClick={() => {
                                  setSelectedReceiptSale(sale);
                                  setShowReceiptModal(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {onVoidSale && (
                                <button
                                  type="button"
                                  title="Void sale (restores inventory)"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to void sale receipt ${sale.receiptNumber}?\nThis will automatically restore product stock quantities.`)) {
                                      onVoidSale(sale.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                                >
                                  <Undo2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="block md:hidden space-y-3.5">
                  {searchedSales.map((sale) => (
                    <div key={sale.id} className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs font-black text-teal-900">{sale.receiptNumber}</span>
                          <span className="text-[10px] text-gray-400 block font-semibold">{sale.date} at {sale.time}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-teal-600 block">{currency}{sale.totalAmount.toLocaleString()}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider border inline-block mt-1 ${
                            sale.paymentMethod === 'cash'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : sale.paymentMethod === 'transfer'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : sale.paymentMethod === 'pos'
                                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {sale.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="bg-white p-2.5 rounded-xl border border-gray-50 text-xs font-semibold text-gray-700 divide-y divide-gray-50">
                        {sale.items.map((i, index) => (
                          <div key={index} className="flex justify-between py-1 first:pt-0 last:pb-0 gap-2">
                            <span className="truncate max-w-[170px]">{i.productName} <span className="text-gray-400 font-bold text-[10px]">x{i.quantity}</span></span>
                            <span className="text-gray-500 font-bold">{currency}{(i.sellingPrice * i.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-450 font-bold border-t border-gray-100 pt-2.5">
                        <span>Staff: {sale.salespersonName}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceiptSale(sale);
                              setShowReceiptModal(true);
                            }}
                            className="bg-white border border-gray-150 px-2.5 py-1 text-gray-600 rounded-lg hover:bg-gray-50 font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {onVoidSale && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Void sale ${sale.receiptNumber}? This restores item quantities.`)) {
                                  onVoidSale(sale.id);
                                }
                              }}
                              className="bg-rose-50 border border-rose-100 px-2.5 py-1 text-rose-600 rounded-lg hover:bg-rose-100 font-extrabold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Undo2 className="w-3 h-3" /> Void
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-100 rounded-2xl bg-gray-50/40">
                <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold italic">No sales found matching current query or filters.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Expense Log Header with filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-50 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  Recorded Expenses Log
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold">
                  Itemized list of shop spending (salaries, fuel, rent, bills) for the selected interval.
                </p>
              </div>
              <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl flex items-center gap-2 self-start lg:self-auto">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Interval Expenses:</span>
                <span className="text-sm font-black text-rose-600">
                  {currency}{totals.totalExpenses.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Expenses Search and Category filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="relative sm:col-span-8">
                <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search description, logged by, category..."
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-teal-500 focus:bg-white text-xs font-semibold text-gray-700 transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-teal-500 focus:bg-white text-xs font-semibold text-gray-750 transition-all"
                >
                  <option value="all">All Categories</option>
                  <option value="transport">🚗 Transport</option>
                  <option value="fuel">⛽ Fuel</option>
                  <option value="electricity">⚡ Electricity</option>
                  <option value="salary">👥 Staff Salary</option>
                  <option value="rent">🏢 Rent</option>
                  <option value="tax">🏛️ Taxes / Levies</option>
                  <option value="repairs">🔧 Repairs</option>
                  <option value="miscellaneous">📦 Miscellaneous</option>
                </select>
              </div>
            </div>

            {searchedExpenses.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Category</th>
                        <th className="py-3 px-2">Description / Notes</th>
                        <th className="py-3 px-2">Recorded By</th>
                        <th className="py-3 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {searchedExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-3 px-2 text-xs font-bold text-gray-500">
                            {exp.date}
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-[9px] bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wide">
                              {getCategoryLabel(exp.category)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs font-bold text-gray-800">
                            {exp.description}
                          </td>
                          <td className="py-3 px-2 text-xs font-semibold text-gray-500">
                            {exp.salespersonName}
                          </td>
                          <td className="py-3 px-2 text-xs font-black text-red-600 text-right">
                            -{currency}{exp.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="block md:hidden space-y-3">
                  {searchedExpenses.map((exp) => (
                    <div key={exp.id} className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wide">
                            {getCategoryLabel(exp.category)}
                          </span>
                          <h4 className="font-bold text-xs text-gray-800 mt-1.5 leading-normal">{exp.description}</h4>
                        </div>
                        <span className="text-xs font-black text-red-600 shrink-0">
                          -{currency}{exp.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-450 font-semibold pt-1 border-t border-gray-100">
                        <span>Logged by: {exp.salespersonName}</span>
                        <span>{exp.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-100 rounded-2xl bg-gray-50/40">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold italic">No expenses match your search filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* READ-ONLY VIEW RECEIPT POPUP MODAL */}
      {showReceiptModal && selectedReceiptSale && (
        <div className="fixed inset-0 bg-teal-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full border border-gray-100 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header Close */}
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Shop Invoice Receipt
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceiptSale(null);
                }}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center cursor-pointer transition-all"
              >
                &times;
              </button>
            </div>

            {/* Receipt visual content */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black tracking-tight text-gray-805 uppercase">{businessName}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transaction receipt</p>
            </div>

            {/* Meta lines */}
            <div className="bg-gray-50/60 p-3.5 rounded-2xl text-xs space-y-1 text-gray-600 border border-gray-100">
              <div className="flex justify-between">
                <span className="font-semibold">Receipt Number:</span>
                <span className="font-extrabold text-gray-850">{selectedReceiptSale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date & Time:</span>
                <span className="font-extrabold text-gray-850">{selectedReceiptSale.date} {selectedReceiptSale.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Recorded By:</span>
                <span className="font-extrabold text-gray-850">{selectedReceiptSale.salespersonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span className="font-extrabold text-gray-850 uppercase text-teal-600">{selectedReceiptSale.paymentMethod}</span>
              </div>
              {selectedReceiptSale.notes && (
                <div className="pt-1.5 border-t border-gray-200/50 text-left mt-1.5">
                  <span className="font-bold text-[10px] text-gray-400 block uppercase">Notes:</span>
                  <p className="text-[11px] font-medium text-gray-500 italic mt-0.5">{selectedReceiptSale.notes}</p>
                </div>
              )}
            </div>

            {/* Items separator */}
            <div className="border-t border-dashed border-gray-200 py-1"></div>

            {/* Items grid */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-wider pb-1">
                <span>Product Item</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-20 text-right">Total</span>
              </div>
              
              <div className="divide-y divide-gray-50 max-h-[160px] overflow-y-auto pr-1">
                {selectedReceiptSale.items.map((i, index) => (
                  <div key={index} className="flex justify-between py-1.5 text-xs text-gray-700 font-semibold items-center">
                    <span className="truncate max-w-[150px]">{i.productName}</span>
                    <span className="w-16 text-center font-bold text-gray-500">x{i.quantity}</span>
                    <span className="w-20 text-right font-black text-gray-850">{currency}{(i.sellingPrice * i.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom calculation border */}
            <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>Total Items Sold:</span>
                <span>{selectedReceiptSale.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-teal-950 pt-1.5 border-t border-gray-100">
                <span>Grand Total Amount:</span>
                <span>{currency}{selectedReceiptSale.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer buttons copy / print */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
              <button
                type="button"
                onClick={() => {
                  const itemsText = selectedReceiptSale.items.map(i => `${i.productName} (x${i.quantity}) - ${currency}${i.sellingPrice * i.quantity}`).join('\n');
                  const text = `=== ${businessName.toUpperCase()} ===\nReceipt: ${selectedReceiptSale.receiptNumber}\nDate: ${selectedReceiptSale.date} ${selectedReceiptSale.time}\nStaff: ${selectedReceiptSale.salespersonName}\n-------------------------\n${itemsText}\n-------------------------\nTotal: ${currency}${selectedReceiptSale.totalAmount.toLocaleString()}\nPayment: ${selectedReceiptSale.paymentMethod.toUpperCase()}`;
                  navigator.clipboard.writeText(text);
                  alert("Receipt copied to clipboard!");
                }}
                className="h-10 border border-gray-150 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Copy className="w-4 h-4 text-gray-450" /> Copy Text
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Connecting to receipt printer... Print layout completed!");
                }}
                className="h-10 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-teal-200" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
