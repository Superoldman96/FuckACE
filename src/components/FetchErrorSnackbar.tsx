import { Alert, Snackbar } from '@mui/material';

interface FetchErrorSnackbarProps {
  open: boolean;
}

export function FetchErrorSnackbar({ open }: FetchErrorSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="warning" variant="filled" sx={{ width: '100%' }}>
        无法获取更新，请检查网络/(ㄒoㄒ)/~~
      </Alert>
    </Snackbar>
  );
}
