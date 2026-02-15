'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useRouter } from 'next/navigation';
import { useTheme } from '../layout';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  const textColor = isDark ? '#ffffff' : '#000000';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
  const buttonBg = isDark ? '#ffffff' : '#000000';
  const buttonText = isDark ? '#000000' : '#ffffff';

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/home');
    };
    checkUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) console.error(error.message);
  };

  if (!mounted) return null;

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'Poppins, sans-serif',
      overflow: 'hidden',
      position: 'relative',
      transition: 'color 0.5s ease'
    }}>
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '90%',
        maxWidth: '400px',
        padding: '50px 40px',
        background: cardBg,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '35px',
        border: `1px solid ${cardBorder}`,
        boxShadow: isDark ? '0 25px 50px rgba(0, 0, 0, 0.6)' : '0 25px 50px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        color: textColor,
        transition: 'all 0.5s ease'
      }}>
        
        <div style={{
          width: '75px',
          height: '75px',
          background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px',
          fontSize: '2.2rem',
          border: `1px solid ${cardBorder}`,
          transition: 'all 0.5s ease'
        }}>
          <i className="fas fa-fingerprint"></i>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '10px', letterSpacing: '-0.5px' }}>
          Welcome
        </h1>
        <p style={{ opacity: 0.6, fontSize: '0.95rem', marginBottom: '40px' }}>
          Sign in to your bookmarks
        </p>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: buttonBg,
            color: buttonText,
            border: 'none',
            borderRadius: '18px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
          }}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google icon" 
            width="20" 
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}