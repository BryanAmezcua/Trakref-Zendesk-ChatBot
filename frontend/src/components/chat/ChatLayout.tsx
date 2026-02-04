'use client';

import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useChatStore } from '@/store/chatStore';
import { tokens } from '@/theme/theme';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ErrorBanner from './ErrorBanner';

export default function ChatLayout() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    newChat,
    setError,
  } = useChatStore();

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: tokens.colors.background.app,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Animated background mesh */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: tokens.gradients.mesh,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating orb decorations */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8, 145, 178, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <motion.div
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header with glassmorphism */}
      <Box
        component={motion.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        sx={{
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Glass background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: tokens.colors.background.glassDark,
            backdropFilter: tokens.blur.lg,
            WebkitBackdropFilter: tokens.blur.lg,
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
          }}
        />

        {/* Header content */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 4 },
            py: 2,
            maxWidth: 1400,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  background: tokens.colors.primary.gradientVibrant,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: tokens.shadows.glow,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: tokens.gradients.shimmer,
                    animation: 'shimmer 2s infinite',
                  },
                }}
              >
                <AutoAwesomeIcon sx={{ color: 'white', fontSize: 28, position: 'relative', zIndex: 1 }} />
              </Box>
            </motion.div>
            <Box>
              <Typography
                sx={{
                  background: tokens.colors.primary.gradientLight,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Trakref HelpBot
              </Typography>
              <Typography
                sx={{
                  color: tokens.colors.text.muted,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                AI-Powered Support Assistant
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={newChat}
                sx={{
                  borderColor: tokens.colors.border.accent,
                  color: tokens.colors.text.secondary,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  backdropFilter: tokens.blur.sm,
                  backgroundColor: 'rgba(8, 145, 178, 0.05)',
                  '&:hover': {
                    borderColor: tokens.colors.primary.main,
                    color: tokens.colors.primary.light,
                    backgroundColor: 'rgba(8, 145, 178, 0.15)',
                    boxShadow: tokens.shadows.glow,
                  },
                }}
              >
                New Chat
              </Button>
            </motion.div>
            <Tooltip title="Clear chat" arrow>
              <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={clearChat}
                  disabled={messages.length === 0}
                  sx={{
                    color: tokens.colors.text.muted,
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    '&:hover': {
                      color: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    },
                    '&.Mui-disabled': {
                      color: tokens.colors.text.muted,
                      opacity: 0.4,
                    },
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </motion.span>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Error banner */}
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxWidth: 900,
          width: '100%',
          mx: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <MessageList
          messages={messages}
          onSuggestionClick={handleSuggestionClick}
        />
      </Box>

      {/* Input area */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Box>
  );
}
