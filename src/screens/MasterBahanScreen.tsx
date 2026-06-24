import React, { useState } from 'react';
import { View, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native';
import { Text, TextInput, Card, Button, IconButton, FAB, useTheme, Chip, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';
import { formatRupiah } from '../utils/formatter';
import { MasterBahan } from '../database/db';

const SATUAN_OPTIONS = ['Kilogram', 'Kaleng', 'Liter', 'Pack', 'Pcs'];

export const MasterBahanScreen = ({ navigation }: any) => {
  const { masterBahan, addMasterBahan, editMasterBahan, removeMasterBahan } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(theme);

  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [namaBahan, setNamaBahan] = useState('');
  const [kategori, setKategori] = useState('Umum');
  const [satuanBeli, setSatuanBeli] = useState('Kilogram');
  const [hargaBeli, setHargaBeli] = useState('');
  const [konversi, setKonversi] = useState('');
  const [stokMinimum, setStokMinimum] = useState('');

  const resetForm = () => {
    setNamaBahan('');
    setKategori('Umum');
    setSatuanBeli('Kilogram');
    setHargaBeli('');
    setKonversi('');
    setStokMinimum('');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: MasterBahan) => {
    setEditingId(item.id_bahan);
    setNamaBahan(item.nama_bahan);
    setKategori(item.kategori || 'Umum');
    setSatuanBeli(item.satuan_beli);
    setHargaBeli(item.harga_beli.toString());
    setKonversi(item.konversi_gram_ml.toString());
    setStokMinimum((item.stok_minimum || 0).toString());
    setModalVisible(true);
  };

  const handleDelete = (item: MasterBahan) => {
    Alert.alert(
      'Hapus Bahan',
      `Yakin ingin menghapus ${item.nama_bahan}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => removeMasterBahan(item.id_bahan) }
      ]
    );
  };

  const handleSave = async () => {
    if (!namaBahan || !hargaBeli || !konversi) {
      Alert.alert('Error', 'Mohon lengkapi semua data');
      return;
    }

    const hb = parseFloat(hargaBeli.replace(/[^0-9.]/g, '')) || 0;
    const kv = parseFloat(konversi.replace(/[^0-9.]/g, '')) || 1;
    const sm = parseFloat(stokMinimum.replace(/[^0-9.]/g, '')) || 0;
    const hp = hb / kv;

    if (editingId) {
      await editMasterBahan({
        id_bahan: editingId,
        nama_bahan: namaBahan,
        satuan_beli: satuanBeli,
        harga_beli: hb,
        konversi_gram_ml: kv,
        harga_per_satuan_terkecil: hp,
        stok_sistem: masterBahan.find(b => b.id_bahan === editingId)?.stok_sistem || 0,
        stok_minimum: sm,
        kategori: kategori,
        stok_masuk: masterBahan.find(b => b.id_bahan === editingId)?.stok_masuk || 0,
        stok_keluar: masterBahan.find(b => b.id_bahan === editingId)?.stok_keluar || 0,
        stok_scrap: masterBahan.find(b => b.id_bahan === editingId)?.stok_scrap || 0
      });
    } else {
      await addMasterBahan({
        nama_bahan: namaBahan,
        satuan_beli: satuanBeli,
        harga_beli: hb,
        konversi_gram_ml: kv,
        harga_per_satuan_terkecil: hp,
        stok_sistem: 0,
        stok_minimum: sm,
        kategori: kategori,
        stok_masuk: 0,
        stok_keluar: 0,
        stok_scrap: 0
      });
    }

    setModalVisible(false);
  };

  const parsedHarga = parseFloat(hargaBeli.replace(/[^0-9.]/g, '')) || 0;
  const parsedKonversi = parseFloat(konversi.replace(/[^0-9.]/g, '')) || 1;
  const computedHargaTerkecil = parsedHarga / parsedKonversi;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.headerTitle}>Master Bahan (RND)</Text>
      </View>

      <FlatList
        data={masterBahan}
        keyExtractor={item => item.id_bahan.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada bahan baku.</Text>
            <Text style={styles.emptySubText}>Tambahkan bahan baku beserta harga dan konversinya.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card mode="outlined" style={styles.card}>
            <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text variant="titleMedium" style={styles.itemName}>{item.nama_bahan}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.kategori || 'Umum'}</Text>
              </View>
              <View style={styles.actionRow}>
                <IconButton icon="pencil" iconColor={theme.colors.primary} size={20} onPress={() => openEditModal(item)} />
                <IconButton icon="delete" iconColor={theme.colors.error} size={20} onPress={() => handleDelete(item)} />
              </View>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Beli</Text>
                <Text style={styles.statValue}>{formatRupiah(item.harga_beli)} / {item.satuan_beli}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Konversi</Text>
                <Text style={styles.statValue}>{item.konversi_gram_ml} gram/ml</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Min. Stok</Text>
                <Text style={styles.statValue}>{item.stok_minimum || 0} {item.satuan_beli}</Text>
              </View>
              <View style={styles.statBoxActive}>
                <Text style={styles.statLabelActive}>HPP / gram(ml)</Text>
                <Text style={styles.statValueActive}>{formatRupiah(item.harga_per_satuan_terkecil)}</Text>
              </View>
            </View>
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        color="#FFF"
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={5}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>{editingId ? 'Edit Bahan' : 'Tambah Bahan'}</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <TextInput
                  mode="outlined"
                  label="Sub Kategori"
                  placeholder="Misal: Sirup, Susu, Biji Kopi"
                  value={kategori}
                  onChangeText={setKategori}
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  mode="outlined"
                  label="Nama Bahan Baku"
                  placeholder="Misal: SKM Carnation"
                  value={namaBahan}
                  onChangeText={setNamaBahan}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Satuan Beli</Text>
                <View style={styles.chipRow}>
                  {SATUAN_OPTIONS.map(opt => (
                    <Chip
                      key={opt}
                      mode={satuanBeli === opt ? 'flat' : 'outlined'}
                      selected={satuanBeli === opt}
                      onPress={() => setSatuanBeli(opt)}
                      style={styles.chip}
                    >
                      {opt}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    mode="outlined"
                    label="Harga Beli"
                    placeholder="Rp0"
                    value={hargaBeli}
                    onChangeText={setHargaBeli}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    mode="outlined"
                    label="Konversi (gram/ml)"
                    placeholder="Misal: 490"
                    value={konversi}
                    onChangeText={setKonversi}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  mode="outlined"
                  label="Stok Minimum (Habis/Menipis)"
                  placeholder="Misal: 5"
                  value={stokMinimum}
                  onChangeText={setStokMinimum}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Harga per gram/ml:</Text>
                <Text style={styles.previewValue}>{formatRupiah(computedHargaTerkecil)}</Text>
              </View>

              <Button mode="contained" onPress={handleSave} style={styles.saveButton} contentStyle={{ paddingVertical: 8 }}>
                Simpan Bahan
              </Button>
            </ScrollView>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statBoxActive: {
    flex: 1,
    backgroundColor: theme.colors.secondaryContainer,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabelActive: {
    fontSize: 11,
    color: theme.colors.onSecondaryContainer,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statValueActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSecondaryContainer,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  previewBox: {
    backgroundColor: theme.colors.secondaryContainer,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    color: theme.colors.onSecondaryContainer,
    fontWeight: 'bold',
  },
  previewValue: {
    fontSize: 18,
    color: theme.colors.onSecondaryContainer,
    fontWeight: 'bold',
  },
  saveButton: {
    borderRadius: 12,
  },
});
