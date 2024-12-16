'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect based on user role
    if (user.is_admin) {
      router.push('/admin');
    } else {
      router.push('/questionnaires');
    }
  }, [user, router]);

  return <div>Redirecting...</div>;
}
