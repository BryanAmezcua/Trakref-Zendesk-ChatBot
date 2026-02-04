'use client';

import { Box, TextField, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useState, KeyboardEvent } from 'react';
import { tokens } from '@/theme/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && input.trim();

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Gradient fade overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          height: 60,
          background: `linear-gradient(to top, ${tokens.colors.background.app}, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Glass effect background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: tokens.colors.background.glassDark,
          backdropFilter: tokens.blur.lg,
          WebkitBackdropFilter: tokens.blur.lg,
          borderTop: `1px solid ${tokens.colors.border.subtle}`,
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          p: 2.5,
          maxWidth: 900,
          mx: 'auto',
        }}
      >
        <motion.div
          animate={{
            boxShadow: isFocused ? tokens.shadows.glowStrong : tokens.shadows.card,
          }}
          transition={{ duration: 0.3 }}
          style={{ borderRadius: 20 }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-end',
              p: 1,
              borderRadius: 5,
              backgroundColor: tokens.colors.background.chat,
              border: '1px solid',
              borderColor: isFocused ? tokens.colors.primary.main : tokens.colors.border.medium,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': isFocused ? {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, rgba(8, 145, 178, 0.03) 0%, rgba(139, 92, 246, 0.02) 100%)`,
                pointerEvents: 'none',
              } : {},
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask anything about Trakref..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  px: 1.5,
                  fontSize: '0.95rem',
                  color: tokens.colors.text.primary,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  '&::placeholder': {
                    color: tokens.colors.text.muted,
                    opacity: 1,
                  },
                },
              }}
            />
            <Tooltip
              title={disabled ? 'Generating response...' : canSend ? 'Send message' : 'Type a message'}
              arrow
            >
              <span>
                <motion.div
                  whileHover={canSend ? { scale: 1.05, y: -2 } : {}}
                  whileTap={canSend ? { scale: 0.95 } : {}}
                >
                  <IconButton
                    onClick={handleSend}
                    disabled={!canSend}
                    sx={{
                      width: 48,
                      height: 48,
                      background: canSend
                        ? tokens.colors.primary.gradientVibrant
                        : tokens.colors.background.card,
                      color: canSend ? 'white' : tokens.colors.text.muted,
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: canSend ? tokens.shadows.glow : 'none',
                      '&:hover': {
                        background: canSend
                          ? tokens.colors.primary.gradientVibrant
                          : tokens.colors.background.card,
                      },
                      '&.Mui-disabled': {
                        background: tokens.colors.background.card,
                        color: tokens.colors.text.muted,
                      },
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {disabled ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <CircularProgress
                            size={22}
                            sx={{
                              color: tokens.colors.primary.light,
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="send"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <KeyboardArrowUpIcon sx={{ fontSize: 26 }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </IconButton>
                </motion.div>
              </span>
            </Tooltip>
          </Box>
        </motion.div>

        {/* Helper text */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: '0.72rem',
              color: tokens.colors.text.muted,
              fontWeight: 500,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box
              component="span"
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: tokens.colors.accent.emerald,
                animation: 'pulse 2s infinite',
              }}
            />
            Answers powered by Trakref Help Center
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
