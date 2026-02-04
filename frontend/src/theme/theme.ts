'use client';

import { createTheme } from '@mui/material/styles';

// Design tokens - Light Glass theme (Apple-inspired)
export const tokens = {
  colors: {
    primary: {
      main: '#00859b',
      light: '#60a5fa',
      dark: '#2563eb',
      subtle: 'rgba(59, 130, 246, 0.1)',
    },
    accent: {
      purple: '#8b5cf6',
      pink: '#ec4899',
      amber: '#f59e0b',
      emerald: '#10b981',
    },
    background: {
      app: '#f5f5f7',
      surface: '#ffffff',
      elevated: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.72)',
      glassMedium: 'rgba(255, 255, 255, 0.8)',
      glassStrong: 'rgba(255, 255, 255, 0.9)',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.88)',
      secondary: 'rgba(0, 0, 0, 0.55)',
      muted: 'rgba(0, 0, 0, 0.4)',
      accent: '#2563eb',
    },
    message: {
      user: '#00859b',
      userText: '#ffffff',
      assistant: 'rgba(0, 0, 0, 0.03)',
      assistantBorder: 'rgba(0, 0, 0, 0.08)',
    },
    border: {
      subtle: 'rgba(0, 0, 0, 0.06)',
      medium: 'rgba(0, 0, 0, 0.1)',
      strong: '#00859b',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.1)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.12)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.06)',
    inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    card: '0 2px 8px rgba(0, 0, 0, 0.06)',
    button: '0 2px 12px rgba(59, 130, 246, 0.2)',
  },
  blur: {
    sm: 'blur(12px)',
    md: 'blur(20px)',
    lg: 'blur(32px)',
    xl: 'blur(48px)',
  },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.colors.primary.main,
      light: tokens.colors.primary.light,
      dark: tokens.colors.primary.dark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tokens.colors.accent.purple,
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    background: {
      default: tokens.colors.background.app,
      paper: tokens.colors.background.surface,
    },
    text: {
      primary: tokens.colors.text.primary,
      secondary: tokens.colors.text.secondary,
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: tokens.colors.accent.amber,
    },
    success: {
      main: tokens.colors.accent.emerald,
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: tokens.colors.text.primary,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '-0.005em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '-0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '-0.005em',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0em',
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `rgba(0, 0, 0, 0.15) transparent`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 12,
          padding: '10px 20px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          backgroundColor: tokens.colors.primary.main,
          boxShadow: tokens.shadows.button,
          '&:hover': {
            backgroundColor: tokens.colors.primary.light,
            boxShadow: tokens.shadows.button,
          },
        },
        outlined: {
          borderColor: tokens.colors.border.medium,
          '&:hover': {
            borderColor: tokens.colors.border.strong,
            backgroundColor: tokens.colors.background.glass,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: tokens.colors.background.glassMedium,
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.colors.background.surface,
          boxShadow: tokens.shadows.card,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.colors.background.elevated,
          border: `1px solid ${tokens.colors.border.subtle}`,
          boxShadow: tokens.shadows.md,
          fontSize: '0.75rem',
          fontWeight: 500,
          backdropFilter: tokens.blur.md,
        },
      },
    },
  },
});

export default theme;
