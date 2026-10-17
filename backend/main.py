from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import os
import shutil
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

DB_FILE = "pharmacy.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            category TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            upload_date TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            items_summary TEXT NOT NULL,
            total_amount TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT DEFAULT 'Confirmed',
            order_date TEXT NOT NULL
        )
    ''')
    
    c.execute("SELECT COUNT(*) FROM products")
    if c.fetchone()[0] == 0:
        sample_products = [
            ("Dolo 650mg Strip (15 Tablets)", "₹30", "Pain Relief"),
            ("Dettol Antiseptic Liquid 550ml", "₹195", "First Aid"),
            ("Limcee Vitamin C Chewable (15 Tabs)", "₹25", "Supplements"),
            ("Volini Pain Relief Gel 30g", "₹130", "Pain Relief"),
            ("Digene Acidity & Gas Relief Gel 200ml", "₹145", "Wellness"),
            ("Nivea Soft Light Moisturizer 100ml", "₹185", "Personal Care"),
            ("Sensodyne Rapid Relief Toothpaste 80g", "₹170", "Hygiene"),
            ("Band-Aid Washproof Medicated (20 Strips)", "₹50", "First Aid")
        ]
        c.executemany("INSERT INTO products (name, price, category) VALUES (?, ?, ?)", sample_products)
        
    conn.commit()
    conn.close()

init_db()

class ProductCreate(BaseModel):
    name: str
    price: str
    category: str

class StatusUpdate(BaseModel):
    status: str

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    items_summary: str
    total_amount: str
    payment_method: str

@app.get("/")
def read_root():
    return {"message": "Hello from A.P. Pharmaceuticals Backend!"}

# --- PRODUCT ENDPOINTS ---
@app.get("/products")
def get_products():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM products ORDER BY id DESC")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

@app.post("/products")
def add_product(product: ProductCreate):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
        (product.name, product.price, product.category)
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, **product.dict()}

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"message": "Product deleted successfully"}

# --- PRESCRIPTION ENDPOINTS ---
@app.post("/prescriptions")
async def upload_prescription(file: UploadFile = File(...)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"http://localhost:8000/uploads/{safe_filename}"
    upload_date = datetime.now().strftime("%d %b %Y, %I:%M %p")
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO prescriptions (filename, file_path, status, upload_date) VALUES (?, ?, ?, ?)",
        (file.filename, file_url, "Pending", upload_date)
    )
    conn.commit()
    conn.close()
    return {"message": "Uploaded successfully", "file_path": file_url}

@app.get("/prescriptions")
def get_prescriptions():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM prescriptions ORDER BY id DESC")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

@app.patch("/prescriptions/{rx_id}")
def update_prescription_status(rx_id: int, update: StatusUpdate):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE prescriptions SET status = ? WHERE id = ?", (update.status, rx_id))
    conn.commit()
    conn.close()
    return {"message": "Prescription status updated"}

# --- ORDER CHECKOUT ENDPOINTS ---
@app.post("/orders")
def create_order(order: OrderCreate):
    order_date = datetime.now().strftime("%d %b %Y, %I:%M %p")
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        '''INSERT INTO orders 
           (customer_name, customer_phone, customer_address, items_summary, total_amount, payment_method, status, order_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            order.customer_name,
            order.customer_phone,
            order.customer_address,
            order.items_summary,
            order.total_amount,
            order.payment_method,
            "Order Placed",
            order_date,
        )
    )
    conn.commit()
    order_id = c.lastrowid
    conn.close()
    return {"message": "Order placed successfully", "order_id": order_id}

@app.get("/orders")
def get_orders():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM orders ORDER BY id DESC")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows