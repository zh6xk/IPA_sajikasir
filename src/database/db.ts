import * as SQLite from 'expo-sqlite';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUri: string | null;
  flavorType: 'Asin' | 'Manis';
}

export interface TransactionHistory {
  id: number;
  receiptText: string;
  totalAmount: number;
  timestamp: number;
  targetWhatsApp: string;
}

// Open database synchronously for Expo SDK 50+
let db: SQLite.SQLiteDatabase | null = null;

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
        flavorType TEXT NOT NULL DEFAULT 'Asin'
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receiptText TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        targetWhatsApp TEXT NOT NULL
      );
    `);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<Product>('SELECT * FROM products_v2');
};

export const insertProduct = async (product: Omit<Product, 'id'>) => {
  if (!db) await initDB();
  await db!.runAsync(
    'INSERT INTO products_v2 (name, price, category, imageUri, flavorType) VALUES (?, ?, ?, ?, ?)',
    [product.name, product.price, product.category, product.imageUri, product.flavorType]
  );
};

export const updateProduct = async (product: Product) => {
  if (!db) await initDB();
  await db!.runAsync(
    'UPDATE products_v2 SET name=?, price=?, category=?, imageUri=?, flavorType=? WHERE id=?',
    [product.name, product.price, product.category, product.imageUri, product.flavorType, product.id]
  );
};

export const deleteProduct = async (id: number) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM products_v2 WHERE id=?', [id]);
};

export const getTransactions = async (): Promise<TransactionHistory[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<TransactionHistory>('SELECT * FROM transactions ORDER BY timestamp DESC');
};

export const insertTransaction = async (trx: Omit<TransactionHistory, 'id'>) => {
  if (!db) await initDB();
  await db!.runAsync(
    'INSERT INTO transactions (receiptText, totalAmount, timestamp, targetWhatsApp) VALUES (?, ?, ?, ?)',
    [trx.receiptText, trx.totalAmount, trx.timestamp, trx.targetWhatsApp]
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
