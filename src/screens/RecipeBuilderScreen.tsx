import { useTheme } from 'react-native-paper';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { formatRupiah } from '../utils/formatter';
import { getResepProduk, updateResepProduk } from '../database/db';

export const RecipeBuilderScreen = ({ navigation, route }: any) => {
  const { colors, addProduct, editProduct, masterBahan } = useAppContext();
  const theme = useTheme();
  const styles = getStyles(theme);

  const existingProduct = route.params?.product;

  const [namaProduk, setNamaProduk] = useState(existingProduct ? existingProduct.name : '');
  const [hargaJual, setHargaJual] = useState(existingProduct ? existingProduct.price.toString() : '');
  const [kategori, setKategori] = useState(existingProduct ? existingProduct.category : 'Minuman');
  
  const [recipeItems, setRecipeItems] = useState<{ id_bahan: number; takaran: string }[]>([]);

  useEffect(() => {
    if (existingProduct) {
      loadRecipe(existingProduct.id);
    }
  }, [existingProduct]);

  const loadRecipe = async (prodId: number) => {
    const data = await getResepProduk(prodId);
    setRecipeItems(data.map(d => ({ id_bahan: d.id_bahan, takaran: d.takaran_pemakaian.toString() })));
  };

  const handleSave = async () => {
    if (!namaProduk || !hargaJual) {
      Alert.alert('Error', 'Nama produk dan harga jual harus diisi');
      return;
    }
    
    for (const item of recipeItems) {
      if (!item.id_bahan || !item.takaran) {
        Alert.alert('Error', 'Lengkapi semua data bahan dan takaran pada resep');
        return;
      }
    }

    const payload = recipeItems.map(item => ({
      id_bahan: item.id_bahan,
      takaran_pemakaian: parseFloat(item.takaran.replace(/[^0-9.]/g, '')) || 0
    }));

    const parsedPrice = parseFloat(hargaJual.replace(/[^0-9.]/g, '')) || 0;

    let productId = existingProduct?.id;

    if (existingProduct) {
      await editProduct({
        ...existingProduct,
        name: namaProduk,
        price: parsedPrice,
        category: kategori,
      });
    } else {
      productId = await addProduct({
        name: namaProduk,
        price: parsedPrice,
        category: kategori,
        flavorType: 'Manis',
        stock: 100,
        imageUri: null,
      });
    }

    if (productId) {
      await updateResepProduk(productId, payload);
    }
    
    Alert.alert('Sukses', existingProduct ? 'Resep berhasil diubah!' : 'Menu dan Resep berhasil dibuat!');
    navigation.goBack();
  };

  const addRow = () => {
    setRecipeItems([...recipeItems, { id_bahan: 0, takaran: '' }]);
  };

  const removeRow = (index: number) => {
    const newItems = [...recipeItems];
    newItems.splice(index, 1);
    setRecipeItems(newItems);
  };

  const updateRow = (index: number, field: 'id_bahan' | 'takaran', value: any) => {
    const newItems = [...recipeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRecipeItems(newItems);
  };

  const calculateTotalHPP = () => {
    return recipeItems.reduce((sum, item) => {
      const bahan = masterBahan.find(b => b.id_bahan === item.id_bahan);
      if (!bahan) return sum;
      const takaran = parseFloat(item.takaran.replace(/[^0-9.]/g, '')) || 0;
      return sum + (takaran * bahan.harga_per_satuan_terkecil);
    }, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>Builder Resep</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.productSelector}>
          <Card.Content>
            <View style={styles.formGroup}>
              <TextInput
                mode="outlined"
                label="Nama Produk (Menu)"
                style={styles.inputMenu}
                value={namaProduk}
                onChangeText={setNamaProduk}
              />
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  label="Harga Jual (Rp)"
                  style={styles.inputMenu}
                  keyboardType="numeric"
                  value={hargaJual}
                  onChangeText={setHargaJual}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  label="Kategori"
                  style={styles.inputMenu}
                  value={kategori}
                  onChangeText={setKategori}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.recipeSection}>
            <View style={styles.recipeHeader}>
              <Text variant="titleMedium">Bahan Baku (Resep)</Text>
              <Button icon="plus" mode="text" onPress={addRow}>Tambah Bahan</Button>
            </View>

            {recipeItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Belum ada bahan untuk resep ini.</Text>
              </View>
            ) : (
              recipeItems.map((item, index) => {
                const bahan = masterBahan.find(b => b.id_bahan === item.id_bahan);
                const subtotal = bahan ? (parseFloat(item.takaran.replace(/[^0-9.]/g, '')) || 0) * bahan.harga_per_satuan_terkecil : 0;
                
                return (
                  <View key={index} style={styles.recipeRow}>
                    <View style={styles.rowTop}>
                      <Text variant="labelLarge">Bahan #{index + 1}</Text>
                      <TouchableOpacity onPress={() => removeRow(index)}>
                        <Trash2 size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.materialScroll}>
                      {masterBahan.map(b => (
                        <TouchableOpacity 
                          key={b.id_bahan}
                          style={[styles.materialChip, item.id_bahan === b.id_bahan && { backgroundColor: theme.colors.primary }]}
                          onPress={() => updateRow(index, 'id_bahan', b.id_bahan)}
                        >
                          <Text style={[styles.materialChipText, item.id_bahan === b.id_bahan && { color: '#FFF' }]}>
                            {b.nama_bahan}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.rowBottom}>
                      <View style={styles.inputWrap}>
                        <TextInput
                          mode="outlined"
                          label="Takaran (gram/ml)"
                          style={styles.inputSmall}
                          keyboardType="numeric"
                          value={item.takaran}
                          onChangeText={(text) => updateRow(index, 'takaran', text)}
                        />
                      </View>
                      <View style={styles.subtotalWrap}>
                        <Text style={styles.inputLabel}>Subtotal Biaya</Text>
                        <Text style={styles.subtotalValue}>{formatRupiah(subtotal)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            <View style={styles.totalBox}>
              <Text variant="titleMedium" style={styles.totalLabel}>Total HPP per Porsi</Text>
              <Text variant="headlineSmall" style={styles.totalValue}>{formatRupiah(calculateTotalHPP())}</Text>
            </View>

            <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>
              Simpan Resep & Produk
            </Button>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.surfaceVariant },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontWeight: 'bold' },
  content: { padding: 16 },
  productSelector: { backgroundColor: theme.colors.surfaceVariant, padding: 16, borderRadius: 20, marginBottom: 16 },
  formGroup: { marginBottom: 8 },
  inputMenu: { backgroundColor: 'transparent', marginBottom: 8 },
  recipeSection: { paddingBottom: 40 },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  emptyBox: { padding: 24, alignItems: 'center', backgroundColor: theme.colors.secondaryContainer, borderRadius: 8, borderStyle: 'dashed', marginBottom: 16 },
  emptyText: { color: theme.colors.onSurfaceVariant, fontStyle: 'italic' },
  recipeRow: { backgroundColor: theme.colors.surfaceVariant, borderRadius: 16, padding: 16, marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  materialScroll: { flexDirection: 'row', marginBottom: 16 },
  materialChip: { backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: theme.colors.outline },
  materialChipText: { fontSize: 13, color: theme.colors.onSurface },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  inputWrap: { flex: 1, marginRight: 16 },
  inputSmall: { backgroundColor: 'transparent' },
  subtotalWrap: { flex: 1, marginLeft: 8, backgroundColor: theme.colors.background, borderRadius: 8, padding: 10, justifyContent: 'center' },
  inputLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  subtotalValue: { fontSize: 16, fontWeight: 'bold' },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.primaryContainer, padding: 16, borderRadius: 8, marginBottom: 24 },
  totalLabel: { fontWeight: 'bold', color: theme.colors.onPrimaryContainer },
  totalValue: { fontWeight: '900', color: theme.colors.primary },
  saveBtn: { borderRadius: 12, marginTop: 8 }
});
