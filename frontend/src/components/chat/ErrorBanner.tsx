'use client';

import { Alert, AlertTitle, IconButton, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

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
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ px: 2, pt: 2 }}>
            <Alert
              severity="error"
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                },
              }}
              action={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {onRetry && (
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <IconButton
                        aria-label="retry"
                        color="inherit"
                        size="small"
                        onClick={onRetry}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={onDismiss}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </motion.div>
                </Box>
              }
            >
              <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>Error</AlertTitle>
              {error}
            </Alert>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
