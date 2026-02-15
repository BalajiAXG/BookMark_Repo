'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useRouter } from 'next/navigation';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);


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

 
  useEffect(() => {
    if (!mounted) return;
    const playVideo = async () => {
      const activeIdx = isDark ? 0 : 1;
      const inactiveIdx = isDark ? 1 : 0;
      const activeVideo = videosRef.current[activeIdx];
      const inactiveVideo = videosRef.current[inactiveIdx];
      
      if (inactiveVideo) {
        inactiveVideo.pause();
        inactiveVideo.currentTime = 0;
      }
      if (activeVideo) {
        activeVideo.muted = true;
        activeVideo.currentTime = 0;
        try {
          await activeVideo.play();
        } catch (err) {
          console.log("Autoplay waiting for interaction");
        }
      }
    };
    playVideo();
  }, [isDark, mounted]);

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
      background: '#000', 
      fontFamily: 'Poppins, sans-serif',
      overflow: 'hidden',
      position: 'relative',
      transition: 'color 0.5s ease'
    }}>
      
      
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
        {['/videos/1.mp4', '/videos/2.mp4'].map((src, idx) => (
          <video
            key={idx}
            ref={el => { videosRef.current[idx] = el; }}
            src={src}
            muted
            playsInline
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.7) blur(10px)',
              opacity: isDark ? (idx === 0 ? 1 : 0) : (idx === 1 ? 1 : 0),
              transition: 'opacity 1s ease-in-out',
            }}
          />
        ))}
      </div>

    
      <i
        className={`bi ${isDark ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}
        onClick={() => setIsDark(!isDark)}
        style={{ 
          position: 'absolute', 
          top: 40, 
          right: 40, 
          cursor: 'pointer', 
          fontSize: 30, 
          color: textColor,
          zIndex: 2,
          transition: 'all 0.5s ease' 
        }}
      />

      
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

        <div style={{ marginTop: '40px', fontSize: '0.75rem', opacity: 0.4, letterSpacing: '1px', textTransform: 'uppercase' }}>
        </div>
      </div>
    </div>
  );
}