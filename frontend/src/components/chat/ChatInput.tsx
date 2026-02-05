'use client';

import { Box, InputBase, IconButton, CircularProgress, Switch, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useState, KeyboardEvent } from 'react';
import { tokens } from '@/theme/theme';
import { useChatStore } from '@/store/chatStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { agentMode, toggleAgentMode } = useChatStore();

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
          height: 48,
          background: `linear-gradient(to top, ${tokens.colors.background.app}, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          py: 2,
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        {/* Agent mode toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            mb: 1.5,
            pl: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: '12px',
              backgroundColor: agentMode ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <SmartToyOutlinedIcon
              sx={{
                fontSize: 16,
                color: agentMode ? tokens.colors.accent.purple : tokens.colors.text.muted,
                transition: 'color 0.2s ease',
              }}
            />
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: agentMode ? tokens.colors.accent.purple : tokens.colors.text.muted,
                transition: 'color 0.2s ease',
                userSelect: 'none',
              }}
            >
              Agent
            </Typography>
            <Switch
              checked={agentMode}
              onChange={toggleAgentMode}
              size="small"
              sx={{
                width: 36,
                height: 20,
                padding: 0,
                ml: 0.5,
                '& .MuiSwitch-switchBase': {
                  padding: 0,
                  margin: '2px',
                  transitionDuration: '200ms',
                  '&.Mui-checked': {
                    transform: 'translateX(16px)',
                    color: '#fff',
                    '& + .MuiSwitch-track': {
                      backgroundColor: tokens.colors.accent.purple,
                      opacity: 1,
                      border: 0,
                    },
                  },
                },
                '& .MuiSwitch-thumb': {
                  boxSizing: 'border-box',
                  width: 16,
                  height: 16,
                },
                '& .MuiSwitch-track': {
                  borderRadius: 10,
                  backgroundColor: tokens.colors.border.medium,
                  opacity: 1,
                  transition: 'background-color 0.2s ease',
                },
              }}
            />
          </Box>
        </Box>

        {/* Input container - pill shape like MUI chat */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1,
            borderRadius: '28px',
            backgroundColor: tokens.colors.background.surface,
            border: '1px solid',
            borderColor: agentMode
              ? tokens.colors.accent.purple
              : isFocused
                ? tokens.colors.border.strong
                : tokens.colors.border.subtle,
            boxShadow: agentMode
              ? `0 0 0 2px rgba(139, 92, 246, 0.15)`
              : isFocused
                ? `0 0 0 3px ${tokens.colors.primary.subtle}`
                : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: agentMode
                ? tokens.colors.accent.purple
                : isFocused
                  ? tokens.colors.border.strong
                  : tokens.colors.border.medium,
            },
          }}
        >
          <InputBase
            fullWidth
            multiline
            maxRows={4}
            placeholder={agentMode ? "Ask the agent..." : "Ask anything about Trakref..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            sx={{
              flex: 1,
              fontSize: '0.95rem',
              color: tokens.colors.text.primary,
              fontWeight: 400,
              lineHeight: 1.5,
              py: 0.75,
              '& .MuiInputBase-input': {
                padding: 0,
                '&::placeholder': {
                  color: tokens.colors.text.muted,
                  opacity: 1,
                },
              },
            }}
          />

          {/* Send button - circular, inside the input */}
          <motion.div
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
          >
            <IconButton
              onClick={handleSend}
              disabled={!canSend}
              size="small"
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                background: canSend
                  ? tokens.colors.primary.main
                  : 'transparent',
                color: canSend ? '#fff' : tokens.colors.text.muted,
                borderRadius: '50%',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: canSend
                    ? tokens.colors.primary.light
                    : tokens.colors.background.glass,
                },
                '&.Mui-disabled': {
                  background: 'transparent',
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
                      size={18}
                      sx={{
                        color: tokens.colors.text.muted,
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </IconButton>
          </motion.div>
        </Box>

        {/* Helper text */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 1.5,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: '0.7rem',
              color: agentMode ? tokens.colors.accent.purple : tokens.colors.text.muted,
              fontWeight: 400,
              transition: 'color 0.2s ease',
            }}
          >
            {agentMode ? 'Agent mode: May ask clarifying questions' : 'Powered by Trakref Help Center'}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
