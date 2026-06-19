import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRupiah, formatWhatsAppNumber } from '../utils/formatter';
import { getTransactions, TransactionHistory, clearAllTransactions } from '../database/db';
import { ArrowLeft, Trash2, Calendar, MessageCircle } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { ThemeColors } from '../theme/Theme';

export const TransactionHistoryScreen = ({ navigation }: any) => {
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const { colors } = useAppContext();
  const styles = getStyles(colors);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const handleClearHistory = () => {
    if (transactions.length === 0) return;
    
    Alert.alert('Hapus Semua Riwayat', 'Apakah Anda yakin ingin menghapus semua riwayat transaksi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await clearAllTransactions();
        fetchTransactions();
      }}
    ]);
  };

  const openWhatsApp = (waNumber: string, text: string) => {
    const formattedWhatsApp = formatWhatsAppNumber(waNumber);
    const waUrl = `https://wa.me/${formattedWhatsApp}?text=${encodeURIComponent(text)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Error', 'Gagal membuka WhatsApp.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <TouchableOpacity onPress={handleClearHistory} disabled={transactions.length === 0}>
          <Trash2 size={20} color={transactions.length === 0 ? colors.border : colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
            <Text style={styles.emptySubtitle}>Riwayat penjualan akan muncul di sini setelah Anda menyelesaikan order.</Text>
          </View>
        ) : (
          transactions.map(trx => {
            const dateStr = new Date(trx.timestamp).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <View key={trx.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.dateRow}>
                    <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>
                  <Text style={styles.amountText}>{formatRupiah(trx.totalAmount)}</Text>
                </View>

                <View style={styles.receiptContainer}>
                  <Text style={styles.receiptText}>{trx.receiptText}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={() => openWhatsApp(trx.targetWhatsApp, trx.receiptText)}
                >
                  <MessageCircle size={16} color={colors.success} style={{ marginRight: 6 }} />
                  <Text style={styles.resendButtonText}>Kirim Ulang ke {trx.targetWhatsApp}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  receiptContainer: {
    backgroundColor: colors.chipBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  receiptText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
  },
  resendButtonText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
