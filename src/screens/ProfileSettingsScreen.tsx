import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Save, Database, DownloadCloud, UploadCloud, Shield, Calculator, Package, Globe } from 'lucide-react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { ThemeColors } from '../theme/Theme';
import { exportBackup, importBackup } from '../utils/backup';

export const ProfileSettingsScreen = ({ navigation }: any) => {
  const { userName, userLocation, storeName, completeOnboarding, colors, taxRate, setTaxRate, trackStock, setTrackStock, pin, setPin, refreshProducts, refreshCustomers, qrisImage, setQrisImage, qrisName, setQrisName, qrisNmid, setQrisNmid, bankName, setBankName, bankAccount, setBankAccount, bankAccountName, setBankAccountName, language, setLanguage, t } = useAppContext();
  const styles = getStyles(colors);

  const [name, setName] = useState(userName);
  const [location, setLocation] = useState(userLocation);
  const [store, setStore] = useState(storeName);
  
  const [localTax, setLocalTax] = useState(taxRate.toString());
  const [localTrackStock, setLocalTrackStock] = useState(trackStock);
  const [localPin, setLocalPin] = useState(pin);
  const [localLanguage, setLocalLanguage] = useState(language || 'system');
  
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

  const handleSave = () => {
    if (!name.trim() || !location.trim() || !store.trim()) {
      Alert.alert(t('error'), t('errProfileDataRequired'));
      return;
    }
    
    if (localPin && localPin.length < 4) {
      Alert.alert(t('error'), t('errPinLength'));
      return;
    }

    completeOnboarding(name, location, store);
    setTaxRate(parseFloat(localTax) || 0);
    setTrackStock(localTrackStock);
    setPin(localPin);
    setLanguage(localLanguage);
    
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
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'K'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('yourName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterName')}
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>{t('storeNameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Warung Barokah"
              placeholderTextColor={colors.textSecondary}
              value={store}
              onChangeText={setStore}
            />

            <Text style={styles.label}>{t('locationLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Jakarta Selatan"
              placeholderTextColor={colors.textSecondary}
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

            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <Calculator size={18} color={colors.textSecondary} />
                <Text style={styles.settingLabel}>{t('taxLabel')}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={localTax}
                onChangeText={setLocalTax}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <Package size={18} color={colors.textSecondary} />
                <Text style={styles.settingLabel}>{t('trackStockLabel')}</Text>
              </View>
              <Switch
                value={localTrackStock}
                onValueChange={setLocalTrackStock}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <Shield size={18} color={colors.textSecondary} />
                <View>
                  <Text style={styles.settingLabel}>{t('appPinLabel')}</Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{t('pinHint')}</Text>
                </View>
              </View>
              <TextInput
                style={[styles.input, styles.smallInput, { minWidth: 100 }]}
                placeholder="6 Digit"
                placeholderTextColor={colors.textSecondary}
                value={localPin}
                onChangeText={setLocalPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('transferMethodLabel')}</Text>
            
            <Text style={styles.label}>{t('bankNameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Bank Mandiri"
              placeholderTextColor={colors.textSecondary}
              value={localBankName}
              onChangeText={setLocalBankName}
            />

            <Text style={styles.label}>{t('accountNumberLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 1290011649973"
              placeholderTextColor={colors.textSecondary}
              value={localBankAccount}
              onChangeText={setLocalBankAccount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{t('accountNameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: ARIEFANSYAH FARAWOWA"
              placeholderTextColor={colors.textSecondary}
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
              style={styles.input}
              placeholder="Contoh: QRIS IBRA, AHLI CHIROPRACTIC"
              placeholderTextColor={colors.textSecondary}
              value={localQrisName}
              onChangeText={setLocalQrisName}
            />

            <Text style={styles.label}>{t('nmidOptional')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: ID1025459704447"
              placeholderTextColor={colors.textSecondary}
              value={localQrisNmid}
              onChangeText={setLocalQrisNmid}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('dataBackup')}</Text>
            <Text style={styles.hintText}>{t('backupHint')}</Text>
            
            <View style={styles.backupRow}>
              <TouchableOpacity style={styles.backupBtn} onPress={handleExport}>
                <DownloadCloud size={20} color={colors.primary} />
                <Text style={styles.backupBtnText}>{t('exportBackup')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.backupBtn} onPress={handleImport}>
                <UploadCloud size={20} color={colors.danger} />
                <Text style={styles.backupBtnText}>{t('importData')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>{t('saveAllChanges')}</Text>
          </TouchableOpacity>

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
  smallInput: {
    padding: 10,
    marginBottom: 0,
    minWidth: 80,
    textAlign: 'center',
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
    color: colors.text,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  backupBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
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
    borderColor: colors.border,
  },
  qrisPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderStyle: 'dashed',
  },
  qrisPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  uploadBtn: {
    backgroundColor: colors.primary,
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
