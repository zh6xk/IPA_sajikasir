import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Card, Avatar, useTheme, Surface, TouchableRipple, IconButton, Searchbar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { FoodImageHolder } from '../components/FoodImageHolder';
import { formatRupiah } from '../utils/formatter';
import { getTransactions, TransactionHistory, insertMasterBahan, insertProduct, updateResepProduk, getMasterBahan, getProducts } from '../database/db';
import { MapPin, Store, History, ChevronRight, UtensilsCrossed, Moon, Sun, BarChart3, Users, AlertTriangle, Calculator, Beaker, PieChart, Database, Download, PackageSearch } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';
import { InAppTutorialOverlay, TutorialStep } from '../components/InAppTutorialOverlay';

export const DashboardScreen = ({ navigation }: any) => {
  const { currentUser, userLocation, storeName, products, refreshProducts, isDark, toggleTheme, trackStock, t, refreshMasterBahan, isTutorialDone, completeTutorial, cart, addToCart, decreaseInCart, clearCart } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any; // Cast to access custom properties if needed
  const styles = getStyles(theme);

  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tutorial Refs
  const scrollRef = React.useRef<ScrollView>(null);
  const profileRef = React.useRef(null);
  const reportRef = React.useRef(null);
  const posRef = React.useRef(null);
  const fabRef = React.useRef(null);
  
  const tutorialSteps: TutorialStep[] = [
    { title: 'Kelola Menu', description: 'Tekan tombol ini untuk menambahkan produk baru dan meracik resepnya. Modal (HPP) akan dihitung otomatis!', targetRef: fabRef },
    { title: 'Kasir & Pembayaran', description: 'Di sinilah tempat Anda melayani pelanggan. Ketuk produk yang dipesan, dan proses pembayarannya dengan super cepat.', targetRef: posRef },
    { title: 'Laporan Penjualan', description: 'Pantau sehatnya bisnis Anda. Lihat omset, keuntungan, dan riwayat transaksi secara real-time di sini.', targetRef: reportRef },
    { title: 'Manajemen Karyawan', description: 'Tekan ikon profil Anda untuk membuka Pengaturan, lalu tambahkan akun Kasir dengan PIN unik agar rahasia dapur aman.', targetRef: profileRef },
  ];

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

  const seedData = async () => {
    // Check if empty
    const checkBahan = await getMasterBahan();
    if (checkBahan.length > 0) return;

    await insertMasterBahan({ nama_bahan: 'Biji Kopi', satuan_beli: 'Kilogram', harga_beli: 140000, konversi_gram_ml: 1000, harga_per_satuan_terkecil: 140 });
    await insertMasterBahan({ nama_bahan: 'SKM', satuan_beli: 'Kaleng', harga_beli: 16000, konversi_gram_ml: 490, harga_per_satuan_terkecil: 32.65 });
    await insertMasterBahan({ nama_bahan: 'Susu UHT', satuan_beli: 'Liter', harga_beli: 19000, konversi_gram_ml: 1000, harga_per_satuan_terkecil: 19 });
    await insertMasterBahan({ nama_bahan: 'Cup & Lid', satuan_beli: 'Pcs', harga_beli: 800, konversi_gram_ml: 1, harga_per_satuan_terkecil: 800 });

    const pId = await insertProduct({ name: 'Kopi Susu Moka Pot', price: 18000, category: 'Minuman', imageUri: null, flavorType: 'Manis', stock: 100 });
    
    const freshBahan = await getMasterBahan();
    const b1 = freshBahan.find(b => b.nama_bahan === 'Biji Kopi')?.id_bahan || 0;
    const b2 = freshBahan.find(b => b.nama_bahan === 'SKM')?.id_bahan || 0;
    const b3 = freshBahan.find(b => b.nama_bahan === 'Susu UHT')?.id_bahan || 0;
    const b4 = freshBahan.find(b => b.nama_bahan === 'Cup & Lid')?.id_bahan || 0;

    await updateResepProduk(pId, [
      { id_bahan: b1, takaran_pemakaian: 20 },
      { id_bahan: b2, takaran_pemakaian: 100 },
      { id_bahan: b3, takaran_pemakaian: 100 },
      { id_bahan: b4, takaran_pemakaian: 1 }
    ]);

    refreshMasterBahan();
    refreshProducts();
  };

  const firstName = currentUser ? currentUser.nama_lengkap.split(' ')[0] : 'Kasir';
  const role = currentUser?.role || 'Kasir';

  const lowStockItems = trackStock ? products.filter(p => p.stock > 0 && p.stock <= 5) : [];
  const outOfStockCount = trackStock ? products.filter(p => p.stock <= 0).length : 0;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === Number(id));
    return { product, qty };
  }).filter(item => item.product);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalCartPrice = cartItems.reduce((acc, item) => acc + (item.product!.price * item.qty), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.locationRow}>
              <MapPin size={14} color={theme.colors.primary} />
              <Text variant="labelMedium" style={styles.locationText}>{userLocation.toUpperCase() || t('storeLocation')}</Text>
            </View>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{t('hello')} {firstName}!</Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon={() => isDark ? <Sun size={24} color="#FFD54F" /> : <Moon size={24} color={theme.colors.primary} />}
              onPress={toggleTheme}
            />
            <View ref={profileRef} collapsable={false}>
              <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')}>
                <Avatar.Text size={40} label={firstName.charAt(0).toUpperCase()} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Store Info Card */}
        <Card style={styles.storeCard} mode="contained">
          <Card.Title
            title={storeName}
            titleVariant="headlineSmall"
            titleStyle={{ fontWeight: 'bold' }}
            subtitle={`Total: ${products.length} ${t('registeredMenu')}`}
            right={(props) => <Store {...props} size={32} color={theme.colors.primary} style={{ marginRight: 16 }} />}
          />
        </Card>

        {/* Transaction History Summary Card */}
        {role !== 'Crew' && (
          <Card style={styles.historyCard} mode="contained" onPress={() => navigation.navigate('TransactionHistory')}>
            <Card.Title
              title={t('paymentHistory')}
              titleVariant="titleMedium"
              subtitle={`${transactions.length} ${t('paidTransactions')}`}
              left={(props) => <History {...props} size={28} color={theme.colors.primary} />}
              right={(props) => <ChevronRight {...props} size={24} color={theme.colors.onSurfaceVariant} style={{ marginRight: 16 }}/>}
            />
          </Card>
        )}

        {/* Quick Actions */}
        {role !== 'Crew' && role !== 'Kasir' && (
          <View style={styles.quickRow}>
            <View ref={reportRef} collapsable={false} style={{ flex: 1, minWidth: '30%' }}>
              <Card style={styles.quickCard} mode="contained" onPress={() => navigation.navigate('SalesReport')}>
                <Card.Content style={styles.quickCardContent}>
                  <View style={[styles.quickIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <BarChart3 size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.quickText}>{t('reports')}</Text>
                </Card.Content>
              </Card>
            </View>
            <Card style={styles.quickCard} mode="contained" onPress={() => navigation.navigate('Customers')}>
              <Card.Content style={styles.quickCardContent}>
                <View style={[styles.quickIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Users size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.quickText}>{t('customersBtn')}</Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* RND KOPI Module */}
        {role !== 'Kasir' && role !== 'Crew' && (
          <>
            <Text style={styles.catalogTitle}>HPP dan Resep</Text>
            <View style={styles.quickRow}>
              <Card style={styles.quickCard} mode="contained" onPress={() => navigation.navigate('MasterBahan')}>
                <Card.Content style={styles.quickCardContent}>
                  <View style={[styles.quickIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <Database size={24} color={theme.colors.onSecondaryContainer} />
                  </View>
                  <Text style={styles.quickText}>Master Bahan</Text>
                </Card.Content>
              </Card>
              <Card style={styles.quickCard} mode="contained" onPress={() => navigation.navigate('RecipeBuilder')}>
                <Card.Content style={styles.quickCardContent}>
                  <View style={[styles.quickIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <Beaker size={24} color={theme.colors.onSecondaryContainer} />
                  </View>
                  <Text style={styles.quickText}>Builder Resep</Text>
                </Card.Content>
              </Card>
              {role === 'Owner' && (
                <Card style={styles.quickCard} mode="contained" onPress={() => navigation.navigate('HPPDashboard')}>
                  <Card.Content style={styles.quickCardContent}>
                    <View style={[styles.quickIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                      <PieChart size={24} color={theme.colors.onSecondaryContainer} />
                    </View>
                    <Text style={styles.quickText}>Dashboard HPP</Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          </>
        )}

        {role !== 'Kasir' && (
          <>
            <Text style={[styles.catalogTitle, {marginTop: 8}]}>Inventory & Stok</Text>
            <View style={[styles.quickRow, { justifyContent: 'center' }]}>
              <Card style={[styles.quickCard, { maxWidth: '50%' }]} mode="contained" onPress={() => navigation.navigate('StockModule')}>
                <Card.Content style={styles.quickCardContent}>
                  <View style={[styles.quickIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                    <PackageSearch size={24} color={theme.colors.onTertiaryContainer} />
                  </View>
                  <Text style={styles.quickText}>Stok & Opname</Text>
                </Card.Content>
              </Card>
            </View>
          </>
        )}

        {(lowStockItems.length > 0 || outOfStockCount > 0) && role !== 'Kasir' && role !== 'Crew' && (
          <Surface style={styles.alertCard} elevation={2}>
            <AlertTriangle size={20} color={theme.colors.error} />
            <Text style={{ color: theme.colors.error, marginLeft: 8, fontWeight: 'bold' }}>
              {outOfStockCount > 0 ? `${outOfStockCount} ${t('outOfStock')} ` : ''}
              {lowStockItems.length > 0 ? `${lowStockItems.length} ${t('lowStock')}` : ''}
            </Text>
          </Surface>
        )}

        {role !== 'Crew' && (
          <View>
            <View ref={posRef} collapsable={false} style={styles.posHeaderRow}>
              <Text style={[styles.catalogTitle, { marginBottom: 0 }]}>{t('menuCatalog')} (POS)</Text>
              <Searchbar
                placeholder={t('searchProduct')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBox}
                inputStyle={styles.searchInput}
              />
            </View>

            {/* Product Grid */}
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Store size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t('emptyCatalog')}</Text>
                <Text style={styles.emptySubtitle}>{t('emptyCatalogSub')}</Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptySubtitle}>{t('noMatch')}</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredProducts.map(product => {
                  const qty = cart[product.id] || 0;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.gridItem, qty > 0 && { borderColor: theme.colors.primary, borderWidth: 2 }]}
                      onPress={() => addToCart(product)}
                    >
                      <FoodImageHolder imageUri={product.imageUri} style={styles.productImage} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text style={styles.productCategory}>{product.category}</Text>
                        <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                        {qty > 0 && (
                          <View style={styles.qtyContainer}>
                            <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => decreaseInCart(product)} />
                            <Text style={styles.qtyText}>{qty}</Text>
                            <IconButton icon="plus" size={20} iconColor={theme.colors.primary} onPress={() => addToCart(product)} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button - Hide when cart is active */}
      {role !== 'Crew' && role !== 'Kasir' && totalCartCount === 0 && (
        <View style={styles.fabContainer} ref={fabRef} collapsable={false}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('ManageMenu')}
          >
            <UtensilsCrossed size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Checkout Bar */}
      {totalCartCount > 0 && (
        <Surface style={styles.checkoutBar} elevation={4}>
          <View>
            <Text style={styles.checkoutItems}>{totalCartCount} {t('itemsSelected')}</Text>
            <Text style={styles.checkoutPrice}>{formatRupiah(totalCartPrice)}</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <IconButton icon="trash-can-outline" iconColor={theme.colors.error} onPress={clearCart} />
            <Button mode="contained" onPress={() => navigation.navigate('CheckoutConfirm')}>
              {t('continueOrder')}
            </Button>
          </View>
        </Surface>
      )}

      {/* Tutorial Overlay */}
      {!isTutorialDone && (
        <InAppTutorialOverlay
          isVisible={!isTutorialDone}
          steps={tutorialSteps}
          onFinish={completeTutorial}
          onSkip={completeTutorial}
          onStepChange={(index) => {
            if (index === 0 || index === 2 || index === 3) {
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            } else if (index === 1) {
              // Scroll down to the POS catalog area
              scrollRef.current?.scrollTo({ y: 300, animated: true });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
    marginLeft: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  storeCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  historyCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  quickCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 20,
  },
  quickCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.warning + '22',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
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
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
  },
  fab: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  posHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    height: 40,
    marginLeft: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 20,
  },
  searchInput: {
    minHeight: 40,
    fontSize: 14,
    alignSelf: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    marginTop: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  checkoutItems: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  checkoutPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
});
