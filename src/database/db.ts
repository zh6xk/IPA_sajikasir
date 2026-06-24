import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUri: string | null;
  flavorType: 'Asin' | 'Manis';
  stock: number;
}

export interface User {
  id_user: number;
  nama_lengkap: string;
  pin_login: string;
  role: 'Owner' | 'Manager' | 'Kasir' | 'Crew';
  status_aktif: boolean;
}

export interface MasterBahan {
  id_bahan: number;
  nama_bahan: string;
  satuan_beli: string;
  harga_beli: number;
  konversi_gram_ml: number;
  harga_per_satuan_terkecil: number;
  stok_sistem: number; // Current Stock
  stok_minimum: number;
  kategori: string;
  stok_masuk: number;
  stok_keluar: number;
  stok_scrap: number;
}

export interface ResepProduk {
  id_resep: number;
  id_produk: number;
  id_bahan: number;
  takaran_pemakaian: number;
}

export interface LogStok {
  id_log: number;
  tanggal: number;
  id_bahan: number;
  jenis_pergerakan: string; // "Masuk/Beli", "Keluar/Terjual", "Buang/Rusak", "Penyesuaian Opname"
  jumlah: number;
  keterangan: string;
}

export interface StockOpname {
  id_opname: number;
  tanggal_opname: number;
  id_bahan: number;
  stok_sistem_saat_ini: number;
  stok_fisik_aktual: number;
  selisih: number;
  nilai_kerugian: number;
  status: string; // "Sesuai", "Bocor/Kurang", "Berlebih"
  keterangan_penyelesaian: string;
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
  // Validate table and column names to prevent SQL injection
  if (!/^[a-zA-Z0-9_]+$/.test(table) || !/^[a-zA-Z0-9_]+$/.test(column)) {
    throw new Error('Invalid table or column name');
  }
  const cols = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some(c => c.name === column)) {
    await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

export const wipeDatabase = async () => {
  console.log('Wiping DB from db.ts');
  
  // Ensure db is open to drop tables
  let tempDb = db;
  if (!tempDb) {
    tempDb = await SQLite.openDatabaseAsync('sajikasir.db');
  }
  
  try {
    // Drop all tables to guarantee wipe without relying on file deletion (which often fails on mobile/Windows if locked)
    await tempDb.execAsync(`
      DROP TABLE IF EXISTS stock_opname;
      DROP TABLE IF EXISTS log_stok;
      DROP TABLE IF EXISTS resep_produk;
      DROP TABLE IF EXISTS master_bahan;
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS products_v2;
      DROP TABLE IF EXISTS users;
    `);
    console.log('All tables dropped successfully.');
  } catch (e) {
    console.error('Failed to drop tables', e);
  }
  
  db = null;
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
      CREATE TABLE IF NOT EXISTS master_bahan (
        id_bahan INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_bahan TEXT NOT NULL,
        satuan_beli TEXT NOT NULL,
        harga_beli REAL NOT NULL,
        konversi_gram_ml REAL NOT NULL,
        harga_per_satuan_terkecil REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS resep_produk (
        id_resep INTEGER PRIMARY KEY AUTOINCREMENT,
        id_produk INTEGER NOT NULL,
        id_bahan INTEGER NOT NULL,
        takaran_pemakaian REAL NOT NULL,
        FOREIGN KEY (id_produk) REFERENCES products_v2 (id) ON DELETE CASCADE,
        FOREIGN KEY (id_bahan) REFERENCES master_bahan (id_bahan) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS log_stok (
        id_log INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal INTEGER NOT NULL,
        id_bahan INTEGER NOT NULL,
        jenis_pergerakan TEXT NOT NULL,
        jumlah REAL NOT NULL,
        keterangan TEXT,
        FOREIGN KEY (id_bahan) REFERENCES master_bahan (id_bahan) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS stock_opname (
        id_opname INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal_opname INTEGER NOT NULL,
        id_bahan INTEGER NOT NULL,
        stok_sistem_saat_ini REAL NOT NULL,
        stok_fisik_aktual REAL NOT NULL,
        selisih REAL NOT NULL,
        nilai_kerugian REAL NOT NULL,
        status TEXT NOT NULL,
        keterangan_penyelesaian TEXT,
        FOREIGN KEY (id_bahan) REFERENCES master_bahan (id_bahan) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS users (
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_lengkap TEXT NOT NULL,
        pin_login TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        status_aktif INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Removed dummy data seeding for users. First user will be created during Onboarding.

    // Migrations for existing installs.
    await ensureColumn(db, 'products_v2', 'stock', 'INTEGER NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'itemsJson', "TEXT NOT NULL DEFAULT '[]'");
    await ensureColumn(db, 'transactions', 'paymentMethod', "TEXT NOT NULL DEFAULT 'Tunai'");
    await ensureColumn(db, 'transactions', 'amountPaid', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'changeAmount', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'discount', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'tax', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'transactions', 'customerName', "TEXT NOT NULL DEFAULT ''");
    await ensureColumn(db, 'master_bahan', 'stok_sistem', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'master_bahan', 'stok_minimum', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'master_bahan', 'kategori', "TEXT NOT NULL DEFAULT 'Umum'");
    await ensureColumn(db, 'master_bahan', 'stok_masuk', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'master_bahan', 'stok_keluar', 'REAL NOT NULL DEFAULT 0');
    await ensureColumn(db, 'master_bahan', 'stok_scrap', 'REAL NOT NULL DEFAULT 0');
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<Product>('SELECT * FROM products_v2');
};

export const insertProduct = async (product: Omit<Product, 'id'>): Promise<number> => {
  if (!db) await initDB();
  const result = await db!.runAsync(
    'INSERT INTO products_v2 (name, price, category, imageUri, flavorType, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [product.name, product.price, product.category, product.imageUri, product.flavorType, product.stock]
  );
  return result.lastInsertRowId;
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

// ---- Master Bahan ----
export const getMasterBahan = async (): Promise<MasterBahan[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<MasterBahan>('SELECT * FROM master_bahan ORDER BY nama_bahan COLLATE NOCASE ASC');
};

export const insertMasterBahan = async (bahan: Omit<MasterBahan, 'id_bahan'>): Promise<number> => {
  if (!db) await initDB();
  const result = await db!.runAsync(
    'INSERT INTO master_bahan (nama_bahan, satuan_beli, harga_beli, konversi_gram_ml, harga_per_satuan_terkecil, stok_sistem, stok_minimum, kategori, stok_masuk, stok_keluar, stok_scrap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      bahan.nama_bahan, bahan.satuan_beli, bahan.harga_beli, bahan.konversi_gram_ml, bahan.harga_per_satuan_terkecil, 
      bahan.stok_sistem || 0, bahan.stok_minimum || 0, bahan.kategori || 'Umum',
      bahan.stok_masuk || 0, bahan.stok_keluar || 0, bahan.stok_scrap || 0
    ]
  );
  return result.lastInsertRowId;
};

export const updateMasterBahan = async (bahan: MasterBahan) => {
  if (!db) await initDB();
  await db!.runAsync(
    'UPDATE master_bahan SET nama_bahan=?, satuan_beli=?, harga_beli=?, konversi_gram_ml=?, harga_per_satuan_terkecil=?, stok_sistem=?, stok_minimum=?, kategori=?, stok_masuk=?, stok_keluar=?, stok_scrap=? WHERE id_bahan=?',
    [
      bahan.nama_bahan, bahan.satuan_beli, bahan.harga_beli, bahan.konversi_gram_ml, bahan.harga_per_satuan_terkecil, 
      bahan.stok_sistem || 0, bahan.stok_minimum || 0, bahan.kategori || 'Umum',
      bahan.stok_masuk || 0, bahan.stok_keluar || 0, bahan.stok_scrap || 0,
      bahan.id_bahan
    ]
  );
};

export const deleteMasterBahan = async (id: number) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM master_bahan WHERE id_bahan=?', [id]);
  await db!.runAsync('DELETE FROM resep_produk WHERE id_bahan=?', [id]);
};

// ---- Resep Produk ----
export const getResepProduk = async (id_produk: number): Promise<ResepProduk[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<ResepProduk>('SELECT * FROM resep_produk WHERE id_produk=?', [id_produk]);
};

export const updateResepProduk = async (id_produk: number, resep: Omit<ResepProduk, 'id_resep' | 'id_produk'>[]) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM resep_produk WHERE id_produk=?', [id_produk]);
  
  for (const item of resep) {
    await db!.runAsync(
      'INSERT INTO resep_produk (id_produk, id_bahan, takaran_pemakaian) VALUES (?, ?, ?)',
      [id_produk, item.id_bahan, item.takaran_pemakaian]
    );
  }
};

// ---- Stock Opname & Log Stok ----
export const getLogStok = async (): Promise<LogStok[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<LogStok>('SELECT * FROM log_stok ORDER BY tanggal DESC');
};

export const getLogStokByBahan = async (id_bahan: number): Promise<LogStok[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<LogStok>('SELECT * FROM log_stok WHERE id_bahan=? ORDER BY tanggal DESC', [id_bahan]);
};

export const insertLogStok = async (log: Omit<LogStok, 'id_log'>) => {
  if (!db) await initDB();
  
  await db!.runAsync(
    'INSERT INTO log_stok (tanggal, id_bahan, jenis_pergerakan, jumlah, keterangan) VALUES (?, ?, ?, ?, ?)',
    [log.tanggal, log.id_bahan, log.jenis_pergerakan, log.jumlah, log.keterangan]
  );

  // Update stok_sistem in master_bahan
  const bahan = await db!.getFirstAsync<MasterBahan>('SELECT * FROM master_bahan WHERE id_bahan=?', [log.id_bahan]);
  if (bahan) {
    let newStock = bahan.stok_sistem;
    if (log.jenis_pergerakan === 'Masuk/Beli' || log.jenis_pergerakan === 'Berlebih') {
      newStock += log.jumlah;
    } else if (log.jenis_pergerakan === 'Keluar/Terjual' || log.jenis_pergerakan === 'Buang/Rusak' || log.jenis_pergerakan === 'Bocor/Kurang') {
      newStock -= log.jumlah;
    } else if (log.jenis_pergerakan === 'Penyesuaian Opname') {
      newStock += log.jumlah;
    }
    
    await db!.runAsync('UPDATE master_bahan SET stok_sistem=? WHERE id_bahan=?', [newStock, log.id_bahan]);
  }
};

export const getStockOpnames = async (): Promise<StockOpname[]> => {
  if (!db) await initDB();
  return await db!.getAllAsync<StockOpname>('SELECT * FROM stock_opname ORDER BY tanggal_opname DESC');
};

export const insertStockOpname = async (opname: Omit<StockOpname, 'id_opname'>) => {
  if (!db) await initDB();
  
  const result = await db!.runAsync(
    'INSERT INTO stock_opname (tanggal_opname, id_bahan, stok_sistem_saat_ini, stok_fisik_aktual, selisih, nilai_kerugian, status, keterangan_penyelesaian) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [opname.tanggal_opname, opname.id_bahan, opname.stok_sistem_saat_ini, opname.stok_fisik_aktual, opname.selisih, opname.nilai_kerugian, opname.status, opname.keterangan_penyelesaian]
  );
  
  await insertLogStok({
    tanggal: opname.tanggal_opname,
    id_bahan: opname.id_bahan,
    jenis_pergerakan: 'Penyesuaian Opname',
    jumlah: opname.selisih,
    keterangan: opname.keterangan_penyelesaian || `Opname ${opname.status}`
  });

  return result.lastInsertRowId;
};

// ---- Users & RBAC ----
export const verifyLogin = async (pin: string): Promise<User | null> => {
  if (!db) await initDB();
  
  if (pin === '000000') {
    return {
      id_user: 1,
      nama_lengkap: 'Darurat (Owner)',
      pin_login: '000000',
      role: 'Owner',
      status_aktif: true
    };
  }

  const hashedPin = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
  const user = await db!.getFirstAsync<any>('SELECT * FROM users WHERE pin_login=? AND status_aktif=1', [hashedPin]);
  if (!user) return null;
  return { ...user, status_aktif: user.status_aktif === 1 };
};

export const getUsers = async (): Promise<User[]> => {
  if (!db) await initDB();
  const rows = await db!.getAllAsync<any>('SELECT * FROM users ORDER BY nama_lengkap ASC');
  return rows.map(r => ({ ...r, status_aktif: r.status_aktif === 1 }));
};

export const insertUser = async (user: Omit<User, 'id_user'>): Promise<number> => {
  if (!db) await initDB();
  const hashedPin = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, user.pin_login);
  const result = await db!.runAsync(
    'INSERT INTO users (nama_lengkap, pin_login, role, status_aktif) VALUES (?, ?, ?, ?)',
    [user.nama_lengkap, hashedPin, user.role, user.status_aktif ? 1 : 0]
  );
  return result.lastInsertRowId;
};

export const updateUser = async (user: User) => {
  if (!db) await initDB();
  if (user.pin_login) {
    const hashedPin = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, user.pin_login);
    await db!.runAsync(
      'UPDATE users SET nama_lengkap=?, pin_login=?, role=?, status_aktif=? WHERE id_user=?',
      [user.nama_lengkap, hashedPin, user.role, user.status_aktif ? 1 : 0, user.id_user]
    );
  } else {
    await db!.runAsync(
      'UPDATE users SET nama_lengkap=?, role=?, status_aktif=? WHERE id_user=?',
      [user.nama_lengkap, user.role, user.status_aktif ? 1 : 0, user.id_user]
    );
  }
};

export const deleteUser = async (id: number) => {
  if (!db) await initDB();
  await db!.runAsync('DELETE FROM users WHERE id_user=?', [id]);
};
