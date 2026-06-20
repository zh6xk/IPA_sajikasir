import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { FoodImageHolder, PRESET_ITEMS } from '../components/FoodImageHolder';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const AddEditProductScreen = ({ route, navigation }: any) => {
  const { addProduct, editProduct, colors, t } = useAppContext();
  const productToEdit = route.params?.product;

  const styles = getStyles(colors);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [flavorType, setFlavorType] = useState<'Asin' | 'Manis'>('Asin');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [stock, setStock] = useState('0');

  const categories = ['Makanan', 'Minuman', 'Cemilan', 'Lainnya'];
  const flavorTypes = ['Asin', 'Manis'];

  const categoryLabels: Record<string, string> = {
    'Makanan': t('food'),
    'Minuman': t('drink'),
    'Cemilan': t('snack'),
    'Lainnya': t('other')
  };

  const flavorLabels: Record<string, string> = {
    'Asin': t('salty'),
    'Manis': t('sweet')
  };

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setPrice(productToEdit.price.toString());
      setCategory(productToEdit.category);
      setFlavorType(productToEdit.flavorType || 'Asin');
      setImageUri(productToEdit.imageUri);
      setStock((productToEdit.stock ?? 0).toString());
    }
  }, [productToEdit]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Gagal membuka galeri: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert(t('error'), t('productReqErr'));
      return;
    }

    // Clean up price string to support formats like '15.000' or '15,000'
    const cleanPrice = price.replace(/[^0-9]/g, '');
    const numericPrice = parseFloat(cleanPrice);
    if (isNaN(numericPrice)) {
      Alert.alert(t('error'), t('priceInvalidErr'));
      return;
    }

    const productData = {
      name,
      price: numericPrice,
      category,
      flavorType,
      imageUri: imageUri || 'preset_nasigoreng',
      stock: parseInt(stock.replace(/[^0-9]/g, ''), 10) || 0,
    };

    try {
      if (productToEdit) {
        await editProduct({ ...productData, id: productToEdit.id });
      } else {
        await addProduct(productData);
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', 'Gagal menyimpan data: ' + (error.message || 'Unknown error'));
    }
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
          <Text style={styles.headerTitle}>{productToEdit ? t('editProduct') : t('addProduct')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.imageSection}>
            <FoodImageHolder imageUri={imageUri} style={styles.imagePreview} />
            
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <ImageIcon size={20} color={colors.primary} />
                <Text style={styles.imageButtonText}>{t('uploadPhoto')}</Text>
              </TouchableOpacity>
              
              <Text style={styles.orText}>{t('orPreset')}</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
                {PRESET_ITEMS.map(preset => (
                  <TouchableOpacity 
                    key={preset.value}
                    style={[styles.presetItem, imageUri === preset.value && styles.presetItemActive]}
                    onPress={() => setImageUri(preset.value)}
                  >
                    <Text style={styles.presetEmoji}>{preset.label.match(/\((.*?)\)/)?.[1]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('productName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('productNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('price')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('pricePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('stock')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 50"
              placeholderTextColor={colors.textSecondary}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>{t('helperStock')}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('category')}</Text>
            <View style={styles.chipContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{categoryLabels[cat] || cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('flavor')}</Text>
            <View style={styles.chipContainer}>
              {flavorTypes.map(flavor => (
                <TouchableOpacity
                  key={flavor}
                  style={[styles.chip, flavorType === flavor && styles.chipActive]}
                  onPress={() => setFlavorType(flavor as 'Asin' | 'Manis')}
                >
                  <Text style={[styles.chipText, flavorType === flavor && styles.chipTextActive]}>{flavorLabels[flavor] || flavor}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('saveProduct')}</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  imageActions: {
    alignItems: 'center',
    width: '100%',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },
  imageButtonText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 12,
    fontWeight: 'bold',
  },
  presetsList: {
    gap: 8,
  },
  presetItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemActive: {
    borderColor: colors.primary,
  },
  presetEmoji: {
    fontSize: 24,
  },
  formGroup: {
    marginBottom: 20,
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
    color: colors.text,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.chipActiveBg,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
