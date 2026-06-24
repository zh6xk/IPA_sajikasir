import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, TextInput, useTheme, DataTable, Surface, IconButton, Chip, Divider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, PackageSearch, Activity, FileText } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';
import { formatRupiah } from '../utils/formatter';
import { getLogStokByBahan, getStockOpnames, insertLogStok, insertStockOpname, StockOpname, LogStok, MasterBahan } from '../database/db';

export const StockModuleScreen = ({ navigation }: any) => {
  const { masterBahan, refreshMasterBahan } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(theme);

  const [activeTab, setActiveTab] = useState('dashboard');

  // --- TAB 1: Dashboard Stok ---
  const [bahanStats, setBahanStats] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedBahanId, setSelectedBahanId] = useState<number | null>(null);
  const [logType, setLogType] = useState('Masuk/Beli');
  const [logJumlah, setLogJumlah] = useState('');
  const [logKeterangan, setLogKeterangan] = useState('');

  // --- TAB 2: Form Opname & Log Stok ---
  const [opnameType, setOpnameType] = useState('Masuk'); // 'Masuk', 'Scrap', 'Opname'
  const [opnameBahanId, setOpnameBahanId] = useState<number | null>(null);
  const [opnameInput, setOpnameInput] = useState('');
  const [opnameKeterangan, setOpnameKeterangan] = useState('');

  // --- TAB 3: Laporan Kekurangan ---
  const [laporan, setLaporan] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab, masterBahan]);

  const loadData = async () => {
    if (activeTab === 'dashboard') {
      const stats = [];
      for (const bahan of masterBahan) {
        const logs = await getLogStokByBahan(bahan.id_bahan);
        
        let totalMasuk = 0;
        let totalKeluar = 0;
        let totalScrap = 0;

        logs.forEach(l => {
          if (l.jenis_pergerakan === 'Masuk/Beli' || l.jenis_pergerakan === 'Berlebih') totalMasuk += l.jumlah;
          else if (l.jenis_pergerakan === 'Keluar/Terjual') totalKeluar += l.jumlah;
          else if (l.jenis_pergerakan === 'Buang/Rusak' || l.jenis_pergerakan === 'Bocor/Kurang') totalScrap += l.jumlah;
        });

        stats.push({
          ...bahan,
          kategori: bahan.kategori || 'Umum',
          totalMasuk,
          totalKeluar,
          totalScrap,
          stok_sistem: bahan.stok_sistem || 0,
          stok_minimum: bahan.stok_minimum || 0
        });
      }
      setBahanStats(stats);
    } else if (activeTab === 'laporan') {
      const shortages = masterBahan
        .filter(b => (b.stok_sistem || 0) < (b.stok_minimum || 0))
        .map(b => ({
          ...b,
          stok_sistem: b.stok_sistem || 0,
          stok_minimum: b.stok_minimum || 0,
          kekurangan: (b.stok_minimum || 0) - (b.stok_sistem || 0)
        }));
      setLaporan(shortages);
    }
  };

  const handleSaveOpname = async () => {
    if (!opnameBahanId || !opnameInput) {
      Alert.alert('Error', 'Pilih bahan dan masukkan jumlah');
      return;
    }
    const bahan = masterBahan.find(b => b.id_bahan === opnameBahanId);
    if (!bahan) return;

    const inputNum = parseFloat(opnameInput.replace(/[^0-9.]/g, '')) || 0;

    if (opnameType === 'Opname') {
      const stokSistem = bahan.stok_sistem || 0;
      const selisih = inputNum - stokSistem;
      
      if (selisih < 0) {
        // Log as Stock Keluar
        await insertLogStok({
          tanggal: Date.now(),
          id_bahan: opnameBahanId,
          jenis_pergerakan: 'Keluar/Terjual',
          jumlah: Math.abs(selisih),
          keterangan: opnameKeterangan || 'Pemakaian dari Opname'
        });
      } else if (selisih > 0) {
        // Log as Stock Masuk/Berlebih
        await insertLogStok({
          tanggal: Date.now(),
          id_bahan: opnameBahanId,
          jenis_pergerakan: 'Berlebih',
          jumlah: selisih,
          keterangan: opnameKeterangan || 'Kelebihan dari Opname'
        });
      }
      
      Alert.alert('Sukses', `Data Bahan Saat Ini berhasil diupdate.`);
    } else {
      // Masuk or Scrap
      const pergerakan = opnameType === 'Masuk' ? 'Masuk/Beli' : 'Buang/Rusak';
      await insertLogStok({
        tanggal: Date.now(),
        id_bahan: opnameBahanId,
        jenis_pergerakan: pergerakan,
        jumlah: inputNum,
        keterangan: opnameKeterangan
      });
      Alert.alert('Sukses', 'Pergerakan stok berhasil dicatat');
    }

    setOpnameBahanId(null);
    setOpnameInput('');
    setOpnameKeterangan('');
    await refreshMasterBahan();
    if (opnameType === 'Opname') {
      setActiveTab('laporan');
    } else {
      setActiveTab('dashboard');
    }
  };

  const renderDashboard = () => (
    <Card mode="outlined" style={styles.card}>
      <ScrollView horizontal>
        <DataTable style={{ minWidth: 800 }}>
          <DataTable.Header>
            <DataTable.Title style={{ minWidth: 120 }}>Sub Kategori</DataTable.Title>
            <DataTable.Title style={{ minWidth: 150 }}>Nama Stock</DataTable.Title>
            <DataTable.Title numeric style={{ minWidth: 100 }}>Saat Ini</DataTable.Title>
            <DataTable.Title numeric style={{ minWidth: 100 }}>Masuk</DataTable.Title>
            <DataTable.Title numeric style={{ minWidth: 100 }}>Keluar</DataTable.Title>
            <DataTable.Title numeric style={{ minWidth: 100 }}>Scrap</DataTable.Title>
          </DataTable.Header>

          {bahanStats.map((item) => {
            let indicatorColor = theme.colors.primary; // Aman
            if (item.stok_sistem <= 0) {
              indicatorColor = theme.colors.error; // Habis
            } else if (item.stok_sistem <= item.stok_minimum) {
              indicatorColor = colors.warning; // Menipis
            }

            return (
              <DataTable.Row key={item.id_bahan}>
                <DataTable.Cell style={{ minWidth: 120 }}>{item.kategori}</DataTable.Cell>
                <DataTable.Cell style={{ minWidth: 150 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
                    <Text>{item.nama_bahan}</Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell numeric style={{ minWidth: 100 }}><Text style={{ color: indicatorColor, fontWeight: 'bold' }}>{item.stok_sistem}</Text></DataTable.Cell>
                <DataTable.Cell numeric style={{ minWidth: 100 }}>{item.totalMasuk}</DataTable.Cell>
                <DataTable.Cell numeric style={{ minWidth: 100 }}><Text style={{ color: colors.warning }}>{item.totalKeluar}</Text></DataTable.Cell>
                <DataTable.Cell numeric style={{ minWidth: 100 }}><Text style={{ color: theme.colors.error }}>{item.totalScrap}</Text></DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      </ScrollView>
    </Card>
  );

  const renderOpname = () => {
    const selectedBahan = masterBahan.find(b => b.id_bahan === opnameBahanId);
    const stokFisikNum = parseFloat(opnameInput.replace(/[^0-9.]/g, '')) || 0;
    const selisih = selectedBahan ? stokFisikNum - (selectedBahan.stok_sistem || 0) : 0;
    const isLeak = selisih < 0;

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>Pilih Jenis Pencatatan</Text>
        <SegmentedButtons
          value={opnameType}
          onValueChange={setOpnameType}
          buttons={[
            { value: 'Masuk', label: 'In' },
            { value: 'Scrap', label: 'Scrap' },
            { value: 'Opname', label: 'Now' },
          ]}
          style={{ marginBottom: 16 }}
        />

        <Text variant="titleMedium" style={{ marginBottom: 12 }}>Pilih Bahan</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {masterBahan.map(b => (
            <Chip
              key={b.id_bahan}
              mode={opnameBahanId === b.id_bahan ? 'flat' : 'outlined'}
              selected={opnameBahanId === b.id_bahan}
              onPress={() => setOpnameBahanId(b.id_bahan)}
              style={styles.chip}
            >
              {b.nama_bahan}
            </Chip>
          ))}
        </ScrollView>

        {selectedBahan && (
          <Card mode="outlined" style={styles.card}>
            <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>Stok Sistem Saat Ini</Text>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>{selectedBahan.stok_sistem || 0} {selectedBahan.satuan_beli}</Text>
              </View>
            </View>

            <TextInput
              mode="outlined"
              label={opnameType === 'Masuk' ? 'Jumlah Bahan Masuk' : opnameType === 'Scrap' ? 'Jumlah Bahan Dibuang/Rusak' : 'Stok Fisik Aktual (Saat Ini)'}
              keyboardType="numeric"
              placeholder="0"
              value={opnameInput}
              onChangeText={setOpnameInput}
              style={{ marginBottom: 16 }}
            />

            {opnameType === 'Opname' && opnameInput !== '' && (
              <Surface style={[styles.previewBox, selisih < 0 ? { backgroundColor: theme.colors.errorContainer } : { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
                <Text variant="bodyMedium" style={{ color: selisih < 0 ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                  {selisih < 0 ? `Stok Terpakai (Akan diisi ke Stok Keluar): ${Math.abs(selisih)} ${selectedBahan.satuan_beli}` : `Penyesuaian (Berlebih): +${selisih} ${selectedBahan.satuan_beli}`}
                </Text>
              </Surface>
            )}

            <TextInput
              mode="outlined"
              label="Keterangan (Opsional)"
              placeholder="Catatan..."
              value={opnameKeterangan}
              onChangeText={setOpnameKeterangan}
              style={{ marginBottom: 16 }}
            />

            <Button mode="contained" onPress={handleSaveOpname} style={styles.saveBtn} contentStyle={{ paddingVertical: 8 }}>
              Simpan Pencatatan
            </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    );
  };

  const renderLaporan = () => (
    <View style={{ flex: 1 }}>
      <Text variant="titleMedium" style={{ marginBottom: 16 }}>Laporan Kekurangan Bahan (Perlu Restock)</Text>
      {laporan.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <CheckCircle size={40} color={theme.colors.primary} style={{ marginBottom: 16 }} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Semua stok bahan baku aman!</Text>
          </View>
      ) : (
        laporan.map(item => (
          <Card key={item.id_bahan} mode="outlined" style={[styles.card, { borderColor: colors.warning, borderWidth: 2 }]}>
            <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text variant="titleMedium" style={styles.cardTitle}>{item.nama_bahan}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Stok Minimum: {item.stok_minimum} {item.satuan_beli}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Stok Saat Ini: {item.stok_sistem} {item.satuan_beli}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text variant="bodyMedium" style={{ color: colors.warning, fontWeight: 'bold' }}>Kurang: {item.kekurangan} {item.satuan_beli}</Text>
              </View>
            </View>
            <Surface style={{ backgroundColor: theme.colors.errorContainer, padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }} elevation={0}>
              <AlertTriangle size={16} color={theme.colors.error} />
              <Text variant="bodySmall" style={{ color: theme.colors.error, fontWeight: 'bold', marginLeft: 8 }}>
                Perlu segera dibeli/restock!
              </Text>
            </Surface>
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.headerTitle}>Modul Stok (SO)</Text>
      </View>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'dashboard', label: 'Dashboard' },
            { value: 'opname', label: 'Opname' },
            { value: 'laporan', label: 'Laporan' },
          ]}
          style={{ padding: 16 }}
        />
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'opname' && renderOpname()}
        {activeTab === 'laporan' && renderLaporan()}
      </View>

      {/* Modal is removed since everything is in Opname Tab */}

    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
  headerTitle: { fontWeight: 'bold' },
  tabContainer: { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
  content: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
  cardTitle: { fontWeight: 'bold', marginBottom: 12 },
  chip: { marginRight: 8, marginBottom: 8 },
  previewBox: { padding: 12, marginBottom: 16, borderRadius: 8 },
  saveBtn: { marginTop: 16, borderRadius: 12 },
  indicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 }
});
