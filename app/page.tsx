'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/supabaseClient';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/home'); 
      } else {
        router.replace('/login'); 
      }
    };
    checkSession();
  }, [router]);

  return null;
}
