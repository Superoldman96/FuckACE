import { Box, Paper, Typography } from '@mui/material';
import type { SystemInfo } from '../types/app';

interface SystemInfoCardProps {
  systemInfo: SystemInfo | null;
}

export function SystemInfoCard({ systemInfo }: SystemInfoCardProps) {
  return (
    <Paper elevation={2} sx={{ p: 1.5, flex: 1, minWidth: 0, maxWidth: '100%' }}>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        系统信息
      </Typography>
      {systemInfo ? (
        <Box display="flex" flexDirection="column" gap={0.5} sx={{ maxHeight: 150, overflow: 'hidden' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              CPU:
            </Typography>
            <Typography variant="caption" noWrap sx={{ maxWidth: '65%' }} title={systemInfo.cpu_model}>
              {systemInfo.cpu_model}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              核心:
            </Typography>
            <Typography variant="caption">
              {systemInfo.cpu_cores}物理 / {systemInfo.cpu_logical_cores}逻辑
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              系统:
            </Typography>
            <Typography variant="caption">
              {systemInfo.os_name} {systemInfo.os_version.split('.')[0]}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              内存:
            </Typography>
            <Typography variant="caption">{systemInfo.total_memory_gb.toFixed(1)} GB</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              权限:
            </Typography>
            <Typography variant="caption">管理员</Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          加载中...
        </Typography>
      )}
    </Paper>
  );
}
