import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { AppVersion } from '../../services/api';
import { APP_VERSION } from '../../constants';

interface UpdateDialogProps {
  open: boolean;
  hasUpdate: boolean;
  latestVersion: AppVersion | null;
  onClose: () => void;
  onDownload: () => void | Promise<void>;
}

export function UpdateDialog({
  open,
  hasUpdate,
  latestVersion,
  onClose,
  onDownload,
}: UpdateDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{hasUpdate ? '发现新版本' : '版本检查'}</Typography>
          <Button onClick={onClose} size="small">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {hasUpdate && latestVersion ? (
          <Box>
            <Alert severity={latestVersion.is_critical ? 'error' : 'info'} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                版本 {latestVersion.version}
                {latestVersion.is_critical && ' (重要更新)'}
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              更新内容:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
              {latestVersion.changelog}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              发布时间: {new Date(latestVersion.created_at).toLocaleDateString('zh-CN')}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                已是最新版本
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              当前版本: v{APP_VERSION}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{hasUpdate ? '稍后更新' : '关闭'}</Button>
        {hasUpdate && latestVersion && (
          <Button variant="contained" onClick={onDownload} color="primary">
            立即下载
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
