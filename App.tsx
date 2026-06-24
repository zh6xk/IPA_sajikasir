import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { PaperProvider } from 'react-native-paper';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ManageMenuScreen } from './src/screens/ManageMenuScreen';
import { AddEditProductScreen } from './src/screens/AddEditProductScreen';
import { ManageIngredientsScreen } from './src/screens/ManageIngredientsScreen';
import { HPPCalculatorScreen } from './src/screens/HPPCalculatorScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { TransactionHistoryScreen } from './src/screens/TransactionHistoryScreen';
import { MasterBahanScreen } from './src/screens/MasterBahanScreen';
import { RecipeBuilderScreen } from './src/screens/RecipeBuilderScreen';
import { HPPDashboardScreen } from './src/screens/HPPDashboardScreen';
import { StockModuleScreen } from './src/screens/StockModuleScreen';
import { ProfileSettingsScreen } from './src/screens/ProfileSettingsScreen';
import { SalesReportScreen } from './src/screens/SalesReportScreen';
import { CustomerScreen } from './src/screens/CustomerScreen';
import { LockScreen } from './src/screens/LockScreen';
import { UserManagementScreen } from './src/screens/UserManagementScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isFirstTime, currentUser, colors } = useAppContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a tick for context to load prefs
    setTimeout(() => setIsReady(true), 100);
  }, []);

  if (!isReady) return null;

  // Gate the app behind the Login screen (unless it's the very first time)
  if (!currentUser && !isFirstTime) {
    return (
      <PaperProvider theme={colors as any}>
        <LockScreen route={{ params: { nextScreen: 'Dashboard' } }} navigation={null} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={colors as any}>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isFirstTime ? 'Splash' : 'Dashboard'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ManageMenu" component={ManageMenuScreen} />
        <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} />
        <Stack.Screen name="ManageIngredients" component={ManageIngredientsScreen} />
        <Stack.Screen name="HPPCalculator" component={HPPCalculatorScreen} />
        <Stack.Screen name="CheckoutConfirm" component={CheckoutScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="SalesReport" component={SalesReportScreen} />
        <Stack.Screen name="Customers" component={CustomerScreen} />
        <Stack.Screen name="MasterBahan" component={MasterBahanScreen} />
        <Stack.Screen name="RecipeBuilder" component={RecipeBuilderScreen} />
        <Stack.Screen name="HPPDashboard" component={HPPDashboardScreen} />
        <Stack.Screen name="StockModule" component={StockModuleScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </PaperProvider>
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
