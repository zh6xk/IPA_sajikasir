import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { FoodImageHolder } from '../components/FoodImageHolder';
import { formatRupiah } from '../utils/formatter';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const OrderCatalogScreen = ({ navigation }: any) => {
  const { storeName, products, cart, addToCart, decreaseInCart, clearCart, colors } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const styles = getStyles(colors);
  const categories = ['Semua', 'Makanan', 'Minuman', 'Cemilan', 'Lainnya'];
  
  const filteredProducts = selectedCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === Number(id));
    return { product, qty };
  }).filter(item => item.product);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalCartPrice = cartItems.reduce((acc, item) => acc + (item.product!.price * item.qty), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Layanan Order</Text>
          <Text style={styles.headerSubtitle}>{storeName}</Text>
        </View>
        {totalCartCount > 0 ? (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Kosongkan</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView contentContainerStyle={styles.productList}>
        {filteredProducts.map(product => {
          const qty = cart[product.id] || 0;
          return (
            <View key={product.id} style={styles.productCard}>
              <FoodImageHolder imageUri={product.imageUri} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                
                <View style={styles.qtyContainer}>
                  {qty > 0 ? (
                    <>
                      <TouchableOpacity style={styles.qtyButton} onPress={() => decreaseInCart(product)}>
                        {qty === 1 ? <Trash2 size={16} color={colors.danger} /> : <Text style={styles.qtyButtonText}>-</Text>}
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity style={styles.qtyButton} onPress={() => addToCart(product)}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.addButton} onPress={() => addToCart(product)}>
                      <Text style={styles.addButtonText}>Tambah</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomCountText}>{totalCartCount} Item Terpilih</Text>
            <Text style={styles.bottomPriceText}>{formatRupiah(totalCartPrice)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('CheckoutConfirm')}>
            <Text style={styles.checkoutButtonText}>Lanjut Order</Text>
          </TouchableOpacity>
        </View>
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  clearText: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  categoryContainer: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.chipBackground,
  },
  categoryTabActive: {
    backgroundColor: colors.chipActiveBg,
  },
  categoryText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.primary,
  },
  productList: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  qtyText: {
    width: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bottomPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
