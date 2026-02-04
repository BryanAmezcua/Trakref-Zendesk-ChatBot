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
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
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
            <ExpandMoreIcon sx={{ fontSize: 16, color: tokens.colors.text.muted }} />
          </motion.div>
        }
        sx={{
          '&:hover': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Chip
          size="small"
          label={`${citations.length} source${citations.length > 1 ? 's' : ''}`}
          sx={{
            backgroundColor: tokens.colors.background.glassMedium,
            color: tokens.colors.text.secondary,
            fontSize: '0.7rem',
            height: 24,
            fontWeight: 500,
            border: `1px solid ${tokens.colors.border.subtle}`,
            '& .MuiChip-label': {
              px: 1.25,
            },
          }}
        />
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {citations.map((citation, index) => (
                  <motion.div
                    key={citation.article_id || index}
                    initial={{ opacity: 0, x: -8 }}
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
                          gap: 1.25,
                          p: 1.25,
                          borderRadius: 0.5,
                          backgroundColor: tokens.colors.background.glass,
                          border: `1px solid ${tokens.colors.border.subtle}`,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: tokens.colors.background.glassMedium,
                            borderColor: tokens.colors.border.medium,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1.5,
                            backgroundColor: tokens.colors.background.glassMedium,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ArticleOutlinedIcon
                            sx={{ fontSize: 15, color: tokens.colors.text.secondary }}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: tokens.colors.text.secondary,
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              lineHeight: 1.4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {citation.title}
                            <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: tokens.colors.text.muted,
                              fontSize: '0.65rem',
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
