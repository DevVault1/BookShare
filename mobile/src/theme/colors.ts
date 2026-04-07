import type { ColorSchemeName } from 'react-native';

export interface AppColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  success: string;
  successSurface: string;
  imagePlaceholder: string;
}

const lightColors: AppColors = {
  background: '#f8f9fc',
  foreground: '#151a28',
  card: '#ffffff',
  cardForeground: '#151a28',
  popover: '#ffffff',
  popoverForeground: '#151a28',
  primary: '#2463eb',
  primaryForeground: '#f8fafc',
  secondary: '#f0f1f5',
  secondaryForeground: '#191f2f',
  muted: '#f0f1f5',
  mutedForeground: '#5e6778',
  accent: '#f0f5ff',
  accentForeground: '#191f2f',
  destructive: '#dc2828',
  destructiveForeground: '#f8fafc',
  border: '#dee1e8',
  input: '#dee1e8',
  ring: '#2463eb',
  chart1: '#2463eb',
  chart2: '#10b77f',
  chart3: '#7c3bed',
  chart4: '#fbbd23',
  chart5: '#e21d48',
  success: '#10b77f',
  successSurface: '#e9f9f3',
  imagePlaceholder: '#f0f1f5',
};

const darkColors: AppColors = {
  background: '#0e121b',
  foreground: '#f8fafc',
  card: '#131720',
  cardForeground: '#f8fafc',
  popover: '#131720',
  popoverForeground: '#f8fafc',
  primary: '#3b83f7',
  primaryForeground: '#121621',
  secondary: '#1f232d',
  secondaryForeground: '#f8fafc',
  muted: '#1f232d',
  mutedForeground: '#a6b0bf',
  accent: '#1f232d',
  accentForeground: '#f8fafc',
  destructive: '#a62626',
  destructiveForeground: '#f8fafc',
  border: '#272b35',
  input: '#272b35',
  ring: '#3b83f7',
  chart1: '#3b83f7',
  chart2: '#10b77f',
  chart3: '#8852e0',
  chart4: '#fbd128',
  chart5: '#e5345a',
  success: '#10b77f',
  successSurface: '#1d3d34',
  imagePlaceholder: '#1f232d',
};

export const appColorThemes = {
  light: lightColors,
  dark: darkColors,
} as const;

export const getAppColors = (scheme: ColorSchemeName): AppColors => (
  scheme === 'dark' ? darkColors : lightColors
);
