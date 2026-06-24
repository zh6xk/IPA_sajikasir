import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Dimensions, Keyboard, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import * as Location from 'expo-location';
import { MapPin, Store, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation }: any) => {
  const { completeOnboarding, isDark, toggleTheme } = useAppContext();
  const theme = useTheme();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToStep = (nextStep: number) => {
    Keyboard.dismiss();
    setStep(nextStep);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !storeName.trim()) {
        Alert.alert('Oops!', 'Tolong isi Nama Anda dan Nama Toko ya.');
        return;
      }
      goToStep(2);
    } else if (step === 2) {
      if (!location.trim()) {
        Alert.alert('Oops!', 'Lokasi toko tidak boleh kosong.');
        return;
      }
      goToStep(3);
    }
  };

  const handleBack = () => {
    goToStep(step - 1);
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Sistem butuh akses lokasi untuk mengisi otomatis.');
        setIsLocating(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      if (geocode.length > 0) {
        const address = `${geocode[0].city || geocode[0].subregion}, ${geocode[0].region}`;
        setLocation(address);
      } else {
        setLocation(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal mendapatkan lokasi GPS. Silakan ketik manual saja ya.');
    }
    setIsLocating(false);
  };

  const handleFinish = async () => {
    if (pin.length < 4) {
      Alert.alert('Keamanan', 'PIN harus terdiri dari minimal 4 digit angka.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Keamanan', 'Konfirmasi PIN tidak cocok dengan PIN yang dibuat.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding(name, location, storeName, pin);
      setTimeout(() => {
        setIsSubmitting(false);
        navigation.replace('Dashboard');
      }, 500);
    } catch (e: any) {
      Alert.alert('Error', 'Maaf, terjadi kesalahan saat menyimpan data.\nDetail: ' + (e?.message || JSON.stringify(e)));
      setIsSubmitting(false);
    }
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* Header Progress */}
        <View style={styles.header}>
          {step > 1 ? (
            <IconButton icon="arrow-left" size={24} onPress={handleBack} iconColor={theme.colors.onBackground} style={styles.backBtn} />
          ) : <View style={{ width: 48 }} />}
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressActive, { backgroundColor: step >= 1 ? theme.colors.primary : theme.colors.outlineVariant }]} />
            <View style={[styles.progressLine, { backgroundColor: step >= 2 ? theme.colors.primary : theme.colors.outlineVariant }]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressActive, { backgroundColor: step >= 2 ? theme.colors.primary : theme.colors.outlineVariant }]} />
            <View style={[styles.progressLine, { backgroundColor: step >= 3 ? theme.colors.primary : theme.colors.outlineVariant }]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressActive, { backgroundColor: step >= 3 ? theme.colors.primary : theme.colors.outlineVariant }]} />
          </View>
          
          <IconButton 
            icon={isDark ? "white-balance-sun" : "moon-waning-crescent"} 
            size={24} 
            onPress={toggleTheme} 
            iconColor={theme.colors.onBackground} 
            style={styles.backBtn} 
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {step === 1 && (
              <View style={styles.stepContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Store size={48} color={theme.colors.primary} />
                </View>
                <Text variant="headlineMedium" style={styles.title}>Halo, Bos!</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>Mari kenalan dulu. Siapa nama Anda dan apa nama toko hebat Anda?</Text>
                
                <TextInput
                  label="Nama Anda"
                  mode="outlined"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  left={<TextInput.Icon icon="account-outline" />}
                />
                <TextInput
                  label="Nama Toko"
                  mode="outlined"
                  value={storeName}
                  onChangeText={setStoreName}
                  style={styles.input}
                  left={<TextInput.Icon icon="storefront-outline" />}
                />
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MapPin size={48} color={theme.colors.primary} />
                </View>
                <Text variant="headlineMedium" style={styles.title}>Dimana lokasinya?</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>Biar sistem tahu basis operasional Anda. Bisa ketik manual atau pakai GPS lho.</Text>
                
                <TextInput
                  label="Alamat / Kota"
                  mode="outlined"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  left={<TextInput.Icon icon="map-marker-outline" />}
                />
                
                <Button 
                  mode="contained-tonal" 
                  icon="crosshairs-gps" 
                  onPress={handleGetLocation}
                  loading={isLocating}
                  disabled={isLocating}
                  style={styles.gpsButton}
                >
                  Gunakan GPS Saat Ini
                </Button>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                  <ShieldCheck size={48} color={theme.colors.primary} />
                </View>
                <Text variant="headlineMedium" style={styles.title}>Amankan Akun Anda</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>Buat PIN rahasia untuk akun Owner. Jangan sampai lupa ya!</Text>
                
                <TextInput
                  label="PIN Akses (4-6 Angka)"
                  mode="outlined"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={pin}
                  onChangeText={setPin}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-outline" />}
                />
                <TextInput
                  label="Konfirmasi PIN"
                  mode="outlined"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-check-outline" />}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {step < 3 ? (
            <Button 
              mode="contained" 
              onPress={handleNext}
              contentStyle={styles.actionBtnContent}
              style={styles.actionBtn}
              labelStyle={styles.actionBtnLabel}
            >
              Lanjut
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={handleFinish}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={styles.actionBtnContent}
              style={styles.actionBtn}
              labelStyle={styles.actionBtnLabel}
            >
              Selesai & Masuk
            </Button>
          )}
        </View>

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
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  backBtn: {
    margin: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressActive: {
    transform: [{ scale: 1.3 }],
  },
  progressLine: {
    width: 44,
    height: 4,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '900',
    color: theme.colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  gpsButton: {
    width: '100%',
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 4,
  },
  footer: {
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 32 : 40,
  },
  actionBtn: {
    borderRadius: 16,
  },
  actionBtnContent: {
    paddingVertical: 10,
  },
  actionBtnLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
