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
        {prompts.map((prompt) => (
          <motion.div
            key={prompt}
            variants={staggerItem}
            whileHover={{
              y: -2,
              transition: { duration: 0.15 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Box
              onClick={() => onSelect?.(prompt)}
              sx={{
                px: 2,
                py: 1.75,
                borderRadius: 3,
                backgroundColor: tokens.colors.background.glass,
                backdropFilter: tokens.blur.sm,
                WebkitBackdropFilter: tokens.blur.sm,
                border: `1px solid ${tokens.colors.border.subtle}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                '&:hover': {
                  backgroundColor: tokens.colors.background.glassMedium,
                  borderColor: tokens.colors.border.medium,
                  '& .prompt-arrow': {
                    transform: 'translateX(3px)',
                    opacity: 1,
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
                  fontSize: '0.85rem',
                  fontWeight: 400,
                  color: tokens.colors.text.secondary,
                  lineHeight: 1.4,
                  transition: 'color 0.2s',
                }}
              >
                {prompt}
              </Typography>
              <ArrowForwardIcon
                className="prompt-arrow"
                sx={{
                  fontSize: 14,
                  color: tokens.colors.text.muted,
                  opacity: 0.5,
                  transition: 'all 0.2s ease',
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
