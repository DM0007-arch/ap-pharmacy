"use client";
import { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online Payment (Razorpay / UPI)");
  const [orderConfirmation, setOrderConfirmation] = useState("");

  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionStatus, setPrescriptionStatus] = useState("");

  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => {
    const numPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, "")) || 0;
    return total + numPrice * item.quantity;
  }, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const itemsSummary = cart
      .map((i) => `${i.product.name} (x${i.quantity})`)
      .join(", ");

    try {
      const res = await fetch("http://localhost:8000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          items_summary: itemsSummary,
          total_amount: `₹${cartTotal.toFixed(2)}`,
          payment_method: paymentMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderConfirmation(
          `✅ Order #${data.order_id} placed successfully! Our pharmacy team in Kalkaji is preparing your order.`
        );
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
      } else {
        setOrderConfirmation("❌ Failed to place order. Please try again.");
      }
    } catch {
      setOrderConfirmation("❌ Error connecting to checkout server.");
    }
  };

  const handlePrescriptionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionFile) {
      setPrescriptionStatus("Please select a file first.");
      return;
    }

    setPrescriptionStatus("Uploading prescription securely...");
    const formData = new FormData();
    formData.append("file", prescriptionFile);

    try {
      const response = await fetch("http://localhost:8000/prescriptions", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setPrescriptionStatus("✅ Prescription uploaded successfully! Our pharmacist will review it shortly.");
        setPrescriptionFile(null);
      } else {
        setPrescriptionStatus("❌ Failed to upload prescription. Please try again.");
      }
    } catch {
      setPrescriptionStatus("❌ Error connecting to backend server.");
    }
  };

  const categories = ["All", "Personal Care", "Hygiene", "Wellness", "Pain Relief", "Supplements", "First Aid"];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <section className="w-full bg-slate-900 text-white relative shadow-md">
          <div className="relative w-full h-72 sm:h-96 md:h-[420px] overflow-hidden">
            <img 
              src="/shop-front.jpg.jpeg" 
              alt="A.P. Pharmaceuticals Storefront" 
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-12 max-w-7xl mx-auto">
              <span className="bg-blue-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full w-fit mb-3 shadow">
                Kalkaji, New Delhi • ★ 4.9 Google Rating
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                A.P. Pharmaceuticals
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                Your trusted neighborhood pharmacy. Genuine medicines, healthcare essentials, and instant prescription uploads right at your fingertips.
              </p>
            </div>
          </div>
        </section>

        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <h2 className="text-lg font-black text-blue-900 tracking-tight">A.P. PHARMA</h2>
              <p className="text-[10px] text-slate-500">Serving Humanity Since 2010</p>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search medicines, health products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPrescriptionStatus("");
                  setIsPrescriptionOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                📄 Upload Prescription
              </button>
              <button
                onClick={() => setIsContactOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                📍 Contact Us
              </button>
              <button
                onClick={() => {
                  setOrderConfirmation("");
                  setIsCartOpen(true);
                }}
                className="bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                🛒 Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-slate-500 font-medium">No products found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base mb-1">{product.name}</h3>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-lg font-black text-blue-900">{product.price}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-blue-50 hover:bg-blue-700 text-blue-700 hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800">A.P. Pharmaceuticals • Kalkaji, New Delhi</p>
            <p>Authorized Pharmacy Retailer • Serving Humanity Since 2010</p>
          </div>
          <div className="flex gap-6 font-medium text-slate-600">
            <span>Privacy Policy</span>
            <span>Terms & Conditions</span>
            <span>Refund & Return Policy</span>
            <span>Shipping & Delivery</span>
          </div>
        </div>
      </footer>

      {isPrescriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setIsPrescriptionOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-blue-900 mb-1">Upload Prescription</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload an image or PDF of your doctor&apos;s prescription for quick verification.
            </p>
            <form onSubmit={handlePrescriptionUpload} className="space-y-4">
              <input
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPrescriptionFile(e.target.files[0]);
                  }
                }}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md"
              >
                Submit Prescription
              </button>
            </form>
            {prescriptionStatus && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-900 text-xs font-semibold rounded-xl text-center">
                {prescriptionStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-blue-900 mb-2">A.P. Pharmaceuticals</h3>
            <p className="text-sm text-slate-600 mb-4">Serving Humanity Since 2010 • Free Home Delivery*</p>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="block text-slate-900">👤 Proprietor</strong>
                <span>Dinesh Mehta</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="block text-slate-900">📞 Phone</strong>
                <span>+91 98186 37337</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="block text-slate-900">📍 Location</strong>
                <span>Kalkaji, New Delhi, India</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="block text-slate-900">⭐ Customer Rating</strong>
                <span>4.9 / 5.0 on Google Reviews</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCartOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-blue-900 mb-4">Secure Checkout</h3>

            {orderConfirmation ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm font-semibold text-center space-y-3">
                <p>{orderConfirmation}</p>
                <button
                  onClick={() => {
                    setOrderConfirmation("");
                    setIsCartOpen(false);
                  }}
                  className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Your cart is currently empty.</p>
            ) : (
              <div className="space-y-4">
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{item.product.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.product.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold text-xs"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between font-black text-blue-900 text-base">
                  <span>Total Payable</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Delivery & Payment Details
                  </p>
                  <input
                    required
                    type="text"
                    placeholder="Customer Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="10-Digit Mobile Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Complete Delivery Address (House No, Kalkaji Block, Landmark)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Online Payment (Razorpay / UPI)">💳 Pay Online (Razorpay / UPI / Card)</option>
                    <option value="Cash on Delivery (COD)">💵 Cash / UPI on Delivery</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md"
                  >
                    Proceed to Checkout • ₹{cartTotal.toFixed(2)}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}