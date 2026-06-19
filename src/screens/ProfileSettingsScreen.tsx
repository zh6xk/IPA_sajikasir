import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Save } from 'lucide-react-native';
import Constants from 'expo-constants';
import { ThemeColors } from '../theme/Theme';

export const ProfileSettingsScreen = ({ navigation }: any) => {
  const { userName, userLocation, storeName, completeOnboarding, colors } = useAppContext();
  const styles = getStyles(colors);

  const [name, setName] = useState(userName);
  const [location, setLocation] = useState(userLocation);
  const [store, setStore] = useState(storeName);

  const handleSave = () => {
    if (!name.trim() || !location.trim() || !store.trim()) {
      Alert.alert('Error', 'Mohon isi semua data.');
      return;
    }
    completeOnboarding(name, location, store);
    Alert.alert('Sukses', 'Profil berhasil diperbarui!');
    navigation.goBack();
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
          <Text style={styles.headerTitle}>Pengaturan Profil</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'K'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Nama Anda</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Nama Usaha/Warung</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Warung Barokah"
              placeholderTextColor={colors.textSecondary}
              value={store}
              onChangeText={setStore}
            />

            <Text style={styles.label}>Lokasi</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Jakarta Selatan"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Tentang SajiKasir</Text>
            <Text style={styles.infoText}>SajiKasir v{Constants.expoConfig?.version || '1.0.0'}</Text>
            <Text style={styles.infoText}>Aplikasi kasir pintar untuk mendukung usaha kuliner lokal Anda agar lebih efisien dan terorganisir.</Text>
          </View>
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
    padding: 20,
    gap: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.chipBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    alignItems: 'center',
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
});
