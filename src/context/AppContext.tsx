import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, getProducts, insertProduct, updateProduct, deleteProduct as dbDeleteProduct } from '../database/db';
import { lightTheme, darkTheme, ThemeColors } from '../theme/Theme';

interface AppContextType {
  storeName: string;
  setStoreName: (name: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userLocation: string;
  setUserLocation: (loc: string) => void;
  isFirstTime: boolean;
  completeOnboarding: (name: string, location: string, store: string) => void;
  products: Product[];
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  editProduct: (product: Product) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  cart: Record<number, number>;
  addToCart: (product: Product) => void;
  decreaseInCart: (product: Product) => void;
  removeFromCart: (product: Product) => void;
  clearCart: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [storeName, setStoreNameState] = useState('Warung SajiKasir');
  const [userName, setUserNameState] = useState('');
  const [userLocation, setUserLocationState] = useState('Jakarta Selatan');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadPrefs();
    refreshProducts();
  }, []);

  const loadPrefs = async () => {
    const firstTime = await AsyncStorage.getItem('is_first_time');
    if (firstTime === 'false') setIsFirstTime(false);
    
    const name = await AsyncStorage.getItem('user_name');
    if (name) setUserNameState(name);
    
    const loc = await AsyncStorage.getItem('user_location');
    if (loc) setUserLocationState(loc);
    
    const store = await AsyncStorage.getItem('store_name');
    if (store) setStoreNameState(store);

    const themePref = await AsyncStorage.getItem('theme_pref');
    if (themePref === 'dark') setIsDark(true);
  };

  const setStoreName = async (name: string) => {
    setStoreNameState(name);
    await AsyncStorage.setItem('store_name', name);
  };

  const setUserName = async (name: string) => {
    setUserNameState(name);
    await AsyncStorage.setItem('user_name', name);
  };

  const setUserLocation = async (loc: string) => {
    setUserLocationState(loc);
    await AsyncStorage.setItem('user_location', loc);
  };

  const completeOnboarding = async (name: string, location: string, store: string) => {
    await AsyncStorage.setItem('user_name', name);
    await AsyncStorage.setItem('user_location', location);
    await AsyncStorage.setItem('store_name', store);
    await AsyncStorage.setItem('is_first_time', 'false');
    setUserNameState(name);
    setUserLocationState(location);
    setStoreNameState(store);
    setIsFirstTime(false);
  };

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('theme_pref', newVal ? 'dark' : 'light');
  };

  const refreshProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    await insertProduct(product);
    await refreshProducts();
  };

  const editProduct = async (product: Product) => {
    await updateProduct(product);
    await refreshProducts();
  };

  const removeProduct = async (id: number) => {
    await dbDeleteProduct(id);
    const newCart = { ...cart };
    delete newCart[id];
    setCart(newCart);
    await refreshProducts();
  };

  const addToCart = (product: Product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
  };

  const decreaseInCart = (product: Product) => {
    setCart(prev => {
      const current = prev[product.id] || 0;
      if (current <= 1) {
        const newCart = { ...prev };
        delete newCart[product.id];
        return newCart;
      }
      return { ...prev, [product.id]: current - 1 };
    });
  };

  const removeFromCart = (product: Product) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[product.id];
      return newCart;
    });
  };

  const clearCart = () => setCart({});

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <AppContext.Provider value={{
      storeName, setStoreName, userName, setUserName, userLocation, setUserLocation,
      isFirstTime, completeOnboarding,
      products, refreshProducts, addProduct, editProduct, removeProduct,
      cart, addToCart, decreaseInCart, removeFromCart, clearCart,
      isDark, toggleTheme, colors
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
