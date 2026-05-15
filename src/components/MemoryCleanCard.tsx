import { useMemo } from 'react';
import {
  RocketLaunch as RocketIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { MemoryCleanStatus } from '../types/app';

interface MemoryCleanCardProps {
  status: MemoryCleanStatus | null;
  cleaning: boolean;
  autoCleanEnabled: boolean;
  autoCleanIntervalMinutes: number;
  onAutoCleanToggle: (enabled: boolean) => void;
  onAutoCleanIntervalChange: (minutes: number) => void;
  onCleanNow: () => void;
}

const intervalOptions = [5, 10, 30, 60];

export function MemoryCleanCard({
  status,
  cleaning,
  autoCleanEnabled,
  autoCleanIntervalMinutes,
  onAutoCleanToggle,
  onAutoCleanIntervalChange,
  onCleanNow,
}: MemoryCleanCardProps) {
  const memoryPercent = useMemo(() => {
    if (!status) return 0;
    return Math.min(100, Math.max(0, status.memory_percent));
  }, [status]);

  const usedGb = status?.used_memory_gb ?? 0;
  const totalGb = status?.total_memory_gb ?? 0;

  const handleIntervalChange = (event: SelectChangeEvent<number>) => {
    onAutoCleanIntervalChange(Number(event.target.value));
  };

  return (
    <Paper elevation={2} sx={{ p: 1, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.3 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <RocketIcon sx={{ fontSize: 16 }} color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            内存清理
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <SpeedIcon sx={{ fontSize: 14 }} color={autoCleanEnabled ? 'primary' : 'disabled'} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            定时
          </Typography>
          <Switch
            size="small"
            checked={autoCleanEnabled}
            onChange={(event) => onAutoCleanToggle(event.target.checked)}
            color="primary"
            sx={{ transform: 'scale(0.8)' }}
          />
          <FormControl size="small" sx={{ minWidth: 65 }}>
            <Select
              value={autoCleanIntervalMinutes}
              onChange={handleIntervalChange}
              disabled={!autoCleanEnabled}
              sx={{ fontSize: '0.65rem', '& .MuiSelect-select': { py: 0.2, px: 0.8 } }}
            >
              {intervalOptions.map((minutes) => (
                <MenuItem key={minutes} value={minutes} sx={{ fontSize: '0.65rem' }}>
                  {minutes}分钟
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
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
