'use client';

import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { LoadingStage } from '@/store/chatStore';
import { tokens } from '@/theme/theme';

interface LoadingIndicatorProps {
  stage?: LoadingStage;
}

const stageConfig = {
  searching: {
    icon: SearchIcon,
    message: 'Searching help articles',
    color: tokens.colors.primary.light,
  },
  reading: {
    icon: AutoStoriesIcon,
    message: 'Reading relevant sections',
    color: tokens.colors.accent.purple,
  },
  writing: {
    icon: EditNoteIcon,
    message: 'Writing response',
    color: tokens.colors.accent.emerald,
  },
  idle: {
    icon: SearchIcon,
    message: 'Thinking',
    color: tokens.colors.text.secondary,
  },
};

export default function LoadingIndicator({ stage = 'searching' }: LoadingIndicatorProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  const stages = ['searching', 'reading', 'writing'];
  const currentIndex = stages.indexOf(stage);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        py: 0.5,
      }}
    >
      {/* Stage message with animated dots */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 2,
                backgroundColor: tokens.colors.background.glassMedium,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: 16, color: config.color }} />
            </Box>
          </motion.div>
        </AnimatePresence>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              <Typography
                sx={{
                  color: tokens.colors.text.secondary,
                  fontSize: '0.85rem',
                  fontWeight: 400,
                }}
              >
                {config.message}
              </Typography>
            </motion.div>
          </AnimatePresence>

          {/* Animated dots */}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 0.25 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: tokens.colors.text.muted,
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Progress bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
        }}
      >
        {stages.map((s, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = s === stage;

          return (
            <Box
              key={s}
              sx={{
                flex: 1,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: tokens.colors.background.glassMedium,
                overflow: 'hidden',
              }}
            >
              {(isCompleted || isCurrent) && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                  }}
                  transition={{
                    duration: isCurrent ? 2 : 0.4,
                    ease: isCurrent ? 'linear' : 'easeOut',
                  }}
                  style={{
                    height: '100%',
                    backgroundColor: isCompleted
                      ? tokens.colors.accent.emerald
                      : config.color,
                    borderRadius: 1.5,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Stage indicators */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 0.25,
        }}
      >
        {stages.map((s, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = s === stage;

          return (
            <Typography
              key={s}
              sx={{
                fontSize: '0.6rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: isCompleted
                  ? tokens.colors.accent.emerald
                  : isCurrent
                  ? tokens.colors.text.secondary
                  : tokens.colors.text.muted,
                transition: 'color 0.2s',
              }}
            >
              {s === 'searching' ? 'Search' : s === 'reading' ? 'Read' : 'Write'}
            </Typography>
          );
        })}
      </Box>
    </Box>
  );
}
