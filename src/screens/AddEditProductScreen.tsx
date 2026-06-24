import { useTheme } from 'react-native-paper';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { FoodImageHolder, PRESET_ITEMS } from '../components/FoodImageHolder';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const AddEditProductScreen = ({ route, navigation }: any) => {
  const { addProduct, editProduct, colors, t } = useAppContext();
  const productToEdit = route.params?.product;
  const initialPrice = route.params?.initialPrice;

  const theme = useTheme();
  const styles = getStyles(theme);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(initialPrice || '');
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

          <Card style={styles.formCard} mode="contained">
            <Card.Content>
              <View style={styles.formGroup}>
                <TextInput
                  mode="outlined"
                  label={t('productName')}
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <TextInput
                  mode="outlined"
                  label={t('price')}
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <TextInput
                  mode="outlined"
                  label={t('stock')}
                  style={styles.input}
                  placeholder="Contoh: 50"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>{t('helperStock')}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.formCard} mode="contained">
            <Card.Content>
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
            </Card.Content>
          </Card>

          <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
            {t('saveProduct')}
          </Button>
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
    backgroundColor: theme.colors.surfaceVariant,
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
    backgroundColor: theme.colors.primaryLight,
  },
  imageButtonText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemActive: {
    borderColor: theme.colors.primary,
  },
  presetEmoji: {
    fontSize: 24,
  },
  formCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 20,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 12,
  },
});
