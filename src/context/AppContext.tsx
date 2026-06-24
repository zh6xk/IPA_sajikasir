import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';
import * as SQLite from 'expo-sqlite';

// --- Set this to true to WIPE all data on every code change in Dev Mode ---
const WIPE_DATA_ON_LOAD = false;
import { en } from '../locales/en';
import { id } from '../locales/id';
import {
  Product, getProducts, insertProduct, updateProduct, deleteProduct as dbDeleteProduct,
  Customer, getCustomers, insertCustomer, updateCustomer, deleteCustomer as dbDeleteCustomer,
  MasterBahan, getMasterBahan, insertMasterBahan, updateMasterBahan, deleteMasterBahan as dbDeleteMasterBahan,
  ResepProduk, getResepProduk, updateResepProduk,
  User, verifyLogin, insertUser, wipeDatabase
} from '../database/db';
import { lightTheme, darkTheme, ThemeColors } from '../theme/Theme';

interface AppContextType {
  storeName: string;
  setStoreName: (name: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userLocation: string;
  setUserLocation: (loc: string) => void;
  isFirstTime: boolean;
  completeOnboarding: (name: string, location: string, store: string, pin: string) => Promise<void>;
  isTutorialDone: boolean;
  completeTutorial: () => Promise<void>;
  products: Product[];
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<number>;
  editProduct: (product: Product) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  masterBahan: MasterBahan[];
  refreshMasterBahan: () => Promise<void>;
  addMasterBahan: (b: Omit<MasterBahan, 'id_bahan'>) => Promise<number>;
  editMasterBahan: (b: MasterBahan) => Promise<void>;
  removeMasterBahan: (id: number) => Promise<void>;
  cart: Record<number, number>;
  addToCart: (product: Product) => boolean;
  decreaseInCart: (product: Product) => void;
  removeFromCart: (product: Product) => void;
  clearCart: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  // Settings
  taxRate: number;
  setTaxRate: (rate: number) => void;
  trackStock: boolean;
  setTrackStock: (val: boolean) => void;
  // RBAC Authentication
  currentUser: User | null;
  login: (pin: string) => Promise<boolean>;
  loginWithoutPin: (user: User) => void;
  logout: () => void;
  allowLoginWithoutPin: boolean;
  setAllowLoginWithoutPin: (val: boolean) => void;
  isOwnerDevice: boolean;
  setIsOwnerDevice: (val: boolean) => void;
  // Customers
  customers: Customer[];
  refreshCustomers: () => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id'>) => Promise<void>;
  editCustomer: (c: Customer) => Promise<void>;
  removeCustomer: (id: number) => Promise<void>;
  // Payment Info
  qrisImage: string;
  setQrisImage: (val: string) => void;
  qrisName: string;
  setQrisName: (val: string) => void;
  qrisNmid: string;
  setQrisNmid: (val: string) => void;
  bankName: string;
  setBankName: (val: string) => void;
  bankAccount: string;
  setBankAccount: (val: string) => void;
  bankAccountName: string;
  setBankAccountName: (val: string) => void;
  // Language Info
  language: string;
  setLanguage: (val: string) => void;
  t: (key: keyof typeof id) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [storeName, setStoreNameState] = useState('Warung SajiKasir');
  const [userName, setUserNameState] = useState('');
  const [userLocation, setUserLocationState] = useState('Jakarta Selatan');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isTutorialDone, setIsTutorialDone] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [masterBahan, setMasterBahan] = useState<MasterBahan[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [isDark, setIsDark] = useState(false);
  const [taxRate, setTaxRateState] = useState(0);
  const [trackStock, setTrackStockState] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allowLoginWithoutPin, setAllowLoginWithoutPinState] = useState(false);
  const [isOwnerDevice, setIsOwnerDeviceState] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [qrisImage, setQrisImageState] = useState('');
  const [qrisName, setQrisNameState] = useState('');
  const [qrisNmid, setQrisNmidState] = useState('');
  const [bankName, setBankNameState] = useState('');
  const [bankAccount, setBankAccountState] = useState('');
  const [bankAccountName, setBankAccountNameState] = useState('');
  const [language, setLanguageState] = useState('system');

  useEffect(() => {
    loadPrefs();
    refreshProducts();
    refreshCustomers();
    refreshMasterBahan();
  }, []);

