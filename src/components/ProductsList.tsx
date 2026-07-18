import React, { useState, useMemo } from 'react';
import { Product, StaffMember, StockHistoryLog } from '../types';
import { Search, Plus, RotateCcw, PlusCircle, AlertTriangle, ShieldAlert, Barcode, TrendingUp, Info, HelpCircle } from 'lucide-react';

interface ProductsListProps {
  products: Product[];
  currentStaff: StaffMember;
  currency: string;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onAdjustStock: (productId: string, delta: number, type: 'add' | 'adjust', notes?: string) => void;
  stockHistory: StockHistoryLog[];
}

export default function ProductsList({
  products,
  currentStaff,
  currency,
  onAddProduct,
  onAdjustStock,
  stockHistory
}: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Modals / forms state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<string>("");
  const [adjustNotes, setAdjustNotes] = useState<string>("");
  const [adjustType, setAdjustType] = useState<'add' | 'adjust'>('add'); // 'add' for restock, 'adjust' for subtraction/write-off

  // New product form state
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newBuyingPrice, setNewBuyingPrice] = useState<string>("");
  const [newSellingPrice, setNewSellingPrice] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<string>("");
  const [newLowStockLimit, setNewLowStockLimit] = useState<string>("");
  const [newBarcode, setNewBarcode] = useState<string>("");

  const categories = useMemo(() => {
    const list = products.map(p => p.category);
    return Array.from(new Set(list));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
      const matchCategory = activeCategory ? p.category === activeCategory : true;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCategory || !newBuyingPrice || !newSellingPrice || !newQuantity) return;

    onAddProduct({
      name: newName,
      category: newCategory,
      buyingPrice: parseFloat(newBuyingPrice),
      sellingPrice: parseFloat(newSellingPrice),
      currentQuantity: parseInt(newQuantity),
      lowStockLimit: parseInt(newLowStockLimit) || 10,
      barcode: newBarcode.trim() || undefined
    });

    // Reset fields
    setNewName("");
    setNewCategory("");
    setNewBuyingPrice("");
    setNewSellingPrice("");
    setNewQuantity("");
    setNewLowStockLimit("");
    setNewBarcode("");
    setShowAddModal(false);
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQuantity) return;

    const qty = parseInt(adjustQuantity);
    if (isNaN(qty) || qty <= 0) return;

    // 'add' is positive delta, 'adjust' can be subtraction (writeoff) or just alignment
    const finalDelta = adjustType === 'add' ? qty : -qty;

    onAdjustStock(selectedProduct.id, finalDelta, adjustType, adjustNotes.trim());
    
    setAdjustQuantity("");
    setAdjustNotes("");
    setSelectedProduct(null);
    setShowAdjustModal(false);
  };

  // Permission Gates
  const canAddProduct = currentStaff.role === 'owner' || currentStaff.role === 'manager';
  const canAdjustStock = currentStaff.role === 'owner' || currentStaff.role === 'manager';
  const isSalesperson = currentStaff.role === 'salesperson';

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-24 space-y-6">
      {/* Title block with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <span className="w-3 h-3 bg-teal-600 rounded-full inline-block"></span>
            Inventory & Stock
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Track total stock levels, profit margins, and record adjustments.</p>
        </div>

        {canAddProduct && (
          <button
            id="add-product-modal-trigger"
            onClick={() => setShowAddModal(true)}
            className="h-10 px-5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        )}
      </div>

      {/* Grid containing filters, lists, and history logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main List Section (Column 1-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
            {/* Search + category filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3 text-gray-400 w-4 h-4" />
                <input
                  id="inv-search-input"
                  type="text"
                  placeholder="Search by name, category, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 focus:bg-white text-xs font-semibold text-gray-700 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Category selector */}
              <select
                id="inv-category-select"
                value={activeCategory || ""}
                onChange={(e) => setActiveCategory(e.target.value || null)}
                className="h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-bold text-gray-600 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Products Table/List */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Product Info</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">{isSalesperson ? "Selling Price" : "Cost / Sell"}</th>
                    {!isSalesperson && <th className="py-3 px-2">Margin</th>}
                    <th className="py-3 px-2 text-center">Qty / Alert</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const marginPercent = Math.round(((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100);
                      const isLowStock = p.currentQuantity <= p.lowStockLimit;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors text-xs font-medium">
                          {/* Info */}
                          <td className="py-4 px-2 min-w-[150px]">
                            <div className="font-bold text-gray-800">{p.name}</div>
                            {p.barcode && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-450 mt-1">
                                <Barcode className="w-3 h-3 text-gray-400" />
                                {p.barcode}
                              </div>
                            )}
                          </td>
                          {/* Category */}
                          <td className="py-4 px-2">
                            <span className="text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-0.5 rounded-full">
                              {p.category}
                            </span>
                          </td>
                          {/* Buying/Selling */}
                          <td className="py-4 px-2">
                            {!isSalesperson && (
                              <div className="text-[10px] font-bold text-gray-400">
                                Buy: {currency}{p.buyingPrice.toLocaleString()}
                              </div>
                            )}
                            <div className="text-xs font-black text-teal-600 mt-0.5">
                              {isSalesperson ? "" : "Sell: "}{currency}{p.sellingPrice.toLocaleString()}
                            </div>
                          </td>
                          {/* Profit margin */}
                          {!isSalesperson && (
                            <td className="py-4 px-2">
                              <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +{marginPercent}%
                              </span>
                            </td>
                          )}
                          {/* Quantity */}
                          <td className="py-4 px-2 text-center">
                            <div className={`text-xs font-black ${
                              p.currentQuantity === 0 ? "text-red-500" : isLowStock ? "text-orange-500" : "text-gray-700"
                            }`}>
                              {p.currentQuantity} units
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold mt-0.5">
                              Limit: {p.lowStockLimit}
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="py-4 px-2 text-right">
                            {canAdjustStock ? (
                              <button
                                id={`adjust-stock-btn-${p.id}`}
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setShowAdjustModal(true);
                                }}
                                className="h-7 px-3 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Adjust Stock
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic font-medium select-none">Read-only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 font-bold text-xs">
                        No products match selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3.5 mt-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const marginPercent = Math.round(((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100);
                  const isLowStock = p.currentQuantity <= p.lowStockLimit;
                  return (
                    <div key={p.id} className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 hover:bg-white transition-all space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-gray-855 leading-snug">{p.name}</h4>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="text-[9px] font-black bg-white text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {p.category}
                            </span>
                            {p.barcode && (
                              <span className="text-[9px] font-bold text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Barcode className="w-2.5 h-2.5" /> {p.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          p.currentQuantity === 0 
                            ? 'bg-red-100 text-red-600 animate-pulse' 
                            : isLowStock 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-teal-50 text-teal-700'
                        }`}>
                          {p.currentQuantity === 0 ? 'Out' : isLowStock ? 'Low' : 'In Stock'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-gray-50 font-bold">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">Pricing</span>
                          <span className="text-teal-600 font-extrabold">{currency}{p.sellingPrice.toLocaleString()}</span>
                          {!isSalesperson && (
                            <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Cost: {currency}{p.buyingPrice.toLocaleString()}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">Availability</span>
                          <span className="text-gray-750 font-extrabold">{p.currentQuantity} units</span>
                          <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Limit: {p.lowStockLimit}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        {!isSalesperson && (
                          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <TrendingUp className="w-3 h-3" /> +{marginPercent}% Markup
                          </span>
                        )}
                        {canAdjustStock ? (
                          <button
                            id={`adjust-stock-btn-mobile-${p.id}`}
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowAdjustModal(true);
                            }}
                            className="h-8 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-[10px] font-extrabold transition-all inline-flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Adjust Stock
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic font-medium select-none ml-auto">Read-only</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 font-bold text-xs bg-gray-50/40 border border-dashed border-gray-150 rounded-[24px]">
                  No products match selected filters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adjustments audit log Right Panel (Column 9-12) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4 h-[550px] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-teal-600" />
                Inventory Audit Logs
              </h3>
              <p className="text-[11px] text-gray-400 mb-4 font-semibold">Every single addition or deduction is tracked below for safety.</p>

              <div className="overflow-y-auto h-[410px] space-y-3 pr-1">
                {stockHistory.length > 0 ? (
                  stockHistory.map((log) => (
                    <div
                      key={log.id}
                      className="border-l-2 border-teal-500 pl-3 py-2 bg-gray-50 p-3 rounded-r-2xl border-y border-r border-gray-100 space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                        <span>{log.date} at {log.time}</span>
                        <span className={`font-bold uppercase px-1.5 py-0.5 rounded text-[9px] ${
                          log.type === 'add' ? 'bg-emerald-50 text-emerald-700' : log.type === 'sale' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {log.type === 'add' ? 'Restocked' : log.type === 'sale' ? 'Sold' : 'Adjusted'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-800">{log.productName}</h4>
                      <div className="text-[10px] font-bold flex gap-2">
                        <span className={log.changeQuantity > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                          Qty: {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity}
                        </span>
                        <span className="text-gray-400">Bal: {log.previousQuantity} &rarr; {log.newQuantity}</span>
                      </div>
                      <div className="text-[9px] text-gray-450 font-bold mt-0.5">
                        Log by: <strong className="text-gray-650">{log.salespersonName}</strong>
                      </div>
                      {log.notes && (
                        <p className="text-[9px] text-gray-450 italic bg-white p-1.5 rounded border border-gray-100 mt-1">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                    No logs recorded. Any changes to stock levels will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD PRODUCT FORM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 relative border border-gray-100 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Create New Product</h3>
            <p className="text-xs text-gray-400 mb-5 font-semibold">Add a new item to your local ShopLedger database catalog.</p>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Product Name *</label>
                <input
                  id="add-p-name"
                  type="text"
                  required
                  placeholder="e.g. Peak Milk Powder Sachet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Category *</label>
                <input
                  id="add-p-cat"
                  type="text"
                  required
                  placeholder="e.g. Groceries, Drinks, Toiletries"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              {/* Buying / Selling Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Buying Price *</label>
                  <input
                    id="add-p-buy"
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 150"
                    value={newBuyingPrice}
                    onChange={(e) => setNewBuyingPrice(e.target.value)}
                    className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Selling Price *</label>
                  <input
                    id="add-p-sell"
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 200"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                  />
                </div>
              </div>

              {/* Quantity / Low Stock limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Starting Stock Qty *</label>
                  <input
                    id="add-p-qty"
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 50"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Low Stock Limit *</label>
                  <input
                    id="add-p-limit"
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={newLowStockLimit}
                    onChange={(e) => setNewLowStockLimit(e.target.value)}
                    className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                  />
                </div>
              </div>

              {/* Barcode Option */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-gray-450" /> Barcode (Optional)
                </label>
                <input
                  id="add-p-barcode"
                  type="text"
                  placeholder="Scan or enter barcode numbers"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  id="add-p-cancel-btn"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="add-p-save-btn"
                  type="submit"
                  className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST STOCK LEVEL */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 relative border border-gray-100 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Adjust Stock Quantity</h3>
            <p className="text-xs text-gray-400 mb-4 font-semibold">
              Manually modify inventory levels for <strong className="text-gray-700 font-bold">{selectedProduct.name}</strong>.
            </p>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
              {/* Type selection: Add vs Adjust subtraction */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="adjust-type-add"
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`h-10 rounded-full border font-bold text-xs transition-all cursor-pointer ${
                      adjustType === 'add'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-850'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Add / Restock (+)
                  </button>
                  <button
                    id="adjust-type-adjust"
                    type="button"
                    onClick={() => setAdjustType('adjust')}
                    className={`h-10 rounded-full border font-bold text-xs transition-all cursor-pointer ${
                      adjustType === 'adjust'
                        ? 'border-red-500 bg-red-50 text-red-850'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Deduct / Damage (-)
                  </button>
                </div>
              </div>

              {/* Adjust Amount */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Quantity amount *</label>
                <input
                  id="adjust-qty-input"
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 10"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                />
                <div className="text-[10px] text-gray-400 mt-1.5 flex justify-between font-bold">
                  <span>Current: {selectedProduct.currentQuantity} units</span>
                  <span>Estimated: {
                    selectedProduct.currentQuantity + (adjustType === 'add' ? (parseInt(adjustQuantity) || 0) : -(parseInt(adjustQuantity) || 0))
                  } units</span>
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Reason / Logs Notes *</label>
                <input
                  id="adjust-notes-input"
                  type="text"
                  required
                  placeholder={adjustType === 'add' ? "e.g. Restock from supplier Lagos bulk market" : "e.g. Damage during offloading / rats writeoff"}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-750"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  id="adjust-cancel-btn"
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setShowAdjustModal(false);
                  }}
                  className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="adjust-save-btn"
                  type="submit"
                  className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  Apply & Log Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
