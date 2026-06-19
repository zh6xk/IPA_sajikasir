import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { formatRupiah, generateWhatsAppText, formatWhatsAppNumber } from '../utils/formatter';
import { insertTransaction, decrementStock } from '../database/db';
import { ArrowLeft, MessageCircle, Users } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const CheckoutScreen = ({ navigation }: any) => {
  const { storeName, products, cart, clearCart, colors, taxRate, trackStock, refreshProducts, customers, addCustomer, qrisImage, qrisName, qrisNmid, bankName, bankAccount, bankAccountName, t } = useAppContext();
  const [customerName, setCustomerName] = useState('');
  const [targetWhatsApp, setTargetWhatsApp] = useState('');
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [discountInput, setDiscountInput] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [showCustomers, setShowCustomers] = useState(false);

  const styles = getStyles(colors);

  const [itemPortions, setItemPortions] = useState<Record<number, string>>({});
  const [itemFlavorLevels, setItemFlavorLevels] = useState<Record<number, string>>({});

  const portionSizes = ['Kecil', 'Normal', 'Besar', 'Jumbo'];
  const spicinessLevels = ['Tidak Pedas', 'Normal', 'Pedas', 'Sangat Pedas'];
  const sweetnessLevels = ['Kurang Manis', 'Normal', 'Sangat Manis'];
  const paymentMethods = ['Tunai', 'QRIS', 'Transfer'];

  const portionLabels: Record<string, string> = {
    'Kecil': t('portionSmall'),
    'Normal': t('portionNormal'),
    'Besar': t('portionLarge'),
    'Jumbo': t('portionJumbo'),
  };
  const spicinessLabels: Record<string, string> = {
    'Tidak Pedas': t('spicyNone'),
    'Normal': t('spicyNormal'),
    'Pedas': t('spicySpicy'),
    'Sangat Pedas': t('spicyVery'),
  };
  const sweetnessLabels: Record<string, string> = {
    'Kurang Manis': t('sweetLess'),
    'Normal': t('sweetNormal'),
    'Sangat Manis': t('sweetVery'),
  };
  const methodLabels: Record<string, string> = {
    'Tunai': t('payCash'),
    'QRIS': 'QRIS',
    'Transfer': t('payTransfer'),
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === Number(id));
    return { product, qty };
  }).filter(item => item.product);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product!.price * item.qty), 0);
  const discount = Math.min(parseFloat(discountInput) || 0, subtotal);
  const tax = useMemo(() => Math.round((subtotal - discount) * (taxRate / 100)), [subtotal, discount, taxRate]);
  const grandTotal = subtotal - discount + tax;
  const amountPaid = parseFloat(amountPaidInput) || 0;
  const change = amountPaid - grandTotal;

  const handleCheckout = async () => {
    if (!targetWhatsApp.trim()) {
      Alert.alert(t('error'), t('errWaRequired'));
      return;
    }

    if (paymentMethod === 'Tunai' && amountPaid > 0 && change < 0) {
      Alert.alert(t('errMoneyShortTitle'), t('errMoneyShortMsg'));
      return;
    }

    const receiptText = generateWhatsAppText(storeName, cartItems, itemNotes, itemPortions, itemFlavorLevels, {
      discount,
      tax,
      paymentMethod,
      amountPaid: amountPaid > 0 ? amountPaid : grandTotal,
      changeAmount: change > 0 ? change : 0,
      customerName,
    });

    const formattedWhatsApp = formatWhatsAppNumber(targetWhatsApp);

    // Auto-save customer if new
    const existingCustomer = customers.find(c => c.phone === formattedWhatsApp || c.phone === targetWhatsApp);
    if (!existingCustomer) {
      await addCustomer({
        name: customerName.trim() || t('newCustomer'),
        phone: formattedWhatsApp,
        note: '',
        createdAt: Date.now()
      });
    }

    const itemsJson = JSON.stringify(
      cartItems.map(item => ({
        productId: item.product!.id,
        name: item.product!.name,
        price: item.product!.price,
        qty: item.qty,
      }))
    );

    await insertTransaction({
      receiptText,
      totalAmount: grandTotal,
      timestamp: Date.now(),
      targetWhatsApp: formattedWhatsApp,
      itemsJson,
      paymentMethod,
      amountPaid: amountPaid > 0 ? amountPaid : grandTotal,
      changeAmount: change > 0 ? change : 0,
      discount,
      tax,
      customerName,
    });

    // Reduce stock if tracking is enabled.
    if (trackStock) {
      await decrementStock(cartItems.map(item => ({ productId: item.product!.id, qty: item.qty })));
      await refreshProducts();
    }

    const waUrl = `https://wa.me/${formattedWhatsApp}?text=${encodeURIComponent(receiptText)}`;

    try {
      await Linking.openURL(waUrl);
    } catch (e) {
      Alert.alert(t('waErrorTitle'), t('waErrorMsg'));
    }

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
          <Text style={styles.headerTitle}>{t('paymentConfirm')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('orderDetail')}</Text>

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
                  <Text style={styles.optionLabel}>{t('portion')}:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {portionSizes.map(size => (
                      <TouchableOpacity
                        key={size}
                        style={[styles.chip, currentPortion === size && styles.chipActive]}
                        onPress={() => setItemPortions(prev => ({ ...prev, [prodId]: size }))}
                      >
                        <Text style={[styles.chipText, currentPortion === size && styles.chipTextActive]}>{portionLabels[size] || size}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Flavor Level Selector */}
                  <Text style={styles.optionLabel}>{isAsin ? `${t('spicinessLevel')}:` : `${t('sweetnessLevel')}:`}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {flavorOptions.map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.chip, currentFlavor === level && styles.chipActive]}
                        onPress={() => setItemFlavorLevels(prev => ({ ...prev, [prodId]: level }))}
                      >
                        <Text style={[styles.chipText, currentFlavor === level && styles.chipTextActive]}>{isAsin ? spicinessLabels[level] : sweetnessLabels[level]}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={styles.noteInput}
                    placeholder={t('addNoteOptional')}
                    placeholderTextColor={colors.textSecondary}
                    value={itemNotes[prodId] || ''}
                    onChangeText={(text) => setItemNotes(prev => ({ ...prev, [prodId]: text }))}
                  />
                </View>
              );
            })}
          </View>

          {/* Payment Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('paymentSummary')}</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
              <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
            </View>

            <Text style={styles.label}>{t('discountAmount')}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={discountInput}
              onChangeText={setDiscountInput}
              keyboardType="numeric"
            />

            {taxRate > 0 && (
              <View style={[styles.summaryRow, { marginTop: 12 }]}>
                <Text style={styles.summaryLabel}>{t('taxAmount')} ({taxRate}%)</Text>
                <Text style={styles.summaryValue}>{formatRupiah(tax)}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('totalBill')}</Text>
              <Text style={styles.totalValue}>{formatRupiah(grandTotal)}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('paymentMethod')}</Text>
            <View style={styles.chipContainer}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.methodChip, paymentMethod === method && styles.chipActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.chipText, paymentMethod === method && styles.chipTextActive]}>{methodLabels[method] || method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === 'Tunai' && (
              <>
                <Text style={styles.label}>{t('amountPaidAmount')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`${t('minAmount')} ${formatRupiah(grandTotal)}`}
                  placeholderTextColor={colors.textSecondary}
                  value={amountPaidInput}
                  onChangeText={setAmountPaidInput}
                  keyboardType="numeric"
                />
                {amountPaid > 0 && (
                  <View style={[styles.summaryRow, { marginTop: 12 }]}>
                    <Text style={styles.summaryLabel}>{t('changeAmount')}</Text>
                    <Text style={[styles.changeValue, { color: change < 0 ? colors.danger : colors.success }]}>
                      {change < 0 ? `${t('lessAmount')} ${formatRupiah(Math.abs(change))}` : formatRupiah(change)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {paymentMethod === 'QRIS' && (
              <View style={styles.paymentInfoBox}>
                {qrisImage ? (
                  <>
                    <Image source={{ uri: qrisImage }} style={styles.qrisImage} resizeMode="contain" />
                    <Text style={styles.paymentInfoText}>{qrisName || 'QRIS STORE'}</Text>
                    {qrisNmid ? <Text style={styles.paymentSubText}>NMID: {qrisNmid}</Text> : null}
                    <Text style={styles.hintText}>{t('qrisHint')}</Text>
                  </>
                ) : (
                  <Text style={[styles.hintText, { color: colors.warning }]}>{t('qrisDummy')}</Text>
                )}
              </View>
            )}

            {paymentMethod === 'Transfer' && (
              <View style={styles.paymentInfoBox}>
                {bankName && bankAccount ? (
                  <>
                    <Text style={styles.paymentInfoTitle}>{t('transferTo')} {bankName}</Text>
                    <Text style={styles.paymentInfoText}>{bankAccount}</Text>
                    <Text style={styles.paymentSubText}>a.n {bankAccountName || '-'}</Text>
                  </>
                ) : (
                  <Text style={[styles.hintText, { color: colors.warning }]}>{t('transferDummy')}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.customerHeaderRow}>
              <Text style={styles.cardTitle}>{t('customerInfo')}</Text>
              {customers.length > 0 && (
                <TouchableOpacity style={styles.pickCustomerBtn} onPress={() => setShowCustomers(s => !s)}>
                  <Users size={16} color={colors.primary} />
                  <Text style={styles.pickCustomerText}>{t('pick')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {showCustomers && (
              <View style={styles.customerList}>
                {customers.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.customerItem}
                    onPress={() => {
                      setCustomerName(c.name);
                      setTargetWhatsApp(c.phone);
                      setShowCustomers(false);
                    }}
                  >
                    <Text style={styles.customerItemName}>{c.name}</Text>
                    <Text style={styles.customerItemPhone}>{c.phone}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>{t('buyerNameOptional')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Budi"
              placeholderTextColor={colors.textSecondary}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.label}>{t('buyerWhatsApp')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 628123456789"
              placeholderTextColor={colors.textSecondary}
              value={targetWhatsApp}
              onChangeText={setTargetWhatsApp}
              keyboardType="phone-pad"
            />
            <Text style={styles.hint}>{t('waHint')}</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <MessageCircle size={20} color="#FFF" style={styles.checkoutIcon} />
            <Text style={styles.checkoutButtonText}>{t('payAndSendWA')}</Text>
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  methodChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '900',
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
  customerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    marginBottom: 16,
  },
  pickCustomerText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  customerList: {
    marginBottom: 12,
    gap: 8,
  },
  customerItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  customerItemPhone: {
    fontSize: 12,
    color: colors.textSecondary,
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
  paymentInfoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.chipBackground,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  paymentSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  qrisImage: {
    width: 250,
    height: 250,
    marginBottom: 12,
    borderRadius: 8,
  },
});
