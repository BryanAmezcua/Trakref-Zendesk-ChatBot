'use client';

import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
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
          position: 'relative',
        }}
      >
        {/* Animated logo container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 140,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `2px dashed ${tokens.colors.border.accent}`,
                opacity: 0.4,
              }}
            />

            {/* Middle ring with gradient */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 15,
                borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent, ${tokens.colors.primary.main}40, transparent)`,
              }}
            />

            {/* Pulsing glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                inset: 20,
                borderRadius: '50%',
                background: tokens.colors.primary.gradient,
                filter: 'blur(20px)',
              }}
            />

            {/* Inner circle with icon */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: tokens.colors.primary.gradientVibrant,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: tokens.shadows.glowStrong,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </motion.div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  x: [0, Math.sin(i * 60 * Math.PI / 180) * 10, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: tokens.colors.primary.light,
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
              />
            ))}
          </Box>
        </motion.div>

        {/* Welcome text */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '2rem',
              background: tokens.colors.primary.gradientLight,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1.5,
              letterSpacing: '-0.03em',
            }}
          >
            Welcome to Trakref HelpBot
          </Typography>
          <Typography
            sx={{
              color: tokens.colors.text.secondary,
              maxWidth: 480,
              lineHeight: 1.7,
              fontSize: '1rem',
              mx: 'auto',
            }}
          >
            Your AI-powered assistant for refrigerant tracking, compliance reporting,
            asset management, and everything Trakref.
          </Typography>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            {['Instant Answers', 'Help Articles', 'Step-by-Step Guides'].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: 3,
                    backgroundColor: 'rgba(8, 145, 178, 0.1)',
                    border: `1px solid ${tokens.colors.border.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <RocketLaunchIcon sx={{ fontSize: 14, color: tokens.colors.primary.light }} />
                  <Typography
                    sx={{
                      color: tokens.colors.text.accent,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
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
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ width: '100%', maxWidth: 600 }}
        >
          <Typography
            sx={{
              color: tokens.colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              fontSize: '0.7rem',
              mb: 2,
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
