import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Lock, Delete } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

interface Props {
  route: any;
  navigation: any;
}

export const LockScreen = ({ route, navigation }: Props) => {
  const { pin, colors, t } = useAppContext();
  const styles = getStyles(colors);
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (entry.length >= 6) return;
    const next = entry + digit;
    setError(false);
    setEntry(next);

    if (next.length === pin.length) {
      if (next === pin) {
        navigation.replace(route.params?.nextScreen || 'Dashboard');
      } else {
        setError(true);
        Alert.alert(t('error'), t('pinWrong'));
        setEntry('');
      }
    }
  };

  const handleDelete = () => {
    setError(false);
    setEntry(prev => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <View style={styles.header}>
          <Lock size={48} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={styles.title}>{t('enterPin')}</Text>
          <Text style={styles.subtitle}>{t('appTitle')}</Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: pin.length || 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < entry.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>
        {error && <Text style={styles.errorText}>{t('pinWrong')}</Text>}
      </View>

      <View style={styles.keypad}>
        {keys.map((key, idx) => {
          if (key === '') return <View key={idx} style={styles.key} />;
          if (key === 'del') {
            return (
              <TouchableOpacity key={idx} style={styles.key} onPress={handleDelete}>
                <Delete size={26} color={colors.text} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={idx} style={styles.key} onPress={() => handleDigit(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    marginTop: 60,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    marginTop: 16,
    fontSize: 13,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  key: {
    width: '33.33%',
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
  },
});
