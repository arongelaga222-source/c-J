"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="p-6 sm:p-8 min-h-screen lg:h-screen flex flex-col bg-white text-[#111111] font-sans">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6 border-b border-[#cacacb] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#707072] block mb-1">
            Point of Sale
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Cashier Register
          </h1>
        </div>

        {/* Search Pill */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707072]" />
          <Input 
            placeholder="Search items or gear..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-full bg-[#f5f5f5] text-xs text-[#111111] placeholder:text-[#707072] border border-transparent focus-visible:bg-white focus-visible:border-[#111111]"
          />
        </div>
      </div>

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Left Column: Product Catalog */}
        <div className="flex-1 flex flex-col border border-[#cacacb] p-6 overflow-hidden bg-white">
          
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-[#cacacb]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-8 px-4 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#111111] border-[#cacacb] hover:border-[#111111]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.id === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`cursor-pointer transition-all border p-4 flex flex-col justify-between min-h-[140px] ${
                      inCart
                        ? "border-[#111111] bg-[#f5f5f5]"
                        : "border-[#cacacb] bg-white hover:border-[#111111]"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#707072]">
                        {product.category}
                      </span>
                      <h3 className="font-semibold text-sm text-[#111111] line-clamp-2 pt-0.5 leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-baseline justify-between pt-3 border-t border-[#e5e5e5]">
                      <span className="text-sm font-bold text-[#111111]">
                        ₱{Number(product.price).toFixed(2)}
                      </span>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-[#111111] text-white text-[11px] font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Register Cart Panel */}
        <div className="w-full lg:w-96 flex flex-col border border-[#cacacb] bg-white">
          
          <div className="p-4 border-b border-[#cacacb] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#111111]" />
              <h2 className="font-bold text-[#111111] text-sm uppercase tracking-tight">Current Order</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#111111] border border-[#cacacb]">
                {totalItemsCount}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-[#707072] hover:text-[#d30005] underline font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#707072] space-y-2 py-12">
                <Package className="w-8 h-8 text-[#cacacb]" />
                <p className="text-xs font-semibold text-[#111111]">Order is empty</p>
                <p className="text-[11px] text-[#707072]">Select items on the catalog to begin</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-[#e5e5e5] bg-[#f5f5f5]"
                >
                  <div className="space-y-0.5 max-w-[160px]">
                    <p className="font-semibold text-xs text-[#111111] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#707072]">
                      ₱{Number(item.price).toFixed(2)} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-full border border-[#cacacb] bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#707072] hover:text-[#111111]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-[#111111]">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#707072] hover:text-[#111111]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-[#707072] hover:text-[#d30005]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector & Charge */}
          <div className="p-4 bg-white border-t border-[#cacacb] space-y-4">
            
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#707072] block">
                Payment Tender
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
                      className={`h-11 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border cursor-pointer ${
                        isSelected
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-[#111111] border-[#cacacb] hover:border-[#111111]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{m.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Due & Primary Action */}
            <div className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between border-t border-[#cacacb] pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#707072]">Total Due</span>
                <span className="text-2xl font-bold text-[#111111]">₱{cartTotal.toFixed(2)}</span>
              </div>

              <Button
                size="lg"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full h-12 bg-[#111111] text-white hover:bg-[#222222] font-medium text-sm rounded-full"
              >
                {isProcessing ? "Processing..." : `Charge ₱${cartTotal.toFixed(2)}`}
              </Button>
            </div>

            {/* Receipt Toast */}
            {lastSuccessReceipt && (
              <div className="p-3 border border-[#007d48] bg-white flex items-center justify-between text-xs text-[#007d48]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#007d48]" />
                  <span>Paid ₱{lastSuccessReceipt.amount.toFixed(2)} via {lastSuccessReceipt.method}</span>
                </div>
                <button 
                  onClick={() => setLastSuccessReceipt(null)}
                  className="text-[#707072] hover:text-[#111111]"
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