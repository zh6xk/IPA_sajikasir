import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../utils/formatter';
import { ArrowLeft, Plus, Edit2, Trash2, Package } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';
import { Ingredient } from '../database/db';

export const ManageIngredientsScreen = ({ navigation }: any) => {
  const { ingredients, addIngredient, editIngredient, removeIngredient, colors, t } = useAppContext();
  const styles = getStyles(colors);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('gram');
  const [price, setPrice] = useState('');

  const handleDelete = (id: number) => {
    Alert.alert(t('deleteConfirm') || 'Hapus?', 'Apakah Anda yakin ingin menghapus bahan baku ini?', [
      { text: t('cancel') || 'Batal', style: 'cancel' },
      { text: t('delete') || 'Hapus', style: 'destructive', onPress: () => removeIngredient(id) }
    ]);
  };

  const openModal = (item?: Ingredient) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setUnit(item.unit);
      setPrice(item.price.toString());
    } else {
      setEditingItem(null);
      setName('');
      setUnit('gram');
      setPrice('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !unit.trim() || !price.trim()) {
      Alert.alert('Error', 'Semua kolom wajib diisi!');
      return;
    }

    const cleanPrice = price.replace(/[^0-9]/g, '');
    const numericPrice = parseFloat(cleanPrice);
    
    if (isNaN(numericPrice)) {
      Alert.alert('Error', 'Harga tidak valid!');
      return;
    }

    try {
      if (editingItem) {
        await editIngredient({
          ...editingItem,
          name,
          unit,
          price: numericPrice,
        });
      } else {
        await addIngredient({
          name,
          unit,
          price: numericPrice,
          stock: 0, // default
        });
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Bahan Baku</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {ingredients.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Belum ada bahan baku</Text>
            <Text style={styles.emptySubtitle}>Tekan tombol + untuk menambah bahan mentah/resep.</Text>
          </View>
        ) : (
          ingredients.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{formatRupiah(item.price)} / {item.unit}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
                  <Edit2 size={16} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Bahan' : 'Tambah Bahan'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Bahan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Tepung Terigu"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Satuan (Dasar)</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: gram, ml, pcs"
                placeholderTextColor={colors.textSecondary}
                value={unit}
                onChangeText={setUnit}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Harga per Satuan tersebut</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 12 (untuk 1 gram)"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Simpan Bahan</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
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
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
