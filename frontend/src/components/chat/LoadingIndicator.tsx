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
    color: tokens.colors.primary.light,
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
        py: 1,
      }}
    >
      {/* Stage message with animated dots */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                backgroundColor: `${config.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: 18, color: config.color }} />
            </Box>
          </motion.div>
        </AnimatePresence>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Typography
                sx={{
                  color: tokens.colors.text.secondary,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {config.message}
              </Typography>
            </motion.div>
          </AnimatePresence>

          {/* Animated dots */}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: config.color,
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
          gap: 0.75,
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
                height: 4,
                borderRadius: 2,
                backgroundColor: tokens.colors.background.card,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {(isCompleted || isCurrent) && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: isCompleted ? '100%' : isCurrent ? '60%' : '0%',
                  }}
                  transition={{
                    duration: isCurrent ? 2 : 0.5,
                    ease: isCurrent ? 'linear' : 'easeOut',
                  }}
                  style={{
                    height: '100%',
                    background: isCompleted
                      ? tokens.colors.accent.emerald
                      : `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
                    borderRadius: 2,
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
          px: 0.5,
        }}
      >
        {stages.map((s, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = s === stage;

          return (
            <Typography
              key={s}
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isCompleted
                  ? tokens.colors.accent.emerald
                  : isCurrent
                  ? config.color
                  : tokens.colors.text.muted,
                transition: 'color 0.3s',
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
