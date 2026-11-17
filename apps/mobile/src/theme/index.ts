export const colors = {
  bg: '#080B12',
  bg2: '#111722',
  card: '#181E29',
  cardLight: '#F8F6F2',
  gold: '#D8AE57',
  goldLight: '#F1D38A',
  goldDark: '#B98C35',
  text: '#FFFFFF',
  textDim: '#A9AFBA',
  textOnGold: '#0B0D12',
  border: '#343B48',
  success: '#16A765',
  danger: '#E5484D',
  warning: '#F5A524',
} as const;

export const goldGradient = [colors.goldLight, colors.gold, colors.goldDark] as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const font = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '800' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  dim: { fontSize: 13, color: colors.textDim },
  small: { fontSize: 11, color: colors.textDim },
};

export const formatINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
