'use client';

import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { tokens } from '@/theme/theme';

interface MessageListProps {
  messages: Message[];
  onSuggestionClick?: (prompt: string) => void;
}

const suggestions = [
  'How do I get started with Trakref?',
  'How do I add a new asset?',
  'What are leak rate calculations?',
  'How do I run a compliance report?',
];

export default function MessageList({ messages, onSuggestionClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Simple logo container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 4,
              background: tokens.colors.background.glassMedium,
              border: `1px solid ${tokens.colors.border.subtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 32, color: tokens.colors.primary.light }} />
          </Box>
        </motion.div>

        {/* Welcome text */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1.5rem',
              color: tokens.colors.text.primary,
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Welcome to Trakref HelpBot
          </Typography>
          <Typography
            sx={{
              color: tokens.colors.text.secondary,
              maxWidth: 400,
              lineHeight: 1.6,
              fontSize: '0.9rem',
              mx: 'auto',
            }}
          >
            Your AI assistant for refrigerant tracking, compliance, and asset management.
          </Typography>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              mb: 1,
            }}
          >
            {['Instant Answers', 'Help Articles', 'Step-by-Step Guides'].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: tokens.colors.background.glass,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                  }}
                >
                  <Typography
                    sx={{
                      color: tokens.colors.text.muted,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                    }}
                  >
                    {feature}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Suggested prompts */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{ width: '100%', maxWidth: 560 }}
        >
          <Typography
            sx={{
              color: tokens.colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              fontSize: '0.65rem',
              mb: 1.5,
            }}
          >
            Try asking
          </Typography>
          <SuggestedPrompts
            prompts={suggestions}
            onSelect={onSuggestionClick}
          />
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        py: 3,
      }}
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </Box>
  );
}
