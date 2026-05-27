import { useMemo } from 'react';
import {
  RocketLaunch as RocketIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { MemoryCleanStatus } from '../types/app';

interface MemoryCleanCardProps {
  status: MemoryCleanStatus | null;
  cleaning: boolean;
  onCleanNow: () => void;
}

export function MemoryCleanCard({
  status,
  cleaning,
  onCleanNow,
}: MemoryCleanCardProps) {
  const memoryPercent = useMemo(() => {
    if (!status) return 0;
    return Math.min(100, Math.max(0, status.memory_percent));
  }, [status]);

  const usedGb = status?.used_memory_gb ?? 0;
  const totalGb = status?.total_memory_gb ?? 0;

  return (
    <Paper elevation={2} sx={{ p: 1, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.3 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <RocketIcon sx={{ fontSize: 16 }} color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            内存清理
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          检测到游戏后自动清理一次
        </Typography>
      </Stack>

      <Box sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={0.8} alignItems="baseline">
          <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ lineHeight: 1.2 }}>
            {memoryPercent.toFixed(0)}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            内存占用
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', ml: 'auto' }}>
            {usedGb.toFixed(1)} / {totalGb.toFixed(1)} GB
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={memoryPercent}
          color={memoryPercent >= 85 ? 'error' : memoryPercent >= 70 ? 'warning' : 'primary'}
          sx={{ height: 6, borderRadius: 3, mt: 0.3 }}
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="small"
        fullWidth
        disabled={cleaning}
        onClick={onCleanNow}
        startIcon={<RocketIcon sx={{ fontSize: 16 }} />}
        sx={{ fontWeight: 600, py: 0.4, fontSize: '0.75rem', mt: 'auto' }}
      >
        {cleaning ? '清理中...' : '立即清理'}
      </Button>
    </Paper>
  );
}
