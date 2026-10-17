"use client";
import { useState, useEffect } from "react";

interface Prescription {
  id: number;
  filename: string;
  file_path: string;
  status: string;
  upload_date: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items_summary: string;
  total_amount: string;
  payment_method: string;
  status: string;
  order_date: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [currentRole, setCurrentRole] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingRx, setLoadingRx] = useState(true);

  const fetchProducts = () => {
    fetch("http://localhost:8000/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error("Error fetching products:", err));
  };

  const fetchPrescriptions = () => {
    setLoadingRx(true);
    fetch("http://localhost:8000/prescriptions")
      .then((res) => res.json())
      .then((data) => {
        setPrescriptions(Array.isArray(data) ? data : []);
        setLoadingRx(false);
      })
      .catch((err) => {
        console.error("Error fetching prescriptions:", err);
        setLoadingRx(false);
      });
  };

  const fetchOrders = () => {
    fetch("http://localhost:8000/orders")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch((err) => console.error("Error fetching orders:", err));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      fetchPrescriptions();
      fetchOrders();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, "");
    if (cleanUser === "dineshmehta" && password === "appharma@2010") {
      setIsLoggedIn(true);
      setCurrentRole("Primary Administrator (Dinesh Mehta)");
      setLoginError("");
    } else if (
      (cleanUser === "dhanaymehta" || cleanUser === "dhanaydineshmehta") &&
      password === "Dhanay@mehta!0001"
    ) {
      setIsLoggedIn(true);
      setCurrentRole("System Developer & Admin (Dhanay Mehta)");
      setLoginError("");
    } else {
      setLoginError("Access Denied: Invalid User ID or Password.");
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");
    const formattedPrice = price.startsWith("₹") ? price : `₹${price}`;
    try {
      const res = await fetch("http://localhost:8000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: formattedPrice, category }),
      });
      if (res.ok) {
        setStatus("✅ Product added successfully!");
        setName("");
        setPrice("");
        setCategory("");
        fetchProducts();
      } else {
        setStatus("❌ Failed to add product.");
      }
    } catch {
      setStatus("❌ Error connecting to server.");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleStatusChange = async (rxId: number, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:8000/prescriptions/${rxId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchPrescriptions();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-blue-900">A.P. PHARMACEUTICALS</h1>
            <p className="text-slate-500 text-sm mt-1">Authorized Management Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">User ID</label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="dineshmehta or dhanaymehta"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 text-lg"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-md transition-colors text-sm"
            >
              Secure Login
            </button>
          </form>

          {loginError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl text-center">
              {loginError}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <a href="/" className="text-blue-600 hover:underline text-xs font-medium">
              ← Return to Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Active Session: <strong className="text-slate-900">{currentRole}</strong>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-lg text-sm">
              View Storefront ↗
            </a>
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setUsername("");
                setPassword("");
                setShowPassword(false);
              }}
              className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add Product Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Product to Inventory</h2>
          <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                placeholder="e.g. Dolo 650mg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹)</label>
              <input
                required
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
              >
                <option value="" disabled>Select category...</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Hygiene">Hygiene</option>
                <option value="Wellness">Wellness</option>
                <option value="Pain Relief">Pain Relief</option>
                <option value="Supplements">Supplements</option>
                <option value="First Aid">First Aid</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
              >
                + Add Product to Database
              </button>
            </div>
          </form>
          {status && (
            <div className="mt-4 text-center font-semibold text-blue-700 bg-blue-50 p-3 rounded-lg text-sm">
              {status}
            </div>
          )}
        </div>

        {/* Customer Orders Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Customer Orders ({orders.length})</h2>
            <button
              onClick={fetchOrders}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              🔄 Refresh Orders
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded-lg text-center">
              No customer orders placed yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-blue-900">#{o.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{o.customer_name}</p>
                        <p className="text-xs text-slate-500">{o.customer_phone} • {o.customer_address}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">{o.items_summary}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">{o.total_amount}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">{o.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Inventory Management Table */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Current Inventory ({products.length} Items)</h2>
            <button
              onClick={fetchProducts}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              🔄 Refresh Inventory
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.price}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prescription Management Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Customer Prescription Requests</h2>
            <button
              onClick={fetchPrescriptions}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              🔄 Refresh List
            </button>
          </div>
          {loadingRx ? (
            <p className="text-slate-500 text-sm">Loading prescriptions...</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded-lg text-center">
              No prescription requests uploaded yet.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-700">#{rx.id}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{rx.filename}</td>
                    <td className="py-3 px-4">
                      <select
                        value={rx.status}
                        onChange={(e) => handleStatusChange(rx.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer ${
                          rx.status === "Verified"
                            ? "bg-emerald-100 text-emerald-800"
                            : rx.status === "Dispatched"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="Verified">✅ Verified</option>
                        <option value="Dispatched">🚚 Dispatched</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={rx.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded text-xs"
                      >
                        View Prescription ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}