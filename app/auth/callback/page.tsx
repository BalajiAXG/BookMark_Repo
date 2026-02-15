'use client';

import { useEffect } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.replace('/login');
        return;
      }

      router.replace('/dashboard');
    };
    handleAuth();
  }, [router]);

  return <p style={{ textAlign: 'center', marginTop: '100px' }}>Signing you in...</p>;
}
