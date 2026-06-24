import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  danger: string;
  success: string;
  warning: string;
  icon: string;
  chipBackground: string;
  chipActiveBg: string;
}

const customLightColors: ThemeColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#666666',
  border: '#EAEAEA',
  primary: '#FF5722',
  primaryLight: '#FFCCBC',
  danger: '#D32F2F',
  success: '#25D366',
  warning: '#F9A825',
  icon: '#FF5722',
  chipBackground: '#F5F5F5',
  chipActiveBg: '#FFCCBC',
};

const customDarkColors: ThemeColors = {
  background: '#050505',
  card: '#121212',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2A2A',
  primary: '#FF5722',
  primaryLight: 'rgba(255, 87, 34, 0.15)',
  danger: '#EF5350',
  success: '#25D366',
  warning: '#FFB300',
  icon: '#FF5722',
  chipBackground: '#1A1A1A',
  chipActiveBg: 'rgba(255, 87, 34, 0.25)',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: customLightColors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: customLightColors.primaryLight,
    onPrimaryContainer: '#D84315',
    
    secondary: customLightColors.primary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FBE9E7',
    onSecondaryContainer: '#D84315',

    tertiary: customLightColors.warning,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFF9C4',
    onTertiaryContainer: '#F9A825',
    
    surface: customLightColors.card,
    surfaceVariant: '#F5F5F5',
    onSurface: customLightColors.text,
    onSurfaceVariant: customLightColors.textSecondary,
    
    background: customLightColors.background,
    onBackground: customLightColors.text,
    
    error: customLightColors.danger,
    errorContainer: '#FFCDD2',
    onErrorContainer: customLightColors.danger,
    
    outline: customLightColors.border,
    outlineVariant: '#E0E0E0',
    
    ...customLightColors, // Backward compatibility
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: customDarkColors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: customDarkColors.primaryLight,
    onPrimaryContainer: customDarkColors.primary,
    
    secondary: customDarkColors.primary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#1F1512',
    onSecondaryContainer: customDarkColors.primary,

    tertiary: customDarkColors.warning,
    onTertiary: '#000000',
    tertiaryContainer: '#1A1500',
    onTertiaryContainer: customDarkColors.warning,
    
    surface: customDarkColors.card,
    surfaceVariant: '#1A1A1A',
    onSurface: customDarkColors.text,
    onSurfaceVariant: customDarkColors.textSecondary,
    
    background: customDarkColors.background,
    onBackground: customDarkColors.text,
    
    error: customDarkColors.danger,
    errorContainer: 'rgba(239, 83, 80, 0.15)',
    onErrorContainer: customDarkColors.danger,
    
    outline: customDarkColors.border,
    outlineVariant: '#222222',
    
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#121212',
      level2: '#161616',
      level3: '#1A1A1A',
      level4: '#1C1C1C',
      level5: '#1E1E1E',
    },
    ...customDarkColors, // Backward compatibility
  },
};
