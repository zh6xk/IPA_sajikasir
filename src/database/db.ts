import * as SQLite from 'expo-sqlite';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUri: string | null;
  flavorType: 'Asin' | 'Manis';
  stock: number;
}

export interface TransactionItem {
  productId: number;
  name: string;
  price: number;
  qty: number;
}

export interface TransactionHistory {
  id: number;
  receiptText: string;
  totalAmount: number;
  timestamp: number;
  targetWhatsApp: string;
  itemsJson: string;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  discount: number;
  tax: number;
  customerName: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  note: string;
  createdAt: number;
}

// Open database synchronously for Expo SDK 50+
let db: SQLite.SQLiteDatabase | null = null;

// Adds a column if it doesn't already exist (safe migration for existing installs).
const ensureColumn = async (
  database: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
) => {
  const cols = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some(c => c.name === column)) {
    await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

export const initDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sajikasir.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        imageUri TEXT,
        flavorType TEXT NOT NULL DEFAULT 'Asin',
        stock INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receiptText TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        targetWhatsApp TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        note TEXT,
        createdAt INTEGER NOT NULL
      );
    `);

    // Migrations for existing installs.
    await ensureColumn(db, 'products_v2', 'stock', 'INTEGER NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'itemsJson', "TEXT NOT NULL DEFAULT '[]'");
    await ensureColumn(db, 'transactions', 'paymentMethod', "TEXT NOT NULL DEFAULT 'Tunai'");
    await ensureColumn(db, 'transactions', 'amountPaid', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'changeAmount', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'discount', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'tax', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'customerName', "TEXT NOT NULL DEFAULT ''");
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<Product>('SELECT * FROM products_v2');
};

export const insertProduct = async (product: Omit<Product, 'id'>) => {
  if (!db) await initDB();
  await db!.runAsync(
    'INSERT INTO products_v2 (name, price, category, imageUri, flavorType, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [product.name, product.price, product.category, product.imageUri, product.flavorType, product.stock]
  );
};

export const updateProduct = async (product: Product) => {
  if (!db) await initDB();
  await db!.runAsync(
    'UPDATE products_v2 SET name=?, price=?, category=?, imageUri=?, flavorType=?, stock=? WHERE id=?',
    [product.name, product.price, product.category, product.imageUri, product.flavorType, product.stock, product.id]
  );
};

export const deleteProduct = async (id: number) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM products_v2 WHERE id=?', [id]);
};

// Reduces stock for sold items. Stock never goes below 0 and unlimited (stock<=0 baseline ignored only when tracked).
export const decrementStock = async (items: { productId: number; qty: number }[]) => {
  if (!db) await initDB();
  for (const item of items) {
    await db!.runAsync(
      'UPDATE products_v2 SET stock = MAX(0, stock - ?) WHERE id = ?',
      [item.qty, item.productId]
    );
  }
};

export const getTransactions = async (): Promise<TransactionHistory[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<TransactionHistory>('SELECT * FROM transactions ORDER BY timestamp DESC');
};

export const insertTransaction = async (trx: Omit<TransactionHistory, 'id'>) => {
  if (!db) await initDB();
  await db!.runAsync(
    `INSERT INTO transactions
      (receiptText, totalAmount, timestamp, targetWhatsApp, itemsJson, paymentMethod, amountPaid, changeAmount, discount, tax, customerName)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trx.receiptText, trx.totalAmount, trx.timestamp, trx.targetWhatsApp,
      trx.itemsJson, trx.paymentMethod, trx.amountPaid, trx.changeAmount,
      trx.discount, trx.tax, trx.customerName
    ]
  );
};

export const deleteTransaction = async (id: number) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM transactions WHERE id=?', [id]);
};

export const clearAllTransactions = async () => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM transactions');
};

// ---- Customers ----
export const getCustomers = async (): Promise<Customer[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<Customer>('SELECT * FROM customers ORDER BY name COLLATE NOCASE ASC');
};

export const insertCustomer = async (customer: Omit<Customer, 'id'>) => {
  if (!db) await initDB();
  await db!.runAsync(
    'INSERT INTO customers (name, phone, note, createdAt) VALUES (?, ?, ?, ?)',
    [customer.name, customer.phone, customer.note, customer.createdAt]
  );
};

export const updateCustomer = async (customer: Customer) => {
  if (!db) await initDB();
  await db!.runAsync(
    'UPDATE customers SET name=?, phone=?, note=? WHERE id=?',
    [customer.name, customer.phone, customer.note, customer.id]
  );
};

export const deleteCustomer = async (id: number) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM customers WHERE id=?', [id]);
};
