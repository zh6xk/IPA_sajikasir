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
  icon: string;
  chipBackground: string;
  chipActiveBg: string;
}

export const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  primary: '#FF5722',
  primaryLight: '#FFCCBC',
  danger: '#D32F2F',
  success: '#25D366',
  icon: '#FF5722',
  chipBackground: '#F5F5F5',
  chipActiveBg: '#FFCCBC',
};

export const darkTheme: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  primary: '#FF5722',
  primaryLight: 'rgba(255, 87, 34, 0.2)',
  danger: '#EF5350',
  success: '#25D366',
  icon: '#FF5722',
  chipBackground: '#2C2C2C',
  chipActiveBg: 'rgba(255, 87, 34, 0.3)',
};
