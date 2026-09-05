"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Search, 
  Package, 
  CheckCircle2
} from "lucide-react";
import { processPosTransaction } from "@/app/actions";

type Product = { 
  id: string; 
  name: string; 
  price: number; 
  category: string; 
  stock_level?: number;
};

type CartItem = Product & { quantity: number };

export default function CashierClient({ 
  initialProducts 
}: { 
  initialProducts: Product[]; 
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("GCash / QR Ph");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSuccessReceipt, setLastSuccessReceipt] = useState<{ amount: number; method: string } | null>(null);

  const categories = ["All", ...Array.from(new Set(initialProducts.map((p) => p.category)))];

  const filteredProducts = initialProducts.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await processPosTransaction(cart, cartTotal, paymentMethod);
      setLastSuccessReceipt({ amount: cartTotal, method: paymentMethod });
      setCart([]);
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen lg:h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl sm:text-3xl font-black text-white">C&amp;J&apos;s POS Terminal</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Pro shop equipment, paddle rentals, cold beverages, and walk-in court fees.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search items or gear..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-red-500 text-xs"
          />
        </div>
      </div>

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Column: Product Catalog */}
        <div className="flex-1 flex flex-col bg-slate-900/70 border border-slate-800 rounded-3xl p-4 sm:p-5 overflow-hidden backdrop-blur-md">
          
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-400 shadow-md shadow-red-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.id === product.id);
                return (
                  <Card
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`cursor-pointer transition-all duration-200 border rounded-2xl relative group overflow-hidden ${
                      inCart
                        ? "border-red-500 bg-red-950/40 shadow-lg shadow-red-500/10"
                        : "border-slate-800 bg-slate-900/90 hover:border-amber-400/60 hover:bg-slate-800/80"
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4 flex flex-col justify-between min-h-[140px] space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                          {product.category}
                        </span>
                        <h3 className="font-bold text-sm text-white line-clamp-2 pt-1 leading-snug">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-base font-black text-amber-400">
                          ₱{Number(product.price).toFixed(2)}
                        </span>
                        {inCart ? (
                          <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center shadow-md">
                            {inCart.quantity}
                          </span>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Cart Panel */}
        <div className="w-full lg:w-[420px] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Cart Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h2 className="font-black text-white text-base">Current Register</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {totalItemsCount} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-red-400 font-bold transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-10">
                <Package className="w-10 h-10 stroke-1 text-slate-600" />
                <p className="text-sm font-bold text-slate-400">Cart is empty</p>
                <p className="text-xs text-slate-600">Select items on the catalog to begin sale</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/70"
                >
                  <div className="space-y-0.5 max-w-[170px]">
                    <p className="font-bold text-xs text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-amber-400 font-bold">
                      ₱{Number(item.price).toFixed(2)} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector & Checkout */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
            
            {/* Payment Method Options */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Select Tender Type
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "GCash / QR Ph", icon: QrCode },
                  { name: "Cash", icon: Banknote },
                  { name: "Card", icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.name;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setPaymentMethod(m.name)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all border ${
                        isSelected
                          ? "bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-400 shadow-md shadow-red-500/20"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Amount & Charge Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between border-t border-slate-800 pt-3">
                <span className="text-sm font-bold text-slate-400">Total Due</span>
                <span className="text-2xl font-black text-amber-400">₱{cartTotal.toFixed(2)}</span>
              </div>

              <Button
                size="lg"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full h-12 font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/30 rounded-xl disabled:opacity-50"
              >
                {isProcessing ? "Processing Sale..." : `Charge ₱${cartTotal.toFixed(2)}`}
              </Button>
            </div>

            {/* Success Receipt Toast */}
            {lastSuccessReceipt && (
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/40 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Paid ₱{lastSuccessReceipt.amount.toFixed(2)} via {lastSuccessReceipt.method}</span>
                </div>
                <button 
                  onClick={() => setLastSuccessReceipt(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}