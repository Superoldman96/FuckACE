import { PlayArrow as StartIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import type { SwitchProps } from '@mui/material/Switch';
import type {
  RestrictionSettingKey,
  RestrictionSettings,
} from '../types/app';

interface SettingItem {
  key: RestrictionSettingKey;
  label: string;
  color: SwitchProps['color'];
}

interface ActiveActionsCardProps {
  settings: RestrictionSettings;
  autoStartEnabled: boolean;
  loading: boolean;
  isMonitoring: boolean;
  onSettingChange: (key: RestrictionSettingKey, checked: boolean) => void;
  onToggleAutoStartup: () => void;
  onExecute: () => void;
}

const settingItems: SettingItem[] = [
  { key: 'enableCpuAffinity', label: 'CPU亲和性', color: 'success' },
  { key: 'enableProcessPriority', label: '进程优先级', color: 'success' },
  { key: 'enableEfficiencyMode', label: '效率模式', color: 'warning' },
  { key: 'enableIoPriority', label: 'I/O优先级', color: 'error' },
  { key: 'enableMemoryPriority', label: '内存优先级', color: 'error' },
];

export function ActiveActionsCard({
  settings,
  autoStartEnabled,
  loading,
  isMonitoring,
  onSettingChange,
  onToggleAutoStartup,
  onExecute,
}: ActiveActionsCardProps) {
  return (
    <Paper elevation={2} sx={{ p: 1.5, flex: 1, minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5, fontWeight: 600 }}>
        主动限制(开游戏后使用)
      </Typography>
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.5} sx={{ mb: 0.5 }}>
        {settingItems.map((item) => (
          <FormControlLabel
            key={item.key}
            control={
              <Switch
                checked={settings[item.key]}
                onChange={(event) => onSettingChange(item.key, event.target.checked)}
                disabled={isMonitoring}
                color={item.color}
                size="small"
              />
            }
            label={<Typography variant="caption">{item.label}</Typography>}
            sx={{ m: 0 }}
          />
        ))}
        <FormControlLabel
          control={
            <Switch
              checked={autoStartEnabled}
              onChange={() => onToggleAutoStartup()}
              color="primary"
              size="small"
            />
          }
          label={<Typography variant="caption">开机自启动</Typography>}
          sx={{ m: 0 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoRestrict}
              onChange={(event) => onSettingChange('autoRestrict', event.target.checked)}
              disabled={isMonitoring}
              color="info"
              size="small"
            />
          }
          label={<Typography variant="caption">自动限制（新）</Typography>}
          sx={{ m: 0 }}
        />
      </Box>
      <Box display="flex" flexDirection="column" gap={0.6} sx={{ flex: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<StartIcon />}
          onClick={onExecute}
          disabled={loading || isMonitoring}
          color="primary"
          size="small"
          fullWidth
        >
          执行限制
        </Button>
      </Box>
    </Paper>
  );
}
