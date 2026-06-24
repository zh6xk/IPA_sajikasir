import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Switch, Button, useTheme, Card as PaperCard } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Save, Database, DownloadCloud, UploadCloud, Shield, Calculator, Package, Globe, LogOut, Users as UsersIcon } from 'lucide-react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { ThemeColors } from '../theme/Theme';
import { exportBackup, importBackup } from '../utils/backup';
import { updateUser } from '../database/db';
import * as Crypto from 'expo-crypto';

export const ProfileSettingsScreen = ({ navigation }: any) => {
  const { currentUser, logout, userName, userLocation, storeName, completeOnboarding, taxRate, setTaxRate, trackStock, setTrackStock, refreshProducts, refreshCustomers, qrisImage, setQrisImage, qrisName, setQrisName, qrisNmid, setQrisNmid, bankName, setBankName, bankAccount, setBankAccount, bankAccountName, setBankAccountName, language, setLanguage, allowLoginWithoutPin, setAllowLoginWithoutPin, isOwnerDevice, setIsOwnerDevice, t } = useAppContext();
  const theme = useTheme();
  const colors = theme.colors as any;
  const styles = getStyles(theme);

  const [name, setName] = useState(userName);
  const [location, setLocation] = useState(userLocation);
  const [store, setStore] = useState(storeName);
  
  const [localTax, setLocalTax] = useState(taxRate.toString());
  const [localTrackStock, setLocalTrackStock] = useState(trackStock);
  const [localLanguage, setLocalLanguage] = useState(language || 'system');
  const [localAllowLoginWithoutPin, setLocalAllowLoginWithoutPin] = useState(allowLoginWithoutPin);
  const [localIsOwnerDevice, setLocalIsOwnerDevice] = useState(isOwnerDevice);
  
  // PIN Change State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [localQrisImage, setLocalQrisImage] = useState(qrisImage);
  const [localQrisName, setLocalQrisName] = useState(qrisName);
  const [localQrisNmid, setLocalQrisNmid] = useState(qrisNmid);
  const [localBankName, setLocalBankName] = useState(bankName);
  const [localBankAccount, setLocalBankAccount] = useState(bankAccount);
  const [localBankAccountName, setLocalBankAccountName] = useState(bankAccountName);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalQrisImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !location.trim() || !store.trim()) {
      Alert.alert(t('error'), t('errProfileDataRequired'));
      return;
    }
    
    // Change PIN Logic
    if (oldPin || newPin || confirmPin) {
      const hashedOldPin = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, oldPin);
      if (hashedOldPin !== currentUser?.pin_login) {
        Alert.alert(t('error'), 'PIN Lama salah.');
        return;
      }
      if (newPin.length < 4) {
        Alert.alert(t('error'), 'PIN Baru minimal 4 digit.');
        return;
      }
      if (newPin !== confirmPin) {
        Alert.alert(t('error'), 'Konfirmasi PIN Baru tidak cocok.');
        return;
      }
      // Update PIN in Database
      if (currentUser) {
        await updateUser({ ...currentUser, pin_login: newPin });
        const hashedNewPin = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, newPin);
        currentUser.pin_login = hashedNewPin; // Update local context reference
      }
    }

    completeOnboarding(name, location, store);
    setTaxRate(parseFloat(localTax) || 0);
    setTrackStock(localTrackStock);
    setLanguage(localLanguage);
    setAllowLoginWithoutPin(localAllowLoginWithoutPin);
    setIsOwnerDevice(localIsOwnerDevice);
    
    setQrisImage(localQrisImage);
    setQrisName(localQrisName);
    setQrisNmid(localQrisNmid);
    setBankName(localBankName);
    setBankAccount(localBankAccount);
    setBankAccountName(localBankAccountName);
    
    Alert.alert(t('success'), t('settingsSaved'));
    navigation.goBack();
  };

  const handleExport = async () => {
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert(t('error'), t('backupError'));
    }
  };

  const handleImport = async () => {
    Alert.alert(t('warning'), t('importWarningMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('yesImport'), style: 'destructive', onPress: async () => {
        try {
          const success = await importBackup();
          if (success) {
            await refreshProducts();
            await refreshCustomers();
            Alert.alert(t('success'), t('importSuccess'));
          }
        } catch (e: any) {
          Alert.alert(t('error'), e.message || t('error'));
        }
      }}
    ]);
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
          <Text style={styles.headerTitle}>{t('profileSettings')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Keamanan & Akun</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.label}>Info Pengguna</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 16 }}>{currentUser?.nama_lengkap}</Text>
              <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{currentUser?.role}</Text>
              </View>
            </View>

            {currentUser?.role === 'Owner' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: colors.text }}>Login Tanpa PIN</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Izinkan semua pengguna masuk tanpa memasukkan PIN</Text>
                  </View>
                  <Switch
                    value={localAllowLoginWithoutPin}
                    onValueChange={setLocalAllowLoginWithoutPin}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {localAllowLoginWithoutPin && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: colors.text }}>Ini Perangkat Owner</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>Jadikan ini HP Utama Anda. Pemindahan akun tidak akan pernah menanyakan PIN.</Text>
                    </View>
                    <Switch
                      value={localIsOwnerDevice}
                      onValueChange={setLocalIsOwnerDevice}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                )}

                <Text style={[styles.label, { marginTop: 8 }]}>Ganti PIN Akses</Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label="PIN Lama"
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  value={oldPin}
                  onChangeText={setOldPin}
                />
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label="PIN Baru"
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  value={newPin}
                  onChangeText={setNewPin}
                />
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label="Konfirmasi PIN Baru"
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                />
              </>
            )}

            {currentUser?.role === 'Owner' && (
              <Button
                mode="contained-tonal"
                icon="account-group"
                onPress={() => navigation.navigate('UserManagement')}
                style={{ marginTop: 8, paddingVertical: 4 }}
                buttonColor={theme.colors.secondaryContainer}
                textColor={theme.colors.primary}
              >
                Manajemen Pengguna
              </Button>
            )}

          </View>
        </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('yourName')}</Text>
            <TextInput
              mode="outlined"
              style={styles.input}
              label={t('enterName')}
              value={currentUser?.role === 'Owner' ? name : currentUser?.nama_lengkap}
              onChangeText={setName}
              editable={currentUser?.role === 'Owner'}
            />
            {currentUser?.role !== 'Owner' && (
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>*Hubungi Owner jika ingin mengubah nama atau toko.</Text>
            )}

            <Text style={styles.label}>{t('storeNameLabel')}</Text>
            <TextInput
              mode="outlined"
              style={styles.input}
              label="Contoh: Warung Barokah"
              value={store}
              onChangeText={setStore}
              editable={currentUser?.role === 'Owner'}
            />

            <Text style={styles.label}>{t('locationLabel')}</Text>
            <TextInput
              mode="outlined"
              style={styles.input}
              label="Contoh: Jakarta Selatan"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('storePreferences')}</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <Globe size={18} color={colors.textSecondary} />
                <Text style={styles.settingLabel}>{t('languageLabel')}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.input, styles.smallInput, { minWidth: 100, backgroundColor: colors.primaryLight, borderWidth: 0 }]}
                onPress={() => {
                  if (localLanguage === 'system') setLocalLanguage('id');
                  else if (localLanguage === 'id') setLocalLanguage('en');
                  else setLocalLanguage('system');
                }}
              >
                <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: 'bold' }}>
                  {localLanguage === 'system' ? t('systemLanguage') : localLanguage === 'en' ? 'English' : 'Indonesia'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {currentUser?.role === 'Owner' && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('transferMethodLabel')}</Text>
                
                <Text style={styles.label}>{t('bankNameLabel')}</Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label={t('bankNamePlaceholder')}
                  value={localBankName}
                  onChangeText={setLocalBankName}
                />

                <Text style={styles.label}>{t('accountNumberLabel')}</Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label={t('accountNumberPlaceholder')}
                  value={localBankAccount}
                  onChangeText={setLocalBankAccount}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>{t('accountNameLabel')}</Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label={t('accountNamePlaceholder')}
                  value={localBankAccountName}
                  onChangeText={setLocalBankAccountName}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('qrisMethodLabel')}</Text>
                
                <Text style={styles.label}>{t('qrisImageLabel')}</Text>
                <View style={styles.qrisImageContainer}>
                  {localQrisImage ? (
                    <Image source={{ uri: localQrisImage }} style={styles.qrisPreview} resizeMode="contain" />
                  ) : (
                    <View style={styles.qrisPlaceholder}>
                      <Text style={styles.qrisPlaceholderText}>{t('noQrisImage')}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                    <UploadCloud size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadBtnText}>{localQrisImage ? t('changeQris') : t('uploadQris')}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>{t('qrisOutletName')}</Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label={t('qrisNamePlaceholder')}
                  value={localQrisName}
                  onChangeText={setLocalQrisName}
                />

                <Text style={styles.label}>{t('nmidOptional')}</Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  label={t('nmidPlaceholder')}
                  value={localQrisNmid}
                  onChangeText={setLocalQrisNmid}
                />
              </View>
            </>
          )}


          <Button 
            mode="contained" 
            icon="content-save" 
            onPress={handleSave} 
            style={{ margin: 16, marginBottom: 8, paddingVertical: 4 }}
          >
            {t('save')}
          </Button>

          <Button
            mode="outlined"
            icon="logout"
            onPress={() => logout()}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 4, borderColor: theme.colors.error }}
            textColor={theme.colors.error}
          >
            Logout (Keluar)
          </Button>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('aboutSajiKasir')}</Text>
            <Text style={styles.infoText}>SajiKasir v{Constants.expoConfig?.version || '1.0.0'}</Text>
            <Text style={styles.infoText}>{t('aboutDesc')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.card,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  card: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  smallInput: {
    minWidth: 80,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  backupRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.secondaryContainer,
    gap: 8,
  },
  backupBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  qrisImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrisPreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrisPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrisPlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  uploadBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
