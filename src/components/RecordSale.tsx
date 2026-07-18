import React, { useState, useMemo } from 'react';
import { Product, SaleItem, Sale, StaffMember } from '../types';
import { Search, ShoppingBag, Plus, Minus, Trash2, CheckCircle, Ticket, Share2, Printer, X, CreditCard, Landmark, Banknote, HelpCircle } from 'lucide-react';

interface RecordSaleProps {
  products: Product[];
  currentStaff: StaffMember;
  taxEnabled: boolean;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  onCompleteSale: (sale: Omit<Sale, 'id'>) => void;
}

export default function RecordSale({
  products,
  currentStaff,
  taxEnabled,
  taxRate,
  currency,
  receiptFooter,
  onCompleteSale
}: RecordSaleProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos' | 'credit'>('cash');
  const [saleNotes, setSaleNotes] = useState<string>("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Filter products by name or barcode
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) => 
        p.name.toLowerCase().includes(query) || 
        (p.barcode && p.barcode.includes(query)) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Quick categories for product catalog selection
  const quickCategories = useMemo(() => {
    const cats = products.map((p) => p.category);
    return Array.from(new Set(cats));
  }, [products]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryProducts = useMemo(() => {
    if (searchQuery.trim()) return [];
    if (!activeCategory) return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.currentQuantity <= 0) {
      alert(`Oops! ${product.name} is out of stock.`);
      return;
    }
    
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentQuantity) {
          alert(`Cannot add more than available stock (${product.currentQuantity} units).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Clear search query after tap to make flow extremely fast (<10s)
    setSearchQuery("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.currentQuantity) {
              alert(`Cannot exceed available stock of ${item.product.currentQuantity} units.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const taxAmount = taxEnabled ? (subtotal * taxRate) / 100 : 0;
  const total = subtotal + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const receiptNo = `SL-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      buyingPrice: item.product.buyingPrice,
      sellingPrice: item.product.sellingPrice
    }));

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      salespersonId: currentStaff.id,
      salespersonName: currentStaff.name,
      paymentMethod,
      items: saleItems,
      totalAmount: total,
      receiptNumber: receiptNo,
      notes: saleNotes.trim() || undefined
    };

    onCompleteSale(newSale);
    setCompletedSale(newSale);
    setCart([]);
    setSaleNotes("");
    setMobileTab('catalog');
  };

  const copyReceiptText = () => {
    if (!completedSale) return;
    const itemsText = completedSale.items.map(i => `${i.productName} (x${i.quantity}) - ${currency}${i.sellingPrice * i.quantity}`).join('\n');
    const fullText = `=== ShopLedger Receipt ===\nReceipt: ${completedSale.receiptNumber}\nDate: ${completedSale.date} ${completedSale.time}\nStaff: ${completedSale.salespersonName}\n-------------------------\n${itemsText}\n-------------------------\nTotal: ${currency}${completedSale.totalAmount}\nPayment: ${completedSale.paymentMethod.toUpperCase()}\n${receiptFooter}`;
    navigator.clipboard.writeText(fullText);
    alert("Receipt text copied to clipboard!");
  };

  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-4 animate-fade-in pb-24 max-w-7xl mx-auto">
      {/* Tab Switcher - Only visible on Mobile */}
      <div className="lg:hidden flex bg-white p-1 rounded-2xl border border-gray-100 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-teal-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-teal-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Basket Cart ({cartItemCount})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Product Selection Left Panel (Column 1-7) */}
        <div className={`lg:col-span-7 space-y-5 ${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-teal-600 rounded-full inline-block"></span>
              Products Catalog
            </h2>

            {/* Search box with Instant results */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                id="sale-search-input"
                type="text"
                placeholder="Search product name, category, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 focus:bg-white text-xs font-semibold text-gray-700 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-3.5 text-gray-400 font-bold hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Categories Quick Tags */}
            <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar mt-3">
              <button
                id="cat-tag-all"
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === null
                    ? "bg-teal-900 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                }`}
              >
                All Products
              </button>
              {quickCategories.map((cat) => (
                <button
                  id={`cat-tag-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearchQuery(""); // Clear search to view category
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat && !searchQuery
                      ? "bg-teal-900 text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic products list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 overflow-y-auto max-h-[500px] pr-1">
            {searchQuery.trim() ? (
              // Search query active list
              filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <button
                    id={`product-card-search-${p.id}`}
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-white hover:border-teal-500 border border-gray-100 p-3 sm:p-4 rounded-2xl sm:rounded-[24px] text-left transition-all hover:scale-[1.01] shadow-sm flex flex-col justify-between h-36 sm:h-44 cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[9px] sm:text-[10px] bg-gray-50 text-gray-500 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider truncate max-w-[80px]">
                          {p.category}
                        </span>
                        {p.currentQuantity <= p.lowStockLimit && (
                          <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            p.currentQuantity === 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"
                          }`}>
                            {p.currentQuantity === 0 ? "Out" : "Low"}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-850 tracking-tight mt-2.5 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>
                    <div className="mt-2.5 flex justify-between items-end border-t border-gray-50 pt-2.5">
                      <div>
                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Price</p>
                        <p className="text-xs sm:text-sm font-black text-teal-600">{currency}{p.sellingPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Stock</p>
                        <p className={`text-[11px] sm:text-xs font-bold ${p.currentQuantity === 0 ? "text-red-500" : "text-gray-600"}`}>{p.currentQuantity}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-200 rounded-[32px] p-6">
                  <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-500">No products match search.</p>
                  <p className="text-xs text-gray-400 mt-1">Try spelling correctly or check active stock.</p>
                </div>
              )
            ) : (
              // Catalog/category grid
              categoryProducts.map((p) => (
                <button
                  id={`product-card-catalog-${p.id}`}
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white hover:border-teal-500 border border-gray-100 p-3 sm:p-4 rounded-2xl sm:rounded-[24px] text-left transition-all hover:scale-[1.01] shadow-sm flex flex-col justify-between h-36 sm:h-44 cursor-pointer"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[9px] sm:text-[10px] bg-gray-50 text-gray-500 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider truncate max-w-[80px]">
                        {p.category}
                      </span>
                      {p.currentQuantity <= p.lowStockLimit && (
                        <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          p.currentQuantity === 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"
                        }`}>
                          {p.currentQuantity === 0 ? "Out" : "Low"}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-850 tracking-tight mt-2.5 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-2.5 flex justify-between items-end border-t border-gray-50 pt-2.5">
                    <div>
                      <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Price</p>
                      <p className="text-xs sm:text-sm font-black text-teal-600">{currency}{p.sellingPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Stock</p>
                      <p className={`text-[11px] sm:text-xs font-bold ${p.currentQuantity === 0 ? "text-red-500" : "text-gray-600"}`}>{p.currentQuantity}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart & Checkout Right Panel (Column 8-12) */}
        <div className={`lg:col-span-5 ${mobileTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col h-[520px] justify-between p-5 sm:p-6">
          {/* Header */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
              <h3 className="font-bold text-gray-900 text-md flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
                Basket Cart
              </h3>
              <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>

            {/* Cart list scroll area */}
            <div className="overflow-y-auto h-[220px] pr-1 space-y-2.5">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:bg-gray-100/40 transition-all"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="font-bold text-xs text-gray-800 truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                        {currency}{item.product.sellingPrice} &times; {item.quantity}
                      </p>
                    </div>

                    {/* Quantity Selector buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        id={`cart-qty-minus-${item.product.id}`}
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 bg-white hover:bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100 text-gray-600 active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-gray-700 w-4 text-center">{item.quantity}</span>
                      <button
                        id={`cart-qty-plus-${item.product.id}`}
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-7 h-7 bg-white hover:bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100 text-gray-600 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        id={`cart-remove-${item.product.id}`}
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl flex items-center justify-center active:scale-95 transition-all ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-8 text-center text-gray-400">
                  <ShoppingBag className="w-10 h-10 text-gray-300 stroke-1 mb-2" />
                  <p className="text-xs font-bold text-gray-400">Your basket is empty</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Select items from the catalog.</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment method, notes, totals and finalize buttons */}
          <div className="border-t border-gray-100 pt-4 space-y-3.5">
            {/* Payment Methods Choice */}
            {cart.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'cash', label: 'Cash', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                      { id: 'transfer', label: 'Transfer', color: 'border-blue-500 bg-blue-50 text-blue-850' },
                      { id: 'pos', label: 'POS Card', color: 'border-teal-500 bg-teal-50 text-teal-850' },
                      { id: 'credit', label: 'Credit', color: 'border-amber-500 bg-amber-50 text-amber-850' }
                    ] as const
                  ).map((m) => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        id={`payment-btn-${m.id}`}
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`h-9 rounded-xl border flex flex-col items-center justify-center font-bold text-[10px] transition-all cursor-pointer ${
                          isSelected 
                            ? `${m.color} scale-[1.03] ring-1 ring-offset-0 ring-current font-bold`
                            : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="leading-none">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sale Notes / Customer Debt Name */}
            {cart.length > 0 && (
              <input
                id="sale-notes-input"
                type="text"
                placeholder={paymentMethod === 'credit' ? "Enter Customer's Debt Ledger Name..." : "Add notes, customer info, etc."}
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-100 h-10 px-3.5 rounded-full outline-none focus:border-teal-500 font-medium"
              />
            )}

            {/* Cost Breakdown */}
            <div className="space-y-1.5 bg-gray-50 p-3 rounded-[20px] border border-gray-100">
              <div className="flex justify-between text-xs font-semibold text-gray-500">
                <span>Subtotal</span>
                <span>{currency}{subtotal.toLocaleString()}</span>
              </div>
              {taxEnabled && (
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>VAT ({taxRate}%)</span>
                  <span>{currency}{taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-gray-800 border-t border-dashed border-gray-200 pt-2">
                <span>Total Due</span>
                <span className="text-sm font-black text-teal-600">{currency}{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Complete Sale CTA button */}
            <button
              id="complete-sale-btn"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full h-12 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                cart.length > 0
                  ? "bg-teal-600 hover:bg-teal-700 active:scale-98 text-white shadow-sm"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Complete Sale • {currency}{total.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* COMPLETED RECEIPT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 flex flex-col justify-between relative border border-gray-100 shadow-xl">
            <button
              id="close-receipt-modal-x"
              onClick={() => setCompletedSale(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Thermal style paper receipt card container */}
            <div className="bg-gray-50 p-5 border border-dashed border-gray-200 rounded-[24px] mt-6 space-y-4 text-xs font-medium text-gray-600">
              {/* Receipt Header */}
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2 font-black text-md">
                  {completedSale.salespersonName.slice(0, 1).toUpperCase()}
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Receipt Invoice</h4>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Order: {completedSale.receiptNumber}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{completedSale.date} at {completedSale.time}</p>
              </div>

              {/* Dotted border separators */}
              <div className="border-t border-dashed border-gray-200"></div>

              {/* Itemized summary */}
              <div className="space-y-1.5">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs text-gray-600">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-bold block truncate text-gray-800">{item.productName}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {currency}{item.sellingPrice} &times; {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-gray-800">{currency}{(item.sellingPrice * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200"></div>

              {/* Pricing Totals */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Channel</span>
                  <span className="font-bold uppercase text-gray-800">{completedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Staff</span>
                  <span className="font-bold text-gray-800">{completedSale.salespersonName}</span>
                </div>
                {completedSale.notes && (
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Notes</span>
                    <span className="font-bold text-gray-800 italic max-w-[150px] truncate">{completedSale.notes}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-gray-900 border-t border-dashed border-gray-200 pt-2 text-md">
                  <span>Grand Total Paid</span>
                  <span className="text-teal-600 font-black">{currency}{completedSale.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200"></div>

              {/* Footer text */}
              <p className="text-[10px] text-gray-400 text-center italic leading-relaxed">
                {receiptFooter}
              </p>
            </div>

            {/* Quick Actions at bottom */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                id="receipt-copy-btn"
                onClick={copyReceiptText}
                className="h-10 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Copy Receipt
              </button>
              <button
                id="receipt-close-btn"
                onClick={() => setCompletedSale(null)}
                className="h-10 bg-teal-600 hover:bg-teal-700 rounded-full text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom action bar for Mobile when in Catalog tab and has items */}
      {mobileTab === 'catalog' && cartItemCount > 0 && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 bg-teal-950 text-white p-4 rounded-3xl shadow-xl border border-teal-850 flex items-center justify-between z-40 animate-fade-in">
          <div className="flex flex-col">
            <span className="text-[10px] text-teal-300 font-extrabold uppercase tracking-wider">Basket Total</span>
            <span className="text-sm font-black text-white">{currency}{total.toLocaleString()} ({cartItemCount} items)</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="bg-white hover:bg-gray-50 text-teal-950 px-4 py-2.5 rounded-full font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Go to Cart &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
