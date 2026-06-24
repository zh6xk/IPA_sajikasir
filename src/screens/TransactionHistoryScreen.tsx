import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Text, Card, Button, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRupiah, formatWhatsAppNumber } from '../utils/formatter';
import { getTransactions, TransactionHistory, clearAllTransactions } from '../database/db';
import { ArrowLeft, Trash2, Calendar, MessageCircle } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { ThemeColors } from '../theme/Theme';

export const TransactionHistoryScreen = ({ navigation }: any) => {
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const { t } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(theme);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const handleClearHistory = () => {
    if (transactions.length === 0) return;
    
    Alert.alert(t('deleteAllHistory'), t('deleteAllHistoryMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        await clearAllTransactions();
        fetchTransactions();
      }}
    ]);
  };

  const openWhatsApp = (waNumber: string, text: string) => {
    const formattedWhatsApp = formatWhatsAppNumber(waNumber);
    const waUrl = `https://wa.me/${formattedWhatsApp}?text=${encodeURIComponent(text)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert(t('waErrorTitle'), t('waErrorMsg'));
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>{t('transactionHistoryTitle')}</Text>
        <IconButton 
          icon="delete" 
          iconColor={transactions.length === 0 ? theme.colors.outline : theme.colors.error}
          onPress={handleClearHistory} 
          disabled={transactions.length === 0} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={theme.colors.outline} />
            <Text variant="titleMedium" style={styles.emptyTitle}>{t('noTransactions')}</Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>{t('noTransactionsSub')}</Text>
          </View>
        ) : (
          transactions.map(trx => {
            const dateStr = new Date(trx.timestamp).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <Card key={trx.id} mode="outlined" style={styles.card}>
                <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.dateRow}>
                    <Calendar size={14} color={theme.colors.onSurfaceVariant} style={{ marginRight: 6 }} />
                    <Text variant="bodySmall" style={styles.dateText}>{dateStr}</Text>
                  </View>
                  <Text variant="titleMedium" style={styles.amountText}>{formatRupiah(trx.totalAmount)}</Text>
                </View>

                <View style={styles.receiptContainer}>
                  <Text style={styles.receiptText}>{trx.receiptText}</Text>
                </View>

                <Button 
                  mode="contained-tonal"
                  icon="whatsapp"
                  onPress={() => openWhatsApp(trx.targetWhatsApp, trx.receiptText)}
                  style={styles.resendButton}
                >
                  {t('resendTo')} {trx.targetWhatsApp}
                </Button>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 16,
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
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  amountText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  receiptContainer: {
    backgroundColor: theme.colors.secondaryContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  receiptText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.onSecondaryContainer,
  },
  resendButton: {
    marginTop: 8,
  },
});
