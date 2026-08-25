"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Banknote, CreditCard, Smartphone } from "lucide-react";
import { processPosTransaction } from "@/app/actions";

type Product = { id: string; name: string; price: number; category: string };
type CartItem = Product & { quantity: number };

export default function CashierClient({ 
  initialProducts 
}: { 
  initialProducts: Product[]; 
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [isProcessing, setIsProcessing] = useState(false);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      await processPosTransaction(cart, cartTotal, paymentMethod);
      alert(`Payment of ₱${cartTotal.toFixed(2)} via ${paymentMethod} successful!`);
      setCart([]);
    } catch (error) {
      alert("Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Point of Sale</h1>
        <p className="text-slate-500">Manage walk-in court fees, gear rentals, and retail items.</p>
      </div>

      {/* Main POS Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Side: Product Grid */}
        <div className="flex-1 bg-white border rounded-xl p-6 overflow-auto shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-slate-800">Quick Add Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors shadow-sm"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center justify-center h-32">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {product.category}
                  </span>
                  <span className="font-bold text-slate-800 leading-tight mb-2">
                    {product.name}
                  </span>
                  <span className="text-emerald-600 font-bold">
                    ₱{product.price.toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Side: Current Cart */}
        <div className="w-[400px] flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Current Order
            </h2>
            <Badge variant="secondary" className="bg-slate-700 text-white border-none">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
            </Badge>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Cart is empty. Select items to add.
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">₱{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-md p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(item)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-5 bg-slate-50 border-t space-y-5">
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant={paymentMethod === "Cash" ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod("Cash")} className={paymentMethod === "Cash" ? "bg-slate-800 text-white" : ""}>
                  <Banknote className="h-4 w-4 mr-1" /> Cash
                </Button>
                <Button variant={paymentMethod === "Card" ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod("Card")} className={paymentMethod === "Card" ? "bg-slate-800 text-white" : ""}>
                  <CreditCard className="h-4 w-4 mr-1" /> Card
                </Button>
                <Button variant={paymentMethod === "E-Wallet" ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod("E-Wallet")} className={paymentMethod === "E-Wallet" ? "bg-slate-800 text-white" : ""}>
                  <Smartphone className="h-4 w-4 mr-1" /> E-Wallet
                </Button>
              </div>
            </div>

            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-emerald-600">₱{cartTotal.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? "Processing..." : `Charge ₱${cartTotal.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}