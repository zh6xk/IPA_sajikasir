import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/formatter';
import { getTransactions, TransactionHistory } from '../database/db';
import { ArrowLeft, TrendingUp, Receipt, Award, BarChart3 } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

type RangeKey = 'today' | 'week' | 'month' | 'all';

const formatCompact = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return val.toString();
};

export const SalesReportScreen = ({ navigation }: any) => {
  const { t } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(colors);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [range, setRange] = useState<RangeKey>('today');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (range === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
    if (range === 'week') {
      return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    if (range === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    return 0;
  }, [range]);

  const filtered = transactions.filter(t => t.timestamp >= rangeStart);

  const totalRevenue = filtered.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalOrders = filtered.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Best-selling products (aggregated from itemsJson).
  const bestSellers = useMemo(() => {
    const tally: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const t of filtered) {
      try {
        const items = JSON.parse(t.itemsJson || '[]') as { name: string; qty: number; price: number }[];
        for (const it of items) {
          if (!tally[it.name]) tally[it.name] = { name: it.name, qty: 0, revenue: 0 };
          tally[it.name].qty += it.qty;
          tally[it.name].revenue += it.qty * it.price;
        }
      } catch {
        // older transactions without itemsJson are skipped
      }
    }
    return Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filtered]);

  // Revenue bars for the selected range.
  const dailyBars = useMemo(() => {
    const byKey: Record<string, { val: number, ts: number }> = {};
    for (const t of filtered) {
      const d = new Date(t.timestamp);
      let key = '';
      if (range === 'today') {
        key = `${d.getHours().toString().padStart(2, '0')}:00`;
      } else if (range === 'all') {
        key = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      } else {
        key = `${d.getDate()}/${d.getMonth() + 1}`;
      }
      
      if (!byKey[key]) byKey[key] = { val: 0, ts: t.timestamp };
      byKey[key].val += t.totalAmount;
      if (t.timestamp < byKey[key].ts) byKey[key].ts = t.timestamp;
    }
    
    const entries = Object.entries(byKey)
      .map(([day, data]) => ({ day, val: data.val, ts: data.ts }))
      .sort((a, b) => a.ts - b.ts);

    const max = Math.max(...entries.map(e => e.val), 1);
    return entries.map((item) => ({ day: item.day, val: item.val, pct: (item.val / max) * 100 }));
  }, [filtered, range]);

  const ranges: { key: RangeKey; label: string }[] = [
    { key: 'today', label: t('rangeToday') },
    { key: 'week', label: t('rangeWeek') },
    { key: 'month', label: t('rangeMonth') },
    { key: 'all', label: t('rangeAll') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('salesReport')}</Text>
      </View>

      <View style={styles.rangeContainer}>
        {ranges.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[styles.rangeTab, range === r.key && styles.rangeTabActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.rangeText, range === r.key && styles.rangeTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Revenue highlight */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueIconWrap}>
            <TrendingUp size={22} color="#FFF" />
          </View>
          <Text style={styles.revenueLabel}>{t('totalRevenue')}</Text>
          <Text style={styles.revenueValue}>{formatRupiah(totalRevenue)}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Receipt size={20} color={colors.primary} />
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>{t('transactionsLabel')}</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={20} color={colors.success} />
            <Text style={styles.statValue}>{formatRupiah(avgOrder)}</Text>
            <Text style={styles.statLabel}>{t('avgOrder')}</Text>
          </View>
        </View>

        {/* Daily chart */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <BarChart3 size={18} color={colors.text} />
            <Text style={styles.cardTitle}>{t('revenueChart')}</Text>
          </View>
          {dailyBars.length === 0 ? (
            <Text style={styles.emptyText}>{t('noDataRange')}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chart}>
                {dailyBars.map(bar => (
                  <View key={bar.day} style={styles.barColumn}>
                    <Text style={styles.barValueText}>{formatCompact(bar.val)}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${Math.max(bar.pct, 3)}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{bar.day}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Best sellers */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Award size={18} color={colors.text} />
            <Text style={styles.cardTitle}>{t('bestSellers')}</Text>
          </View>
          {bestSellers.length === 0 ? (
            <Text style={styles.emptyText}>{t('noDataSellers')}</Text>
          ) : (
            bestSellers.map((item, idx) => (
              <View key={item.name} style={styles.sellerRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{item.name}</Text>
                  <Text style={styles.sellerSub}>{item.qty} {t('sold')}</Text>
                </View>
                <Text style={styles.sellerRevenue}>{formatRupiah(item.revenue)}</Text>
              </View>
            ))
          )}
        </View>
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
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.chipBackground,
    alignItems: 'center',
  },
  rangeTabActive: {
    backgroundColor: colors.chipActiveBg,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rangeTextActive: {
    color: colors.primary,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  revenueCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
  },
  revenueIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 4,
  },
  revenueValue: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 12,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 12,
  },
  barColumn: {
    width: 44,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barValueText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  barTrack: {
    width: 28,
    height: 130,
    backgroundColor: colors.chipBackground,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontWeight: '900',
    color: colors.primary,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  sellerSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sellerRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
