'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/supabaseClient';
import { Home, FolderOpen, User, LogOut, LucideIcon } from 'lucide-react';
import { useTheme } from '../layout';

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, onClick, isDanger }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '50px',
        height: '50px',
        borderRadius: '16px',
        background: isHovered 
          ? (isDanger ? 'rgba(255, 60, 60, 0.2)' : 'rgba(255, 255, 255, 0.12)') 
          : 'transparent',
        border: '1px solid',
        borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        color: isHovered ? (isDark ? '#fff' : '#000') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        position: 'relative',
        outline: 'none',
      }}
    >
      <Icon size={20} style={{ transform: isHovered ? 'translateY(-6px)' : 'translateY(0px)', transition: 'transform 0.3s ease' }} />
      <span style={{ fontSize: '8.5px', fontWeight: 100, position: 'absolute', bottom: '8px', opacity: isHovered ? 1 : 0, transition: 'all 0.3s ease' }}>
        {label}
      </span>
    </button>
  );
};

export default function Navbar() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <nav style={{
      position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000,
      background: isDark ? 'rgba(15, 15, 15, 0.75)' : 'rgba(255, 255, 255, 0.6)',
      padding: '10px', borderRadius: '24px', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    }}>
      <NavButton icon={Home} label="HOME" onClick={() => router.push('/home')} />
      <NavButton icon={FolderOpen} label="FOLDERS" onClick={() => router.push('/folders')} />
      <NavButton icon={User} label="PROFILE" onClick={() => router.push('/profile')} />
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 12px' }} />
      <NavButton icon={LogOut} label="EXIT" onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }} isDanger />
    </nav>
  );
}