import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Lock, Users, ArrowLeft } from 'lucide-react-native';
import { Text, TextInput, Button, useTheme, Avatar, Surface, IconButton } from 'react-native-paper';
import { getUsers, User } from '../database/db';

interface Props {
  route: any;
  navigation: any;
}

export const LockScreen = ({ route, navigation }: Props) => {
  const { login, loginWithoutPin, allowLoginWithoutPin, isOwnerDevice, t } = useAppContext();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [entry, setEntry] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  useEffect(() => {
    if (allowLoginWithoutPin) {
      loadUsers();
    }
  }, [allowLoginWithoutPin]);

  const loadUsers = async () => {
    const list = await getUsers();
    setUsers(list.filter(u => u.status_aktif));
  };

  const handleUserSelect = (user: User) => {
    if (!isOwnerDevice && (user.role === 'Owner' || user.role === 'Manager')) {
      setSelectedAdmin(user);
      setEntry(''); // Reset PIN input for admin
    } else {
      loginWithoutPin(user);
      navigation?.replace(route?.params?.nextScreen || 'Dashboard');
    }
  };

  const handleAdminLogin = async () => {
    if (entry.length < 4) {
      Alert.alert(t('error'), 'PIN minimal 4 digit.');
      return;
    }
    setLoading(true);
    const success = await login(entry);
    setLoading(false);
    
    if (success) {
      // login(entry) checks DB to see if the PIN is valid and sets the user.
      // But we must verify if the logged in user MATCHES the selectedAdmin!
      // However, AppContext login automatically sets currentUser to whoever owns the PIN.
      // For a better UX, we'll let it login whoever the PIN belongs to.
      navigation?.replace(route?.params?.nextScreen || 'Dashboard');
    } else {
      Alert.alert(t('error'), 'PIN tidak valid.');
      setEntry('');
    }
  };

  const handleLogin = async () => {
    if (entry.length < 4) {
      Alert.alert(t('error'), 'PIN minimal 4 digit.');
      return;
    }
    setLoading(true);
    const success = await login(entry);
    setLoading(false);
    
    if (success) {
      navigation?.replace(route?.params?.nextScreen || 'Dashboard');
    } else {
      Alert.alert(t('error'), 'PIN tidak ditemukan atau akun tidak aktif.');
      setEntry('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.top}>
          <Lock size={48} color={theme.colors.primary} style={{ marginBottom: 16 }} />
          <Text variant="headlineMedium" style={styles.title}>{t('enterPin')}</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>{t('appTitle')}</Text>
        </View>

        {allowLoginWithoutPin && !selectedAdmin ? (
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
            <Text variant="titleMedium" style={{ marginBottom: 24, fontWeight: 'bold' }}>Pilih Akun Anda</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
              {users.map(u => (
                <TouchableOpacity key={u.id_user} onPress={() => handleUserSelect(u)}>
                  <Surface style={styles.userCard} elevation={2}>
                    <Avatar.Text 
                      size={56} 
                      label={u.nama_lengkap.charAt(0).toUpperCase()} 
                      style={{ backgroundColor: theme.colors.primaryContainer, marginBottom: 12 }} 
                      color={theme.colors.onPrimaryContainer} 
                    />
                    <Text style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                      {u.nama_lengkap.split(' ')[0]}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                      {u.role}
                    </Text>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : selectedAdmin ? (
          <View style={styles.form}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Avatar.Text 
                size={64} 
                label={selectedAdmin.nama_lengkap.charAt(0).toUpperCase()} 
                style={{ backgroundColor: theme.colors.errorContainer, marginBottom: 12 }} 
                color={theme.colors.onErrorContainer} 
              />
              <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{selectedAdmin.nama_lengkap}</Text>
              <Text style={{ fontSize: 14, color: theme.colors.error }}>Membutuhkan PIN ({selectedAdmin.role})</Text>
            </View>
            <TextInput
              label={`PIN Akses ${selectedAdmin.role}`}
              mode="outlined"
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              value={entry}
              onChangeText={setEntry}
              style={styles.input}
              onSubmitEditing={handleAdminLogin}
              disabled={loading}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button 
                mode="outlined" 
                onPress={() => { setSelectedAdmin(null); setEntry(''); }} 
                disabled={loading}
                style={[styles.loginBtn, { flex: 1 }]}
              >
                Batal
              </Button>
              <Button 
                mode="contained" 
                onPress={handleAdminLogin} 
                loading={loading}
                disabled={loading || entry.length < 4}
                style={[styles.loginBtn, { flex: 1 }]}
              >
                Masuk
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              label="PIN Akses"
              mode="outlined"
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              value={entry}
              onChangeText={setEntry}
              style={styles.input}
              onSubmitEditing={handleLogin}
              disabled={loading}
            />
            <Button 
              mode="contained" 
              onPress={handleLogin} 
              loading={loading}
              disabled={loading || entry.length < 4}
              style={styles.loginBtn}
            >
              Masuk
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  top: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 24,
  },
  loginBtn: {
    paddingVertical: 6,
  },
  userCard: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
  }
});
