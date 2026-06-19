import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { ThemeColors } from '../theme/Theme';

export const SplashScreen = ({ navigation }: any) => {
  const { completeOnboarding, colors, t } = useAppContext();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [storeName, setStoreName] = useState('Warung SajiKasir');

  const styles = getStyles(colors);

  const handleStart = () => {
    if (name.trim() === '' || location.trim() === '' || storeName.trim() === '') {
      alert(t('fillAll'));
      return;
    }
    completeOnboarding(name, location, storeName);
    navigation.replace('Dashboard');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('welcomeTo')}</Text>
          <Text style={styles.appName}>{t('appTitle')}</Text>
          <Text style={styles.subtitle}>{t('welcomeSub')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('yourName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterName')}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>{t('location')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('locationPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>{t('storeName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('storeNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={storeName}
            onChangeText={setStoreName}
          />

          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>{t('getStarted')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
