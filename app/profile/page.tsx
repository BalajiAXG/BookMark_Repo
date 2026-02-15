'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useTheme } from '../layout';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);

  const textColor = isDark ? '#ffffff' : '#000000';
  const glassBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

  useEffect(() => {
    let channel: any;

    const fetchUserAndStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);

      // Initial count fetch
      const fetchCount = async () => {
        const { count } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        setTotalBookmarks(count || 0);
      };

      await fetchCount();
      setLoading(false);

      // REALTIME SUBSCRIPTION
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*', 
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchCount();
          }
        )
        .subscribe();
    };

    fetchUserAndStats();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Helper to format the last sign in time
  const formatLastSeen = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' ,year: 'numeric'});
  };

  if (loading) return null;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: textColor,
      position: 'relative',
      fontFamily: 'sans-serif',
      padding: '20px',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        zIndex: -1
      }} />

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <div style={{
        background: glassBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${glassBorder}`,
        borderRadius: '24px',
        padding: '40px 30px',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <img 
            src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
            alt="Profile"
            style={{ 
              width: '85px', 
              height: '85px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'}`,
              padding: '3px'
            }}
          />
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 5px 0' }}>
          {user?.user_metadata?.full_name || 'Account User'}
        </h1>
        <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '25px' }}>
          {user?.email}
        </p>

        <div style={{ 
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
            padding: '15px', 
            borderRadius: '16px', 
            marginBottom: '25px',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalBookmarks}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Total Bookmarks</div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Last Session</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{formatLastSeen(user?.last_sign_in_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Environment</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Sync Status</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#3b82f6' }}>Live</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Security</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#22c55e' }}>Encrypted</span>
            </div>
        </div>

        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: '#ef4444',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <i className="bi bi-box-arrow-right"></i> Sign Out
        </button>
      </div>

      <div style={{ marginTop: '30px', fontSize: '0.65rem', fontWeight: 600, opacity: 0.2, letterSpacing: '4px', textTransform: 'uppercase' }}>
        Bookmark Identity
      </div>
    </div>
  );
}