import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';

export const PRESET_ITEMS = [
  { value: 'preset_nasigoreng', label: '(🍛) Nasi Goreng', emoji: '🍛' },
  { value: 'preset_miegoreng', label: '(🍝) Mie Goreng', emoji: '🍝' },
  { value: 'preset_ayamgeprek', label: '(🍗) Ayam Geprek', emoji: '🍗' },
  { value: 'preset_esteh', label: '(🍹) Es Teh', emoji: '🍹' },
  { value: 'preset_kopi', label: '(☕) Kopi', emoji: '☕' },
  { value: 'preset_cemilan', label: '(🍟) Cemilan', emoji: '🍟' },
];

interface Props {
  imageUri: string | null;
  style?: any;
}

export const FoodImageHolder = ({ imageUri, style }: Props) => {
  const { colors } = useAppContext();
  
  if (!imageUri || imageUri.startsWith('preset_')) {
    const preset = PRESET_ITEMS.find(p => p.value === imageUri) || PRESET_ITEMS[0];
    return (
      <View style={[styles.presetContainer, { backgroundColor: colors.chipBackground, borderColor: colors.border }, style]}>
        <Text style={styles.emojiText}>{preset.emoji}</Text>
      </View>
    );
  }

  return (
    <Image source={{ uri: imageUri }} style={[styles.image, style]} />
  );
};

const styles = StyleSheet.create({
  presetContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  image: {
    resizeMode: 'cover',
  },
  emojiText: {
    fontSize: 40,
  }
});
