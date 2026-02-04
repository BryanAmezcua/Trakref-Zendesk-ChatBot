'use client';

import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useState } from 'react';
import { Message } from '@/types/chat';
import { useChatStore } from '@/store/chatStore';
import { tokens } from '@/theme/theme';
import SourcesAccordion from './SourcesAccordion';
import LoadingIndicator from './LoadingIndicator';
import { messageVariants } from '@/lib/animations';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const loadingStage = useChatStore((state) => state.loadingStage);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format content with basic markdown support
  const formatContent = (content: string) => {
    const paragraphs = content.split('\n\n');

    return paragraphs.map((para, i) => {
      if (para.includes('\n-') || para.startsWith('-')) {
        const lines = para.split('\n');
        return (
          <Box key={i} component="ul" sx={{ pl: 2.5, my: 1.5, listStyleType: 'none' }}>
            {lines.map((line, j) => {
              const text = line.replace(/^[-•]\s*/, '');
              if (!text.trim()) return null;
              return (
                <Typography
                  key={j}
                  component="li"
                  variant="body2"
                  sx={{
                    mb: 0.75,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    color: isUser ? 'rgba(255,255,255,0.95)' : tokens.colors.text.primary,
                    '&::before': {
                      content: '""',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: isUser ? 'rgba(255,255,255,0.7)' : tokens.colors.primary.main,
                      flexShrink: 0,
                      mt: 0.8,
                    },
                  }}
                >
                  <span>{formatInlineStyles(text)}</span>
                </Typography>
              );
            })}
          </Box>
        );
      }

      if (/^\d+\./.test(para)) {
        const lines = para.split('\n');
        return (
          <Box key={i} component="ol" sx={{ pl: 2.5, my: 1.5, listStyleType: 'none', counterReset: 'item' }}>
            {lines.map((line, j) => {
              const text = line.replace(/^\d+\.\s*/, '');
              if (!text.trim()) return null;
              return (
                <Typography
                  key={j}
                  component="li"
                  variant="body2"
                  sx={{
                    mb: 0.75,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    color: isUser ? 'rgba(255,255,255,0.95)' : tokens.colors.text.primary,
                    counterIncrement: 'item',
                    '&::before': {
                      content: 'counter(item)',
                      minWidth: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(8, 145, 178, 0.15)',
                      color: isUser ? 'white' : tokens.colors.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    },
                  }}
                >
                  <span>{formatInlineStyles(text)}</span>
                </Typography>
              );
            })}
          </Box>
        );
      }

      return (
        <Typography
          key={i}
          variant="body2"
          sx={{
            mb: 1.5,
            color: isUser ? 'rgba(255,255,255,0.95)' : tokens.colors.text.primary,
            lineHeight: 1.75,
          }}
        >
          {formatInlineStyles(para)}
        </Typography>
      );
    });
  };

  const formatInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={i}
            style={{
              fontWeight: 600,
              color: isUser ? 'white' : tokens.colors.text.accent,
            }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(8, 145, 178, 0.1)',
              color: isUser ? 'white' : tokens.colors.primary.light,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.85em',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: 500,
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 3,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 1.5,
            maxWidth: '85%',
          }}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isUser
                  ? tokens.colors.primary.gradientVibrant
                  : tokens.colors.background.glassLight,
                border: isUser ? 'none' : `1px solid ${tokens.colors.border.subtle}`,
                boxShadow: isUser ? tokens.shadows.glow : tokens.shadows.sm,
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isUser ? (
                <PersonOutlineIcon sx={{ fontSize: 22, color: 'white' }} />
              ) : (
                <AutoAwesomeIcon sx={{ fontSize: 20, color: tokens.colors.primary.light }} />
              )}
              {/* Typing ring animation */}
              {message.isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: 14,
                    border: `2px solid ${tokens.colors.primary.light}`,
                    opacity: 0.5,
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 14,
                      borderTop: '2px solid transparent',
                      borderRight: '2px solid transparent',
                      borderBottom: `2px solid ${tokens.colors.primary.light}`,
                      borderLeft: `2px solid ${tokens.colors.primary.light}`,
                    }}
                  />
                </motion.div>
              )}
            </Box>
          </motion.div>

          {/* Message content */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              background: isUser
                ? tokens.colors.primary.gradientVibrant
                : tokens.colors.background.glass,
              backdropFilter: isUser ? 'none' : tokens.blur.md,
              WebkitBackdropFilter: isUser ? 'none' : tokens.blur.md,
              color: isUser ? 'white' : tokens.colors.text.primary,
              borderRadius: 4,
              border: isUser ? 'none' : `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: isUser ? tokens.shadows.glow : tokens.shadows.card,
              position: 'relative',
              overflow: 'hidden',
              '&::before': isUser ? {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: tokens.gradients.shimmer,
                opacity: 0.3,
              } : {},
            }}
          >
            {message.isLoading ? (
              <LoadingIndicator stage={loadingStage} />
            ) : (
              <>
                {/* Insufficient context warning */}
                <AnimatePresence>
                  {message.insufficientContext && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2.5,
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        <WarningAmberIcon sx={{ fontSize: 18, color: tokens.colors.accent.amber }} />
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{ color: tokens.colors.accent.amber }}
                        >
                          Limited information available
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message content */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>{formatContent(message.content)}</Box>

                {/* Missing info note */}
                {message.missingInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 2,
                        p: 1.5,
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        borderRadius: 2,
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        color: tokens.colors.text.secondary,
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                      }}
                    >
                      {message.missingInfo}
                    </Typography>
                  </motion.div>
                )}

                {/* Citations */}
                {isAssistant && message.citations && message.citations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <SourcesAccordion citations={message.citations} />
                  </motion.div>
                )}

                {/* Timestamp and actions */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 2,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: isUser ? 'rgba(255,255,255,0.15)' : tokens.colors.border.subtle,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: isUser ? 'rgba(255,255,255,0.6)' : tokens.colors.text.muted,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>

                  {isAssistant && !message.isLoading && (
                    <Tooltip title={copied ? 'Copied!' : 'Copy answer'} arrow>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{
                          color: tokens.colors.text.muted,
                          width: 28,
                          height: 28,
                          '&:hover': {
                            color: tokens.colors.primary.light,
                            backgroundColor: 'rgba(8, 145, 178, 0.15)',
                          },
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                            >
                              <CheckIcon sx={{ fontSize: 16, color: tokens.colors.accent.emerald }} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 14 }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </motion.div>
  );
}
