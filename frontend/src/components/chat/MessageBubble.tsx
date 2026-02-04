'use client';

import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
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
          <Box key={i} component="ul" sx={{ pl: 2, my: 1.5, listStyleType: 'none' }}>
            {lines.map((line, j) => {
              const text = line.replace(/^[-•]\s*/, '');
              if (!text.trim()) return null;
              return (
                <Typography
                  key={j}
                  component="li"
                  variant="body2"
                  sx={{
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    color: isUser ? 'rgba(255,255,255,0.95)' : tokens.colors.text.primary,
                    '&::before': {
                      content: '""',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: isUser ? 'rgba(255,255,255,0.6)' : tokens.colors.text.muted,
                      flexShrink: 0,
                      mt: 0.9,
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
          <Box key={i} component="ol" sx={{ pl: 2, my: 1.5, listStyleType: 'none', counterReset: 'item' }}>
            {lines.map((line, j) => {
              const text = line.replace(/^\d+\.\s*/, '');
              if (!text.trim()) return null;
              return (
                <Typography
                  key={j}
                  component="li"
                  variant="body2"
                  sx={{
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    color: isUser ? 'rgba(255,255,255,0.95)' : tokens.colors.text.primary,
                    counterIncrement: 'item',
                    '&::before': {
                      content: 'counter(item)',
                      minWidth: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : tokens.colors.background.glassMedium,
                      color: isUser ? 'white' : tokens.colors.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 600,
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
            lineHeight: 1.7,
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
              color: isUser ? 'white' : tokens.colors.text.primary,
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
              backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : tokens.colors.background.glassStrong,
              color: isUser ? 'white' : tokens.colors.text.secondary,
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: '0.85em',
              fontFamily: "'SF Mono', 'Fira Code', monospace",
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
          mb: 2.5,
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isUser
                  ? tokens.colors.primary.main
                  : tokens.colors.background.glassMedium,
                border: isUser ? 'none' : `1px solid ${tokens.colors.border.subtle}`,
                flexShrink: 0,
              }}
            >
              {isUser ? (
                <PersonOutlineIcon sx={{ fontSize: 18, color: 'white' }} />
              ) : (
                <SmartToyOutlinedIcon sx={{ fontSize: 18, color: tokens.colors.text.secondary }} />
              )}
            </Box>
          </motion.div>

          {/* Message content */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              background: isUser
                ? tokens.colors.primary.main
                : tokens.colors.background.glass,
              backdropFilter: isUser ? 'none' : tokens.blur.md,
              WebkitBackdropFilter: isUser ? 'none' : tokens.blur.md,
              color: isUser ? 'white' : tokens.colors.text.primary,
              border: isUser ? 'none' : `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: isUser ? tokens.shadows.button : tokens.shadows.glass,
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
                      animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.15)',
                        }}
                      >
                        <WarningAmberIcon sx={{ fontSize: 16, color: tokens.colors.accent.amber }} />
                        <Typography
                          variant="caption"
                          fontWeight={500}
                          sx={{ color: tokens.colors.accent.amber }}
                        >
                          Limited information available
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message content */}
                <Box>{formatContent(message.content)}</Box>

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
                        backgroundColor: 'rgba(245, 158, 11, 0.06)',
                        borderRadius: 2,
                        border: '1px solid rgba(245, 158, 11, 0.1)',
                        color: tokens.colors.text.secondary,
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}
                    >
                      {message.missingInfo}
                    </Typography>
                  </motion.div>
                )}

                {/* Citations */}
                {isAssistant && message.citations && message.citations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
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
                    borderColor: isUser ? 'rgba(255,255,255,0.12)' : tokens.colors.border.subtle,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: isUser ? 'rgba(255,255,255,0.5)' : tokens.colors.text.muted,
                      fontSize: '0.7rem',
                      fontWeight: 400,
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>

                  {isAssistant && !message.isLoading && (
                    <Tooltip title={copied ? 'Copied!' : 'Copy'} arrow>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{
                          color: tokens.colors.text.muted,
                          width: 26,
                          height: 26,
                          '&:hover': {
                            color: tokens.colors.text.secondary,
                            backgroundColor: tokens.colors.background.glassMedium,
                          },
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <CheckIcon sx={{ fontSize: 14, color: tokens.colors.accent.emerald }} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 13 }} />
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
