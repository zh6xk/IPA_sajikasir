import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, generateWhatsAppText } from '../utils/formatter';
import { insertTransaction } from '../database/db';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const CheckoutScreen = ({ navigation }: any) => {
  const { storeName, products, cart, clearCart, colors } = useAppContext();
  const [customerName, setCustomerName] = useState('');
  const [targetWhatsApp, setTargetWhatsApp] = useState('');
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  
  const styles = getStyles(colors);

  const [itemPortions, setItemPortions] = useState<Record<number, string>>({});
  const [itemFlavorLevels, setItemFlavorLevels] = useState<Record<number, string>>({});

  const portionSizes = ['Kecil', 'Normal', 'Besar', 'Jumbo'];
  const spicinessLevels = ['Tidak Pedas', 'Normal', 'Pedas', 'Sangat Pedas'];
  const sweetnessLevels = ['Kurang Manis', 'Normal', 'Sangat Manis'];

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === Number(id));
    return { product, qty };
  }).filter(item => item.product);

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.product!.price * item.qty), 0);

  const handleCheckout = async () => {
    if (!targetWhatsApp.trim()) {
      Alert.alert('Error', 'Nomor WhatsApp pembeli wajib diisi.');
      return;
    }

    const receiptText = generateWhatsAppText(storeName, cartItems, itemNotes, itemPortions, itemFlavorLevels);
    
    // Save to DB
    await insertTransaction({
      receiptText,
      totalAmount,
      timestamp: Date.now(),
      targetWhatsApp
    });

    // Send to WA
    const waUrl = `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(receiptText)}`;
    
    try {
      await Linking.openURL(waUrl);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat membuka WhatsApp. Pastikan WhatsApp sudah terinstal.');
    }

    // Clear cart & navigate home
    clearCart();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Konfirmasi Pembayaran</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rincian Pesanan</Text>
            
            {cartItems.map(item => {
              const prodId = item.product!.id;
              const isAsin = item.product!.flavorType === 'Asin';
              const flavorOptions = isAsin ? spicinessLevels : sweetnessLevels;
              const currentPortion = itemPortions[prodId] || 'Normal';
              const currentFlavor = itemFlavorLevels[prodId] || 'Normal';

              return (
                <View key={prodId} style={styles.orderItem}>
                  <View style={styles.orderItemHeader}>
                    <Text style={styles.orderItemName}>{item.qty}x {item.product!.name}</Text>
                    <Text style={styles.orderItemPrice}>{formatRupiah(item.product!.price * item.qty)}</Text>
                  </View>

                  {/* Portion Selector */}
                  <Text style={styles.optionLabel}>Porsi:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {portionSizes.map(size => (
                      <TouchableOpacity
                        key={size}
                        style={[styles.chip, currentPortion === size && styles.chipActive]}
                        onPress={() => setItemPortions(prev => ({ ...prev, [prodId]: size }))}
                      >
                        <Text style={[styles.chipText, currentPortion === size && styles.chipTextActive]}>{size}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Flavor Level Selector */}
                  <Text style={styles.optionLabel}>{isAsin ? 'Tingkat Kepedasan:' : 'Tingkat Kemanisan:'}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {flavorOptions.map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.chip, currentFlavor === level && styles.chipActive]}
                        onPress={() => setItemFlavorLevels(prev => ({ ...prev, [prodId]: level }))}
                      >
                        <Text style={[styles.chipText, currentFlavor === level && styles.chipTextActive]}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={styles.noteInput}
                    placeholder="Tambah catatan (opsional)"
                    placeholderTextColor={colors.textSecondary}
                    value={itemNotes[prodId] || ''}
                    onChangeText={(text) => setItemNotes(prev => ({ ...prev, [prodId]: text }))}
                  />
                </View>
              );
            })}

            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tagihan</Text>
              <Text style={styles.totalValue}>{formatRupiah(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Pelanggan</Text>
            
            <Text style={styles.label}>Nama Pembeli (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Budi"
              placeholderTextColor={colors.textSecondary}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.label}>Nomor WhatsApp Pembeli</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 628123456789"
              placeholderTextColor={colors.textSecondary}
              value={targetWhatsApp}
              onChangeText={setTargetWhatsApp}
              keyboardType="phone-pad"
            />
            <Text style={styles.hint}>Gunakan awalan 62 atau kode negara tanpa tanda +</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <MessageCircle size={20} color="#FFF" style={styles.checkoutIcon} />
            <Text style={styles.checkoutButtonText}>Kirim Struk via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  orderItem: {
    marginBottom: 20,
    backgroundColor: colors.chipBackground,
    padding: 12,
    borderRadius: 12,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  chipScroll: {
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.chipActiveBg,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  noteInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.chipBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutIcon: {
    marginRight: 8,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
