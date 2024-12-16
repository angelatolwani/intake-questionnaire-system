'use client';

import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Button
      variant="outlined"
      color="inherit"
      onClick={handleLogout}
      startIcon={<LogoutIcon />}
    >
      Logout
    </Button>
  );
}
