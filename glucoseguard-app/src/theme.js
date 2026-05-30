// GlucoseGuard — Color & Theme Tokens (Vintage Light Theme — Enhanced)
export const COLORS = {
  bg: '#fbf8f3',           // Parchment warm light background
  bgCard: '#fffcf7',       // Warm soft ivory card background
  bgGlass: 'rgba(253,251,247,0.92)', // Textured warm glass
  bgPaper: '#fdf9f2',      // Aged paper tone
  border: 'rgba(92,72,58,0.12)',     // Soft sepia/antique border
  borderGold: '#c9a86c',   // Aged brass/gold border
  borderCopper: '#b87333', // Antique copper border
  cyan: '#2c7a7b',         // Elegant deep teal
  cyanLight: '#4a9b9c',    // Lighter teal accent
  emerald: '#4a7c59',      // Sage clinical green
  purple: '#723d46',       // Academic medical plum
  orange: '#c97a3e',       // Deep copper/terracotta
  red: '#9e2a2b',          // Rich crimson warning red
  yellow: '#b7791f',       // Brass/antique gold
  textPrimary: '#2b221a',  // Warm espresso/charcoal text
  textSecondary: '#6e5e53',// Muted bronze/sepia text
  textMuted: '#9a8d82',    // Antique slate/aged paper text
  brass: '#c5a95a',        // Classic brass metallic
  sepia: '#7a6248',        // Rich sepia tone
  parchment: '#f5ead5',    // Deep parchment
  ivory: '#fffef9',        // Pure ivory
  shadow: 'rgba(43, 34, 26, 0.15)', // Warm shadow base
};

export const GRADIENTS = {
  header: ['#f6f1eb', '#eaddcf'],         // Classic medical binder headers
  headerDeep: ['#f0e8d8', '#e5d4be'],     // Deeper parchment header
  cyan: ['#3c8a8b', '#2c7a7b'],           // Teal scale
  cyanSoft: ['#e8f4f4', '#d4ecec'],       // Soft teal background tint
  emerald: ['#5a8f76', '#4a7c59'],        // Sage scale
  purple: ['#8f4f5a', '#723d46'],         // Antique wine/plum scale
  danger: ['#b33c3d', '#9e2a2b'],         // Crimson warnings
  brass: ['#d4b863', '#b7922e', '#8c6a1a'], // Multi-stop metallic brass
  copper: ['#d4924a', '#b87333', '#8c5520'], // Multi-stop antique copper
  parchment: ['#fefaf2', '#f5ead5', '#ebe0c8'], // Vintage paper texture
  parchmentCard: ['#fffef9', '#fff8ed'], // Card background gradient
  gold: ['#f2d06e', '#c9a040', '#a07820'],  // Rich gold accent
  ivory: ['#fffef9', '#fdf7e8'],          // Pure ivory to cream
};

export const FONTS = {
  bold: { fontWeight: '700' },
  semibold: { fontWeight: '600' },
  medium: { fontWeight: '500' },
  regular: { fontWeight: '400' },
  light: { fontWeight: '300' },
};

export const SHADOWS = {
  card: {
    shadowColor: '#5c483a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  deep: {
    shadowColor: '#2b221a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  button: {
    shadowColor: '#5c483a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};
