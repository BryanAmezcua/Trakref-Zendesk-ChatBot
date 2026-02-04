'use client';

import { Alert, AlertTitle, IconButton, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { tokens } from '@/theme/theme';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({
  error,
  onDismiss,
  onRetry,
}: ErrorBannerProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Box sx={{ px: 2, pt: 2 }}>
            <Alert
              severity="error"
              sx={{
                borderRadius: 3,
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                boxShadow: 'none',
                color: tokens.colors.text.primary,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  color: '#ef4444',
                },
              }}
              action={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {onRetry && (
                    <IconButton
                      aria-label="retry"
                      color="inherit"
                      size="small"
                      onClick={onRetry}
                      sx={{
                        color: tokens.colors.text.muted,
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={onDismiss}
                    sx={{
                      color: tokens.colors.text.muted,
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <AlertTitle sx={{ fontWeight: 500, mb: 0.25, fontSize: '0.875rem' }}>
                Error
              </AlertTitle>
              <Box sx={{ fontSize: '0.8rem', color: tokens.colors.text.secondary }}>
                {error}
              </Box>
            </Alert>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
