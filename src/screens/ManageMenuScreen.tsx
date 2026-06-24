import { useTheme, Card } from 'react-native-paper';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { FoodImageHolder } from '../components/FoodImageHolder';
import { formatRupiah } from '../utils/formatter';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react-native';
import { ThemeColors } from '../theme/Theme';

export const ManageMenuScreen = ({ navigation }: any) => {
  const { products, removeProduct, colors, t } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const theme = useTheme();
  const styles = getStyles(theme);
  const categories = ['Semua', 'Makanan', 'Minuman', 'Cemilan', 'Lainnya'];
  
  const filteredProducts = selectedCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const categoryLabels: Record<string, string> = {
    'Semua': t('all'),
    'Makanan': t('food'),
    'Minuman': t('drink'),
    'Cemilan': t('snack'),
    'Lainnya': t('other')
  };

  const handleDelete = (id: number) => {
    Alert.alert(t('deleteConfirm'), t('deleteConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => removeProduct(id) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('manageMenu')}</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {categoryLabels[cat] || cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView contentContainerStyle={styles.productList}>
        {filteredProducts.map(product => (
          <Card key={product.id} style={styles.productCard} mode="contained">
            <Card.Content style={{ flexDirection: 'row', padding: 12 }}>
              <FoodImageHolder imageUri={product.imageUri} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => navigation.navigate('AddEditProduct', { product })}
                  >
                    <Edit2 size={16} color={theme.colors.primary} />
                    <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>{t('edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleDelete(product.id)}
                  >
                    <Trash2 size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditProduct')}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
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
  categoryContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.secondaryContainer,
  },
  categoryTabActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  categoryText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: theme.colors.primary,
  },
  productList: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
