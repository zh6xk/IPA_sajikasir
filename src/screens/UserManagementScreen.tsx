import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { TextInput, useTheme, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit2, Trash2, Shield, User as UserIcon, CheckCircle, XCircle } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { User, getUsers, insertUser, updateUser, deleteUser } from '../database/db';
import { ThemeColors } from '../theme/Theme';

export const UserManagementScreen = ({ navigation }: any) => {
  const { t, currentUser } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(theme);
  const { width: windowWidth } = useWindowDimensions();

  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [pinLogin, setPinLogin] = useState('');
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Kasir' | 'Crew'>('Kasir');
  const [statusAktif, setStatusAktif] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const openAddModal = () => {
    setEditId(null);
    setNamaLengkap('');
    setPinLogin('');
    setRole('Kasir');
    setStatusAktif(true);
    setModalVisible(true);
  };

  const openEditModal = (u: User) => {
    setEditId(u.id_user);
    setNamaLengkap(u.nama_lengkap);
    setPinLogin('');
    setRole(u.role);
    setStatusAktif(u.status_aktif);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!namaLengkap) {
      Alert.alert('Error', 'Nama wajib diisi.');
      return;
    }
    if (!editId && pinLogin.length < 4) {
      Alert.alert('Error', 'PIN minimal 4 digit untuk pengguna baru.');
      return;
    }
    if (editId && pinLogin.length > 0 && pinLogin.length < 4) {
      Alert.alert('Error', 'Jika ingin mengganti PIN, minimal harus 4 digit.');
      return;
    }
    
    try {
      if (editId) {
        await updateUser({
          id_user: editId,
          nama_lengkap: namaLengkap,
          pin_login: pinLogin,
          role,
          status_aktif: statusAktif
        });
      } else {
        await insertUser({
          nama_lengkap: namaLengkap,
          pin_login: pinLogin,
          role,
          status_aktif: statusAktif
        });
      }
      setModalVisible(false);
      loadUsers();
    } catch (e: any) {
      if (e.message && e.message.includes('UNIQUE constraint')) {
        Alert.alert('Error', 'PIN ini sudah digunakan oleh karyawan lain.');
      } else {
        Alert.alert('Error', 'Gagal menyimpan user.');
      }
    }
  };

  const handleDelete = (user: User) => {
    if (user.id_user === currentUser?.id_user) {
      Alert.alert('Akses Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.');
      return;
    }
    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus ${user.nama_lengkap} secara permanen dari sistem?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
          await deleteUser(user.id_user);
          loadUsers();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={{ marginBottom: 12, backgroundColor: theme.colors.error, borderRadius: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={80}
        decelerationRate="fast"
      >
        <View style={[styles.userCard, { width: windowWidth - 32, marginBottom: 0 }]}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <UserIcon size={24} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.nama_lengkap}</Text>
              <View style={styles.roleBadgeWrapper}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{item.role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status_aktif ? theme.colors.success + '20' : theme.colors.error + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: item.status_aktif ? theme.colors.success : theme.colors.error }]}>
                    {item.status_aktif ? 'Aktif' : 'Nonaktif'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <Edit2 size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={{ width: 80, height: '100%', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => handleDelete(item)}
        >
          <Trash2 color="#FFF" size={24} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manajemen Pengguna</Text>
        <View style={{ width: 24 }} />
      </View>

      <SectionList
        sections={[
          { title: 'Owner', data: users.filter(u => u.role === 'Owner') },
          { title: 'Manager', data: users.filter(u => u.role === 'Manager') },
          { title: 'Kasir', data: users.filter(u => u.role === 'Kasir') },
          { title: 'Crew', data: users.filter(u => u.role === 'Crew') },
        ].filter(group => group.data.length > 0)}
        keyExtractor={item => item.id_user.toString()}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Karyawan' : 'Tambah Karyawan'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                mode="outlined"
                style={styles.input}
                placeholder="Misal: Budi Santoso"
                value={namaLengkap}
                onChangeText={setNamaLengkap}
              />

              <Text style={styles.label}>{editId ? 'Ubah PIN (Kosongkan jika tidak ingin ganti)' : 'PIN Akses (4-6 Digit)'}</Text>
              <TextInput
                mode="outlined"
                style={styles.input}
                placeholder={editId ? "Biarkan kosong" : "Misal: 1234"}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                value={pinLogin}
                onChangeText={setPinLogin}
              />

              <Text style={styles.label}>Role / Peran</Text>
              <View style={styles.roleSelector}>
                {['Owner', 'Manager', 'Kasir', 'Crew'].map(r => (
                  <TouchableOpacity 
                    key={r}
                    style={[styles.roleOption, role === r && styles.roleOptionActive]}
                    onPress={() => setRole(r as any)}
                  >
                    <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Status Akun</Text>
              <TouchableOpacity 
                style={[styles.statusToggle, statusAktif ? styles.statusActive : styles.statusInactive]}
                onPress={() => setStatusAktif(!statusAktif)}
              >
                {statusAktif ? <CheckCircle size={20} color={theme.colors.success} /> : <XCircle size={20} color={theme.colors.error} />}
                <Text style={[styles.statusToggleText, { color: statusAktif ? theme.colors.success : theme.colors.error }]}>
                  {statusAktif ? 'Akun Aktif (Bisa Login)' : 'Akun Dinonaktifkan'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.secondaryContainer, flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.saveBtnText, { color: theme.colors.text }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  roleBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  editBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceVariant,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleOptionActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  roleOptionText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: theme.colors.primary,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: theme.colors.success + '10',
    borderColor: theme.colors.success,
  },
  statusInactive: {
    backgroundColor: theme.colors.error + '10',
    borderColor: theme.colors.error,
  },
  statusToggleText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