  const loadPrefs = async () => {
    if (__DEV__ && WIPE_DATA_ON_LOAD) {
      console.log('DEV WIPE: Wiping all AsyncStorage and SQLite data...');
      await AsyncStorage.clear();
      await wipeDatabase();
      // reset memory state
      setIsFirstTime(true);
      setIsTutorialDone(false);
      setCurrentUser(null);
    }

    const firstTime = await AsyncStorage.getItem('is_first_time');
    if (firstTime === 'false') setIsFirstTime(false);

    const tutorialDone = await AsyncStorage.getItem('is_tutorial_done');
    if (tutorialDone === 'true') setIsTutorialDone(true);

    const name = await AsyncStorage.getItem('user_name');
    if (name) setUserNameState(name);

    const loc = await AsyncStorage.getItem('user_location');
    if (loc) setUserLocationState(loc);

    const store = await AsyncStorage.getItem('store_name');
    if (store) setStoreNameState(store);

    const themePref = await AsyncStorage.getItem('theme_pref');
    if (themePref === 'dark') setIsDark(true);

    const tax = await AsyncStorage.getItem('tax_rate');
    if (tax) setTaxRateState(parseFloat(tax) || 0);

    const track = await AsyncStorage.getItem('track_stock');
    if (track === 'true') setTrackStockState(true);

    // We no longer load pin from SecureStore/AsyncStorage as we use RBAC now.
    // Optionally check if we have a persisted session here later.

    const qi = await AsyncStorage.getItem('qris_image');
    if (qi) setQrisImageState(qi);

    const qn = await AsyncStorage.getItem('qris_name');
    if (qn) setQrisNameState(qn);

    const qnm = await AsyncStorage.getItem('qris_nmid');
    if (qnm) setQrisNmidState(qnm);

    const bn = await AsyncStorage.getItem('bank_name');
    if (bn) setBankNameState(bn);

    const ba = await AsyncStorage.getItem('bank_account');
    if (ba) setBankAccountState(ba);

    const ban = await AsyncStorage.getItem('bank_account_name');
    if (ban) setBankAccountNameState(ban);

    const lang = await AsyncStorage.getItem('app_language');
    if (lang) setLanguageState(lang);

    const allowBypass = await AsyncStorage.getItem('allow_login_without_pin');
    if (allowBypass === 'true') setAllowLoginWithoutPinState(true);

    const ownerDev = await AsyncStorage.getItem('is_owner_device');
    if (ownerDev === 'true') setIsOwnerDeviceState(true);

    // Auto-login last user
    const lastUserStr = await AsyncStorage.getItem('last_logged_in_user');
    if (lastUserStr) {
      try {
        const parsedUser = JSON.parse(lastUserStr);
        if (parsedUser && parsedUser.status_aktif) {
          setCurrentUser(parsedUser);
        }
      } catch (e) {
        console.error('Failed to parse last logged in user', e);
      }
    }
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

  const setTaxRate = async (rate: number) => {
    setTaxRateState(rate);
    await AsyncStorage.setItem('tax_rate', rate.toString());
  };

  const setTrackStock = async (val: boolean) => {
    setTrackStockState(val);
    await AsyncStorage.setItem('track_stock', val ? 'true' : 'false');
  };



  const setQrisImage = async (val: string) => {
    setQrisImageState(val);
    await AsyncStorage.setItem('qris_image', val);
  };
  const setQrisName = async (val: string) => {
    setQrisNameState(val);
    await AsyncStorage.setItem('qris_name', val);
  };
  const setQrisNmid = async (val: string) => {
    setQrisNmidState(val);
    await AsyncStorage.setItem('qris_nmid', val);
  };
  const setBankName = async (val: string) => {
    setBankNameState(val);
    await AsyncStorage.setItem('bank_name', val);
  };
  const setBankAccount = async (val: string) => {
    setBankAccountState(val);
    await AsyncStorage.setItem('bank_account', val);
  };
  const setBankAccountName = async (val: string) => {
    setBankAccountNameState(val);
    await AsyncStorage.setItem('bank_account_name', val);
  };
  const setLanguage = async (val: string) => {
    setLanguageState(val);
    await AsyncStorage.setItem('app_language', val);
  };

  const setAllowLoginWithoutPin = async (val: boolean) => {
    setAllowLoginWithoutPinState(val);
    await AsyncStorage.setItem('allow_login_without_pin', val ? 'true' : 'false');
  };

  const setIsOwnerDevice = async (val: boolean) => {
    setIsOwnerDeviceState(val);
    await AsyncStorage.setItem('is_owner_device', val ? 'true' : 'false');
  };

  const t = (key: keyof typeof id): string => {
    let activeLang = language;
    if (activeLang === 'system') {
      const locales = Localization.getLocales();
      if (locales.length > 0 && locales[0].languageCode === 'en') {
        activeLang = 'en';
      } else {
        activeLang = 'id';
      }
    }
    const dict = activeLang === 'en' ? en : id;
    return dict[key] || key;
  };

  const completeOnboarding = async (name: string, location: string, store: string, pin: string) => {
    // Save preferences
    await AsyncStorage.setItem('user_name', name);
    await AsyncStorage.setItem('user_location', location);
    await AsyncStorage.setItem('store_name', store);
    await AsyncStorage.setItem('is_first_time', 'false');
    setUserNameState(name);
    setUserLocationState(location);
    setStoreNameState(store);

    // Create the first Owner user
    await insertUser({
      nama_lengkap: `${name} (Owner)`,
      pin_login: pin,
      role: 'Owner',
      status_aktif: true
    });

    // Auto-login the new user
    await login(pin);
    
    // Set First Time to false AFTER everything is done, 
    // so the App doesn't unmount SplashScreen prematurely
    setIsFirstTime(false);
  };

  const completeTutorial = async () => {
    setIsTutorialDone(true);
    await AsyncStorage.setItem('is_tutorial_done', 'true');
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

  const addProduct = async (product: Omit<Product, 'id'>): Promise<number> => {
    const id = await insertProduct(product);
    await refreshProducts();
    return id;
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

  const addToCart = (product: Product): boolean => {
    const current = cart[product.id] || 0;
    // Block adding past available stock only when stock tracking is on.
    if (trackStock && current >= product.stock) {
      return false;
    }
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
    return true;
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

  const refreshCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const addCustomer = async (c: Omit<Customer, 'id'>) => {
    await insertCustomer(c);
    await refreshCustomers();
  };

  const editCustomer = async (c: Customer) => {
    await updateCustomer(c);
    await refreshCustomers();
  };

  const removeCustomer = async (id: number) => {
    await dbDeleteCustomer(id);
    await refreshCustomers();
  };

  const refreshMasterBahan = async () => {
    const data = await getMasterBahan();
    setMasterBahan(data);
  };

  const addMasterBahan = async (b: Omit<MasterBahan, 'id_bahan'>): Promise<number> => {
    const id = await insertMasterBahan(b);
    await refreshMasterBahan();
    return id;
  };

  const editMasterBahan = async (b: MasterBahan) => {
    await updateMasterBahan(b);
    await refreshMasterBahan();
  };

  const removeMasterBahan = async (id: number) => {
    await dbDeleteMasterBahan(id);
    await refreshMasterBahan();
  };

  const login = async (pin: string): Promise<boolean> => {
    const user = await verifyLogin(pin);
    if (user) {
      setCurrentUser(user);
      await AsyncStorage.setItem('last_logged_in_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const loginWithoutPin = async (user: User) => {
    setCurrentUser(user);
    await AsyncStorage.setItem('last_logged_in_user', JSON.stringify(user));
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem('last_logged_in_user');
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <AppContext.Provider value={{
      storeName, setStoreName,
      userName, setUserName,
      userLocation, setUserLocation,
      isFirstTime, completeOnboarding,
      isTutorialDone, completeTutorial,
      products, refreshProducts, addProduct, editProduct, removeProduct,
      masterBahan, refreshMasterBahan, addMasterBahan, editMasterBahan, removeMasterBahan,
      cart, addToCart, decreaseInCart, removeFromCart, clearCart,
      isDark, toggleTheme, colors,
      taxRate, setTaxRate,
      trackStock, setTrackStock,
      currentUser, login, loginWithoutPin, logout,
      allowLoginWithoutPin, setAllowLoginWithoutPin,
      isOwnerDevice, setIsOwnerDevice,
      customers, refreshCustomers, addCustomer, editCustomer, removeCustomer,
      qrisImage, setQrisImage, qrisName, setQrisName, qrisNmid, setQrisNmid,
      bankName, setBankName, bankAccount, setBankAccount, bankAccountName, setBankAccountName,
      language, setLanguage, t,
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
