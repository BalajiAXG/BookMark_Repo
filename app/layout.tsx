'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';

// Theme Context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType>({ isDark: true, toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === '/login';

  const [isDark, setIsDark] = useState(true);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);

  const toggleTheme = () => setIsDark(!isDark);

  // Video play logic
  useEffect(() => {
    videosRef.current.forEach((vid, idx) => {
      if (vid) {
        const isTargetVideo = isDark ? idx === 0 : idx === 1;

        if (isTargetVideo) {
          vid.currentTime = 0;
          vid.style.opacity = '1';
          vid.style.zIndex = '1';
          vid.play().catch((err) => console.log('Video play pending interaction:', err));
        } else {
          vid.style.opacity = '0';
          vid.style.zIndex = '0';
          vid.pause();
        }
      }
    });
  }, [isDark]);

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          background: 'black',
          overflow: 'hidden',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
          {/* Background Videos */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
            }}
          >
            {['/videos/1.mp4', '/videos/2.mp4'].map((src, idx) => (
              <video
                key={idx}
                ref={(el) => {
                  videosRef.current[idx] = el;
                }}
                src={src}
                muted
                playsInline
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.7) blur(10px)',
                  transition: 'opacity 0s ease-in-out',
                  opacity: 0,
                  zIndex: 0,
                }}
              />
            ))}
          </div>

          {/* Global Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              position: 'fixed',
              top: '30px',
              right: '30px',
              zIndex: 9999,
              cursor: 'pointer',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
              color: isDark ? '#fff' : '#000',
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none',
            }}
          >
            <i className={`bi ${isDark ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`} style={{ fontSize: 22 }} />
          </button>

          {/* Page Content */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {!hideNavbar && <Navbar />}
            {children}
          </div>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
