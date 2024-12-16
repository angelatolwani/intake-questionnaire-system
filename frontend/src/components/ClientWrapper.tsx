'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import Navigation from './Navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
