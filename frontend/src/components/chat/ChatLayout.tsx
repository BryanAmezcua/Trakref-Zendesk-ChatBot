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
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
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
      {/* Header with liquid glass effect */}
      <Box
        component={motion.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
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
            backgroundColor: tokens.colors.background.glass,
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
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                background: tokens.colors.background.glassMedium,
                border: `1px solid ${tokens.colors.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChatBubbleOutlineIcon sx={{ color: tokens.colors.primary.light, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: tokens.colors.text.primary,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                Trakref HelpBot
              </Typography>
              <Typography
                sx={{
                  color: tokens.colors.text.muted,
                  fontSize: '0.75rem',
                  fontWeight: 400,
                }}
              >
                AI-Powered Support
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={newChat}
              sx={{
                borderColor: tokens.colors.border.medium,
                color: tokens.colors.text.secondary,
                borderRadius: 2.5,
                px: 2,
                py: 0.75,
                fontWeight: 500,
                fontSize: '0.8rem',
                backgroundColor: tokens.colors.background.glass,
                '&:hover': {
                  borderColor: tokens.colors.border.strong,
                  backgroundColor: tokens.colors.background.glassMedium,
                },
              }}
            >
              New Chat
            </Button>
            <Tooltip title="Clear chat" arrow>
              <span>
                <IconButton
                  onClick={clearChat}
                  disabled={messages.length === 0}
                  size="small"
                  sx={{
                    color: tokens.colors.text.muted,
                    backgroundColor: tokens.colors.background.glass,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    '&:hover': {
                      color: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                    },
                    '&.Mui-disabled': {
                      color: tokens.colors.text.muted,
                      opacity: 0.4,
                    },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
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
