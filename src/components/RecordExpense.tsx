import React, { useState, useMemo } from 'react';
import { ExpenseCategory, StaffMember, Expense } from '../types';
import { 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Car, 
  Zap, 
  Flame, 
  User, 
  Home, 
  Hammer, 
  ShieldAlert, 
  Award, 
  Trash2, 
  Search, 
  Filter 
} from 'lucide-react';

interface RecordExpenseProps {
  currentStaff: StaffMember;
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onDelete?: (id: string) => void;
  currency: string;
  expenses: Expense[];
}

export default function RecordExpense({ currentStaff, onSave, onDelete, currency, expenses }: RecordExpenseProps) {
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("miscellaneous");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");

  const categories: { value: ExpenseCategory; label: string; icon: any; color: string }[] = [
    { value: 'transport', label: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
    { value: 'fuel', label: 'Fuel', icon: Flame, color: 'bg-amber-100 text-amber-600' },
    { value: 'electricity', label: 'Electricity', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
    { value: 'salary', label: 'Staff Salary', icon: User, color: 'bg-emerald-100 text-emerald-600' },
    { value: 'rent', label: 'Rent', icon: Home, color: 'bg-purple-100 text-purple-600' },
    { value: 'tax', label: 'Taxes / Levies', icon: ShieldAlert, color: 'bg-rose-100 text-rose-600' },
    { value: 'repairs', label: 'Repairs', icon: Hammer, color: 'bg-orange-100 text-orange-600' },
    { value: 'miscellaneous', label: 'Miscellaneous', icon: Award, color: 'bg-slate-100 text-slate-600' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onSave({
      amount: parseFloat(amount),
      category,
      description: description.trim() || `${category.charAt(0).toUpperCase() + category.slice(1)} Expense`,
      date,
      salespersonId: currentStaff.id,
      salespersonName: currentStaff.name
    });

    setSuccess(true);
    setAmount("");
    setDescription("");
    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  const filteredExpenses = useMemo(() => {
    let list = expenses || [];
    if (selectedFilterCategory !== 'all') {
      list = list.filter(e => e.category === selectedFilterCategory);
    }
    if (searchTerm.trim() !== '') {
      const s = searchTerm.toLowerCase();
      list = list.filter(e => 
        e.description.toLowerCase().includes(s) || 
        e.salespersonName.toLowerCase().includes(s) ||
        e.amount.toString().includes(s)
      );
    }
    return list;
  }, [expenses, selectedFilterCategory, searchTerm]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-2.5">
              <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
              Record Expense
            </h2>
            <p className="text-xs text-gray-500 font-medium">Log shop spending like generator fuel, transport, levies, or rent instantly.</p>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 border border-emerald-100 animate-bounce">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm font-semibold">Expense logged successfully!</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount field with giant digits */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Spent Amount</label>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-gray-400">{currency}</span>
                <input
                  id="expense-amount-input"
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-3xl font-black bg-transparent text-gray-800 outline-none placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            {/* Category quick selectors */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      id={`expense-cat-${cat.value}`}
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected 
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-sm scale-[1.02]' 
                          : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mb-1.5 ${isSelected ? 'bg-red-500 text-white' : cat.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold tracking-tight truncate w-full">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description field */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Description / Notes
              </label>
              <input
                id="expense-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Bought fuel from Total station"
                className="w-full text-xs font-semibold bg-transparent text-gray-700 outline-none mt-1 placeholder:text-gray-400"
              />
            </div>

            {/* Date Selector */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Spent</label>
                <input
                  id="expense-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none mt-1"
                  required
                />
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            {/* Logged by Info */}
            <div className="flex items-center gap-2 px-1 text-[11px] text-gray-400 font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Recording as: <strong className="text-gray-600 font-bold">{currentStaff.name} ({currentStaff.role})</strong></span>
            </div>

            {/* Submit button */}
            <button
              id="expense-submit-btn"
              type="submit"
              className="w-full h-12 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              Save Expense Record
            </button>
          </form>
        </div>

        {/* Right Column: History & Logs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full inline-block"></span>
                Expense Logs History
              </h3>
              <p className="text-[10px] text-gray-400 font-bold">Total entries: {expenses.length}</p>
            </div>
            
            {/* Quick total spending sum */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Recorded Spent</span>
              <span className="text-lg font-black text-red-600">
                {currency}{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 flex items-center">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                id="expense-search-input"
                type="text"
                placeholder="Search description, amount or personnel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none text-xs py-2.5 font-semibold text-gray-750 placeholder:text-gray-400"
              />
            </div>
            
            <div className="relative bg-gray-50 border border-gray-100 rounded-xl px-3 flex items-center min-w-[130px]">
              <Filter className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
              <select
                id="expense-filter-select"
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="w-full bg-transparent outline-none text-[11px] py-2.5 font-bold text-gray-600 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Log list view */}
          <div className="flex-1 max-h-[515px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((exp) => {
                const catObj = categories.find(c => c.value === exp.category) || { icon: Award, color: 'bg-slate-100 text-slate-600', label: 'Miscellaneous' };
                const CategoryIcon = catObj.icon;
                
                return (
                  <div 
                    key={exp.id} 
                    className="flex justify-between items-center bg-gray-50/70 p-3.5 rounded-[20px] border border-gray-100/70 hover:border-red-100 hover:bg-white transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${catObj.color} shadow-sm`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-gray-800 truncate max-w-[180px] sm:max-w-[260px] leading-snug">
                            {exp.description}
                          </h4>
                          <span className="text-[9px] bg-white text-gray-500 font-extrabold px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-wide">
                            {catObj.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-semibold">
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span className="text-gray-500">Logged by: {exp.salespersonName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                      <span className="text-xs font-black text-red-600">
                        -{currency}{exp.amount.toLocaleString()}
                      </span>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(exp.id)}
                          title="Void expense record"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 border border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-gray-50/40">
                <FileText className="w-8 h-8 text-gray-350 mb-2.5 stroke-1" />
                <h4 className="text-xs font-extrabold text-gray-600">No Expense Records</h4>
                <p className="text-[10px] text-gray-400 font-medium max-w-[220px] mt-1 leading-normal">
                  {searchTerm || selectedFilterCategory !== 'all' 
                    ? "No registered expenses match your current search parameters." 
                    : "Track salaries, generator gas, shop levies, and utilities right from here."}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
