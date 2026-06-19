import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import {
  getProducts, insertProduct, deleteProduct,
  getTransactions, insertTransaction, clearAllTransactions,
  getCustomers, insertCustomer, deleteCustomer,
  Product, TransactionHistory, Customer,
} from '../database/db';

interface BackupPayload {
  version: number;
  exportedAt: number;
  products: Product[];
  transactions: TransactionHistory[];
  customers: Customer[];
}

// Exports all data to a JSON file and opens the system share sheet.
export const exportBackup = async () => {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    products: await getProducts(),
    transactions: await getTransactions(),
    customers: await getCustomers(),
  };

  const fileName = `sajikasir-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, fileName);
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Simpan Cadangan SajiKasir',
    });
  } else {
    Alert.alert('Berhasil', `Cadangan tersimpan di:\n${file.uri}`);
  }
};

// Imports data from a user-picked JSON file, replacing all current data.
export const importBackup = async (): Promise<boolean> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return false;

  const file = new File(result.assets[0].uri);
  const content = await file.text();
  const data = JSON.parse(content) as BackupPayload;

  if (!data.products && !data.transactions && !data.customers) {
    throw new Error('File cadangan tidak valid.');
  }

  // Wipe existing data.
  const existingProducts = await getProducts();
  for (const p of existingProducts) await deleteProduct(p.id);
  await clearAllTransactions();
  const existingCustomers = await getCustomers();
  for (const c of existingCustomers) await deleteCustomer(c.id);

  // Restore.
  for (const p of data.products || []) {
    const { id, ...rest } = p;
    await insertProduct({ ...rest, stock: rest.stock ?? 0 });
  }
  for (const t of data.transactions || []) {
    const { id, ...rest } = t;
    await insertTransaction({
      ...rest,
      itemsJson: rest.itemsJson ?? '[]',
      paymentMethod: rest.paymentMethod ?? 'Tunai',
      amountPaid: rest.amountPaid ?? 0,
      changeAmount: rest.changeAmount ?? 0,
      discount: rest.discount ?? 0,
      tax: rest.tax ?? 0,
      customerName: rest.customerName ?? '',
    });
  }
  for (const c of data.customers || []) {
    const { id, ...rest } = c;
    await insertCustomer(rest);
  }

  return true;
};
