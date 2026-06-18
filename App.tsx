import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAppContext } from './src/context/AppContext';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { OrderCatalogScreen } from './src/screens/OrderCatalogScreen';
import { ManageMenuScreen } from './src/screens/ManageMenuScreen';
import { AddEditProductScreen } from './src/screens/AddEditProductScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { TransactionHistoryScreen } from './src/screens/TransactionHistoryScreen';
import { ProfileSettingsScreen } from './src/screens/ProfileSettingsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isFirstTime } = useAppContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a tick for context to load prefs
    setTimeout(() => setIsReady(true), 100);
  }, []);

  if (!isReady) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isFirstTime ? 'Splash' : 'Dashboard'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="OrderCatalog" component={OrderCatalogScreen} />
        <Stack.Screen name="ManageMenu" component={ManageMenuScreen} />
        <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} />
        <Stack.Screen name="CheckoutConfirm" component={CheckoutScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AppProvider>
  );
}
