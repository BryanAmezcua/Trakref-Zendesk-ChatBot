'use client';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Link,
  Box,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useState } from 'react';
import { Citation } from '@/types/chat';
import { tokens } from '@/theme/theme';

interface SourcesAccordionProps {
  citations: Citation[];
}

export default function SourcesAccordion({ citations }: SourcesAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{
        mt: 1.5,
        boxShadow: 'none',
        backgroundColor: 'transparent',
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          minHeight: 'unset',
          padding: 0,
        },
        '& .MuiAccordionSummary-content': {
          margin: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ExpandMoreIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          </motion.div>
        }
        sx={{
          '&:hover': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Chip
            size="small"
            label={`${citations.length} source${citations.length > 1 ? 's' : ''}`}
            sx={{
              background: tokens.colors.primary.gradient,
              color: 'white',
              fontSize: '0.75rem',
              height: 26,
              fontWeight: 500,
              '& .MuiChip-label': {
                px: 1.5,
              },
            }}
          />
        </motion.div>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 1.5, pb: 0, px: 0 }}>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {citations.map((citation, index) => (
                  <motion.div
                    key={citation.article_id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: 'rgba(0, 133, 155, 0.04)',
                          border: '1px solid rgba(0, 133, 155, 0.1)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 133, 155, 0.08)',
                            borderColor: 'rgba(0, 133, 155, 0.2)',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            backgroundColor: 'rgba(0, 133, 155, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ArticleIcon
                            sx={{ fontSize: 18, color: 'primary.main' }}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: 'primary.main',
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              lineHeight: 1.4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {citation.title}
                            <OpenInNewIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.7rem',
                            }}
                          >
                            {citation.article_id}
                          </Typography>
                        </Box>
                      </Box>
                    </Link>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </AccordionDetails>
    </Accordion>
  );
}
