import { useSnackbar } from 'notistack';
export const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();
  return {
    success: (m: string) => enqueueSnackbar(m, { variant: 'success' }),
    error: (m: string) => enqueueSnackbar(m, { variant: 'error' }),
  };
};
