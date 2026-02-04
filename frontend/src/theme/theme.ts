'use client';

import { createTheme } from '@mui/material/styles';

// Design tokens - Premium elegant theme
export const tokens = {
  colors: {
    primary: {
      main: '#0891b2',
      light: '#22d3ee',
      dark: '#0e7490',
      gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)',
      gradientLight: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
      gradientVibrant: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
    },
    accent: {
      purple: '#8b5cf6',
      pink: '#ec4899',
      amber: '#f59e0b',
      emerald: '#10b981',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    },
    background: {
      app: '#0f172a',
      chat: '#1e293b',
      card: '#334155',
      input: '#1e293b',
      glass: 'rgba(30, 41, 59, 0.8)',
      glassDark: 'rgba(15, 23, 42, 0.95)',
      glassLight: 'rgba(51, 65, 85, 0.6)',
      elevated: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
      accent: '#22d3ee',
    },
    message: {
      user: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
      userText: '#ffffff',
      assistant: 'rgba(30, 41, 59, 0.95)',
      assistantBorder: 'rgba(51, 65, 85, 0.5)',
    },
    border: {
      subtle: 'rgba(148, 163, 184, 0.1)',
      medium: 'rgba(148, 163, 184, 0.2)',
      accent: 'rgba(8, 145, 178, 0.3)',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 40px rgba(0, 0, 0, 0.5)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    glow: '0 0 30px rgba(8, 145, 178, 0.3)',
    glowStrong: '0 0 50px rgba(8, 145, 178, 0.4), 0 0 100px rgba(8, 145, 178, 0.2)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    card: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  },
  blur: {
    sm: 'blur(8px)',
    md: 'blur(16px)',
    lg: 'blur(24px)',
    xl: 'blur(40px)',
  },
  gradients: {
    mesh: `
      radial-gradient(at 40% 20%, rgba(8, 145, 178, 0.15) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.08) 0px, transparent 50%),
      radial-gradient(at 80% 50%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(8, 145, 178, 0.1) 0px, transparent 50%)
    `,
    shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
  },
};

const theme = createTheme({
  palette: {
    mode: 'dark',
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
      paper: tokens.colors.background.chat,
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.03em',
      background: tokens.colors.primary.gradientLight,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${tokens.colors.primary.dark} transparent`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadows.glow,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: tokens.colors.primary.gradient,
          boxShadow: tokens.shadows.md,
          '&:hover': {
            background: tokens.colors.primary.gradient,
          },
        },
        outlined: {
          borderColor: tokens.colors.border.accent,
          '&:hover': {
            borderColor: tokens.colors.primary.main,
            background: 'rgba(8, 145, 178, 0.1)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            background: 'rgba(8, 145, 178, 0.15)',
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
          backgroundColor: tokens.colors.background.chat,
          boxShadow: tokens.shadows.card,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.colors.background.card,
          border: `1px solid ${tokens.colors.border.subtle}`,
          boxShadow: tokens.shadows.md,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
