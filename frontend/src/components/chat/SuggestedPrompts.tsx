'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { tokens } from '@/theme/theme';
import { staggerContainer, staggerItem } from '@/lib/animations';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect?: (prompt: string) => void;
}

export default function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        {prompts.map((prompt, index) => (
          <motion.div
            key={prompt}
            variants={staggerItem}
            whileHover={{
              y: -4,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Box
              onClick={() => onSelect?.(prompt)}
              sx={{
                px: 2.5,
                py: 2,
                borderRadius: 3,
                backgroundColor: tokens.colors.background.glass,
                backdropFilter: tokens.blur.sm,
                WebkitBackdropFilter: tokens.blur.sm,
                border: `1px solid ${tokens.colors.border.subtle}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, transparent 0%, ${tokens.colors.primary.main}08 100%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s',
                },
                '&:hover': {
                  borderColor: tokens.colors.border.accent,
                  boxShadow: tokens.shadows.glow,
                  '&::before': {
                    opacity: 1,
                  },
                  '& .prompt-arrow': {
                    transform: 'translateX(4px)',
                    color: tokens.colors.primary.light,
                  },
                  '& .prompt-text': {
                    color: tokens.colors.text.primary,
                  },
                },
              }}
            >
              <Typography
                className="prompt-text"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: tokens.colors.text.secondary,
                  lineHeight: 1.5,
                  transition: 'color 0.2s',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {prompt}
              </Typography>
              <ArrowForwardIcon
                className="prompt-arrow"
                sx={{
                  fontSize: 16,
                  color: tokens.colors.text.muted,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                }}
              />
            </Box>
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
}
