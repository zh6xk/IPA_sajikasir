import React, { useState, useEffect } from 'react';
import { useTheme } from 'react-native-paper';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';
import { formatRupiah } from '../utils/formatter';
import { getResepProduk, ResepProduk } from '../database/db';

interface ProductAnalytics {
  id: number;
  name: string;
  price: number;
  totalHPP: number;
  marginRp: number;
  marginPct: number;
  statusLabel: string;
  statusColor: string;
}

export const HPPDashboardScreen = ({ navigation }: any) => {
  const { products, masterBahan } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(colors);

  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [products, masterBahan]);

  const loadAnalytics = async () => {
    setLoading(true);
    const results: ProductAnalytics[] = [];

    for (const p of products) {
      const resep = await getResepProduk(p.id);
      
      let totalHPP = 0;
      for (const item of resep) {
        const bahan = masterBahan.find(b => b.id_bahan === item.id_bahan);
        if (bahan) {
          totalHPP += (item.takaran_pemakaian * bahan.harga_per_satuan_terkecil);
        }
      }

      const marginRp = p.price - totalHPP;
      const marginPct = p.price > 0 ? (marginRp / p.price) * 100 : 0;

      let statusLabel = '';
      let statusColor = '';

      if (marginPct >= 50) {
        statusLabel = 'Untung Besar';
        statusColor = colors.success;
      } else if (marginPct >= 20) {
        statusLabel = 'Untung Normal';
        statusColor = colors.success;
      } else if (marginPct > 0) {
        statusLabel = 'Untung Tipis';
        statusColor = colors.warning;
      } else {
        statusLabel = 'Rugi / Ubah Harga';
        statusColor = colors.danger;
      }

      results.push({
        id: p.id,
        name: p.name,
        price: p.price,
        totalHPP,
        marginRp,
        marginPct,
        statusLabel,
        statusColor
      });
    }

    setAnalytics(results);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard HPP</Text>
        <TouchableOpacity onPress={loadAnalytics} style={{ marginLeft: 'auto', padding: 8 }}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={analytics}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={{ color: colors.textSecondary }}>Belum ada data produk.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={[styles.badge, { backgroundColor: item.statusColor }]}>
                  <Text style={styles.badgeText}>{item.statusLabel}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total HPP</Text>
                  <Text style={styles.statValue}>{formatRupiah(item.totalHPP)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Harga Jual</Text>
                  <Text style={styles.statValue}>{formatRupiah(item.price)}</Text>
                </View>
              </View>

              <View style={styles.marginBox}>
                <Text style={styles.marginLabel}>Margin (Rp)</Text>
                <Text style={styles.marginValue}>{formatRupiah(item.marginRp)}</Text>
                <View style={styles.pctWrap}>
                  <Text style={[styles.pctValue, { color: item.statusColor }]}>
                    {item.marginPct.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  marginBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marginLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  marginValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  pctWrap: {
    backgroundColor: colors.chipBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pctValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
