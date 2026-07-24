export type ThemeName = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  card: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
}

export const palette: Record<ThemeName, ThemeColors> = {
  dark: {
    background: '#0A0A0A',
    card: '#111111',
    accent: '#6366F1',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    border: '#27272A',
  },
  light: {
    background: '#FFFFFF',
    card: '#F4F4F5',
    accent: '#6366F1',
    text: '#09090B',
    textMuted: '#71717A',
    border: '#E4E4E7',
  },
};
