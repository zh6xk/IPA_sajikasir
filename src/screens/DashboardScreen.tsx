import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { FoodImageHolder } from '../components/FoodImageHolder';
import { formatRupiah } from '../utils/formatter';
import { getTransactions, TransactionHistory } from '../database/db';
import { MapPin, Store, History, ChevronRight, UtensilsCrossed, Moon, Sun } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const DashboardScreen = ({ navigation }: any) => {
  const { userName, userLocation, storeName, products, refreshProducts, isDark, toggleTheme, colors } = useAppContext();
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const styles = getStyles(colors);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProducts();
      fetchTransactions();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const firstName = userName.split(' ')[0] || 'Kasir';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.locationText}>{userLocation.toUpperCase() || 'LOKASI TOKO'}</Text>
            </View>
            <Text style={styles.greetingText}>Halo, Kak {firstName}!</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              {isDark ? <Sun size={24} color="#FFD54F" /> : <Moon size={24} color="#5C6BC0" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('ProfileSettings')}>
              <Text style={styles.profileInitials}>{firstName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Info Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeCardContent}>
            <Text style={styles.storeNameText} numberOfLines={1}>{storeName}</Text>
            <Text style={styles.storeMenuCount}>Total: {products.length} Menu Terdaftar</Text>
          </View>
          <View style={styles.storeIconWrapper}>
            <Store size={20} color={colors.primary} />
          </View>
        </View>

        {/* Transaction History Summary Card */}
        <TouchableOpacity style={styles.historyCard} onPress={() => navigation.navigate('TransactionHistory')}>
          <View style={styles.historyCardInner}>
            <View style={styles.historyIconWrapper}>
              <History size={20} color={colors.success} />
            </View>
            <View style={styles.historyTextWrapper}>
              <Text style={styles.historyTitle}>Riwayat Bayar</Text>
              <Text style={styles.historySubtitle}>{transactions.length} Transaksi Terbayar</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.success} />
        </TouchableOpacity>

        <Text style={styles.catalogTitle}>Katalog Menu</Text>

        {/* Product Grid */}
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Store size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Katalog Menu Kosong</Text>
            <Text style={styles.emptySubtitle}>Gunakan tombol bulat di kanan bawah untuk mulai menambah menu baru.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.gridItem}
                onPress={() => navigation.navigate('OrderCatalog')}
              >
                <FoodImageHolder imageUri={product.imageUri} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.metaText}>{product.flavorType === 'Asin' ? '🧂 Asin' : '🍬 Manis'}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ManageMenu')}
      >
        <UtensilsCrossed size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
    marginLeft: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  storeCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeCardContent: {
    flex: 1,
  },
  storeNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  storeMenuCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  storeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTextWrapper: {
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  historySubtitle: {
    fontSize: 12,
    color: colors.success,
    opacity: 0.8,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
