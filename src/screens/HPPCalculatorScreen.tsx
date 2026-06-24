import React, { useState } from 'react';
import { useTheme } from 'react-native-paper';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';
import { formatRupiah } from '../utils/formatter';

interface CostItem {
  id: string;
  name: string;
  qty: string;
  price: string;
}

export const HPPCalculatorScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(colors);

  const [materials, setMaterials] = useState<CostItem[]>([
    { id: '1', name: '', qty: '1', price: '' }
  ]);
  const [ops, setOps] = useState<CostItem[]>([]);
  
  const [yieldQty, setYieldQty] = useState('30');
  const [profitMargin, setProfitMargin] = useState('100');

  const parseIndonesianNumber = (val: string) => {
    // Hapus titik (sebagai pemisah ribuan)
    let clean = val.replace(/\./g, '');
    // Ganti koma jadi titik (sebagai desimal)
    clean = clean.replace(/,/g, '.');
    // Hanya sisakan angka dan titik desimal
    clean = clean.replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  };

  const updateItem = (list: CostItem[], setter: any, id: string, field: keyof CostItem, value: string) => {
    setter(list.map((item: CostItem) => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = (list: CostItem[], setter: any) => {
    setter([...list, { id: Math.random().toString(), name: '', qty: '1', price: '' }]);
  };

  const removeItem = (list: CostItem[], setter: any, id: string) => {
    setter(list.filter((item: CostItem) => item.id !== id));
  };

  const calculateTotal = (list: CostItem[]) => {
    return list.reduce((sum, item) => {
      const q = parseIndonesianNumber(item.qty);
      const p = parseIndonesianNumber(item.price);
      return sum + (q * p);
    }, 0);
  };

  const totalBahan = calculateTotal(materials);
  const totalOps = calculateTotal(ops);
  const grandTotal = totalBahan + totalOps;
  
  const yieldNum = parseIndonesianNumber(yieldQty) || 1;
  const hppPerProduct = yieldNum > 0 ? grandTotal / yieldNum : 0;

  const profitPercent = parseIndonesianNumber(profitMargin);
  const profitNominal = hppPerProduct * (profitPercent / 100);
  const recommendedPrice = hppPerProduct + profitNominal;

  const renderCostList = (title: string, list: CostItem[], setter: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={() => addItem(list, setter)} style={styles.addButton}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addButtonText}>Tambah</Text>
        </TouchableOpacity>
      </View>
      
      {list.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada data yang ditambahkan.</Text>
        </View>
      ) : (
        <View>
          {list.map((item, index) => {
            const q = parseIndonesianNumber(item.qty);
            const p = parseIndonesianNumber(item.price);
            return (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.cardItemHeader}>
                  <Text style={styles.itemNumber}>#{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(list, setter, item.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.cardItemNameInput}
                  placeholder="Nama Item (Misal: Telur 1kg)"
                  placeholderTextColor={colors.textSecondary}
                  value={item.name}
                  onChangeText={(val) => updateItem(list, setter, item.id, 'name', val)}
                />
                
                <View style={styles.cardItemBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabelSmall}>Kuantitas</Text>
                    <TextInput
                      style={styles.cardItemInput}
                      placeholder="1"
                      placeholderTextColor={colors.textSecondary}
                      value={item.qty}
                      keyboardType="numeric"
                      onChangeText={(val) => updateItem(list, setter, item.id, 'qty', val)}
                    />
                  </View>
                  <Text style={styles.multiplyIcon}>×</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabelSmall}>Harga Satuan</Text>
                    <TextInput
                      style={styles.cardItemInput}
                      placeholder="Rp0"
                      placeholderTextColor={colors.textSecondary}
                      value={item.price}
                      keyboardType="numeric"
                      onChangeText={(val) => updateItem(list, setter, item.id, 'price', val)}
                    />
                  </View>
                </View>
                
                <View style={styles.cardItemFooter}>
                  <Text style={styles.cardItemTotalLabel}>Total:</Text>
                  <Text style={styles.cardItemTotalValue}>{formatRupiah(q * p)}</Text>
                </View>
              </View>
            );
          })}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal {title}</Text>
            <Text style={styles.subtotalValue}>{formatRupiah(calculateTotal(list))}</Text>
          </View>
        </View>
      )}
    </View>
  );

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
          <Text style={styles.headerTitle}>Kalkulator HPP</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.helperText}>
            Gunakan kalkulator ini untuk mensimulasikan Harga Pokok Penjualan (HPP) layaknya spreadsheet.
          </Text>

          {renderCostList('BIAYA BAHAN', materials, setMaterials)}
          {renderCostList('BIAYA OPERASIONAL', ops, setOps)}

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total HPP Keseluruhan</Text>
              <Text style={styles.summaryValue}>{formatRupiah(grandTotal)}</Text>
            </View>
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Jumlah Produk Dihasilkan</Text>
              <TextInput
                style={styles.summaryInput}
                value={yieldQty}
                onChangeText={setYieldQty}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {color: colors.primary, fontWeight: 'bold'}]}>HPP 1 Produk</Text>
              <Text style={[styles.summaryValue, {color: colors.primary, fontSize: 18}]}>{formatRupiah(hppPerProduct)}</Text>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Target Profit (%)</Text>
              <TextInput
                style={[styles.summaryInput, {backgroundColor: '#FEF08A', borderColor: '#FACC15', color: '#854D0E', fontWeight: 'bold'}]}
                value={profitMargin}
                onChangeText={setProfitMargin}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nominal Profit</Text>
              <Text style={styles.summaryValue}>{formatRupiah(profitNominal)}</Text>
            </View>

            <View style={[styles.summaryRow, { marginTop: 12, backgroundColor: colors.chipBackground, padding: 12, borderRadius: 8 }]}>
              <Text style={[styles.summaryLabel, {fontSize: 16, fontWeight: '900'}]}>Harga Jual</Text>
              <Text style={[styles.summaryValue, {fontSize: 20, color: colors.success, fontWeight: '900'}]}>{formatRupiah(recommendedPrice)}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              navigation.navigate('AddEditProduct', { 
                initialPrice: recommendedPrice.toString()
              });
            }}
          >
            <Save size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Jadikan Menu SajiKasir</Text>
          </TouchableOpacity>

        </ScrollView>
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
    paddingBottom: 40,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.chipBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardItem: {
    backgroundColor: colors.chipBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  cardItemNameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardItemBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabelSmall: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  cardItemInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  multiplyIcon: {
    fontSize: 18,
    color: colors.textSecondary,
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontWeight: 'bold',
  },
  cardItemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  cardItemTotalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  cardItemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  summaryInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 100,
    textAlign: 'center',
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.chipBackground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
