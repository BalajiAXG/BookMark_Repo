'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useTheme } from '../layout';

interface Bookmark {
  id: string;
  name: string;
  url: string;
  category?: string;
}

const categorize = (url: string): string => {
  const lowerUrl = url.toLowerCase();
  const rules: Record<string, string[]> = {
    social: ["facebook", "instagram", "x.com", "twitter", "tiktok", "linkedin", "reddit", "discord", "youtube", "whatsapp", "telegram"],
    blog: ["medium", "wordpress", "substack", "tumblr", "ghost", "dev.to"],
    learn: ["wikipedia", "coursera", "udemy", "khanacademy", "edx", "codecademy", "brilliant"],
    code: ["github", "gitlab", "stackoverflow", "codepen", "leetcode", "replit", "codesandbox"],
    design: ["dribbble", "behance", "figma", "canva", "adobe", "freepik"],
    others: [""]
  };
  for (const category in rules) {
    if (rules[category].some(keyword => lowerUrl.includes(keyword))) return category;
  }
  return "others"; 
};

export default function DashboardPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const textColor = isDark ? '#ffffff' : '#000000';
  const glassBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.8)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  const fetchBookmarks = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setBookmarks(data as Bookmark[]);
  }, []);

  useEffect(() => {
    let channel: any;

    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const setupDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      await fetchBookmarks(currentUser.id);
      setLoading(false);

      channel = supabase
        .channel(`db_realtime_${currentUser.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*', 
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${currentUser.id}`,
          },
          () => {
            fetchBookmarks(currentUser.id);
          }
        )
        .subscribe();
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    setupDashboard();

    return () => {
      if (channel) supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, [router, fetchBookmarks]);

  const handleAddOrUpdate = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newName.trim() || !newUrl.trim() || !user) return;
    
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    const category = categorize(formattedUrl);

    if (editingId) {
      const { error } = await supabase
        .from('bookmarks')
        .update({ name: newName.trim(), url: formattedUrl, category: category })
        .eq('id', editingId);

      if (!error) {
        setEditingId(null);
        setNewName('');
        setNewUrl('');
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, name: newName.trim(), url: formattedUrl, category });
      
      if (!error) {
        setNewName('');
        setNewUrl('');
      }
    }
  };

  const deleteBookmark = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) fetchBookmarks(user.id);
  };

  const startEditing = (e: React.MouseEvent, b: Bookmark) => {
    e.preventDefault(); 
    e.stopPropagation();
    setEditingId(b.id);
    setNewName(b.name);
    setNewUrl(b.url);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric`
        );
        const data = await res.json();
        if (data.main) {
          setLocation(`${data.name}, ${data.sys.country}`);
          setTemperature(`${data.main.temp.toFixed(1)}°C`);
        }
      } catch (e) {
        console.error("Weather error:", e);
      }
    });
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.trim().toLowerCase();
      if (!query) return;
      const shortcuts: Record<string, string> = {
        'youtube': 'https://youtube.com',
        'google': 'https://google.com',
        'github': 'https://github.com',
      };
      if (shortcuts[query]) {
        window.open(shortcuts[query], '_blank');
      } else if (/^([\w\d-]+\.)+[\w-]+(\/.*)?$/i.test(query)) {
        const protocol = /^https?:\/\//i.test(query) ? '' : 'https://';
        window.open(`${protocol}${query}`, '_blank');
      } else {
        window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      }
      setSearchInput('');
    }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', color: textColor, position: 'relative', paddingBottom: '30px' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <style jsx global>{`
        .bookmark-wrapper { position: relative; display: flex; flex-direction: column; align-items: center; width: 90px; padding-top: 15px; }
        .bookmark-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${glassBg}; backdrop-filter: blur(8px); border: 1px solid ${glassBorder}; cursor: pointer; transition: 0.2s ease; z-index: 2; }
        .bookmark-circle:hover { transform: scale(1.05); border-color: ${textColor}; }
        .action-tray { position: absolute; top: -2px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; opacity: 0; transition: 0.2s ease-in-out; z-index: 10; pointer-events: none; }
        .bookmark-wrapper:hover .action-tray { opacity: 1; pointer-events: auto; }
        .icon-btn { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 9px; cursor: pointer; background: ${isDark ? '#111' : '#fff'}; color: ${textColor}; border: 1px solid ${glassBorder}; outline: none; }
        .name-label { font-size: 11px; margin-top: 8px; color: ${textColor}; font-weight: 400; text-align: center; opacity: 0.8; }
        input { color: ${textColor} !important; font-weight: 600 !important; outline: none !important; }
        input::placeholder { color: ${placeholderColor} !important; font-weight: 500; }
      `}</style>

      {/* Header Info */}
      <div style={{ position: 'absolute', top: 35, left: 30, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{temperature || '0.0°C'}</span> 
        <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.8 }}>{location || 'Loading...'}</span>
      </div>

      <div style={{ position: 'absolute', top: '2rem', right: 95, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <img 
          src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=random`} 
          alt="Profile" 
          style={{ width: '42px', height: '42px', borderRadius: '50%', border: `1px solid ${glassBorder}`, objectFit: 'cover' }} 
        />
        <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.8 }}>
          {user?.user_metadata?.full_name?.toUpperCase() || 'USER'}
        </span>
      </div>

      <div style={{ marginTop: '10vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* Realtime Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '35px' }}>
          {bookmarks.map(b => (
            <div key={b.id} className="bookmark-wrapper">
              <div className="action-tray">
                <button type="button" className="icon-btn" onClick={(e) => startEditing(e, b)} style={{ background: '#3b82f6', color: 'white', border: 'none' }}>
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button type="button" className="icon-btn" onClick={(e) => deleteBookmark(e, b.id)} style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
              <div className="bookmark-circle" onClick={(e) => { e.preventDefault(); window.open(b.url, '_blank'); }}>
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${b.url}&sz=64`} 
                  width={28} 
                  height={28} 
                  alt="favicon" 
                />
              </div>
              <span className="name-label">{b.name}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '10vw', fontWeight: 200, letterSpacing: '-4px', lineHeight: 1 }}>{time}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.3, letterSpacing: '10px', textTransform: 'uppercase', marginBottom: '40px' }}>BOOKMARK</div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', background: glassBg, borderRadius: '25px', padding: '10px 20px', width: '90%', maxWidth: '400px', border: `1px solid ${glassBorder}`, marginBottom: '65px' , marginTop: '15px' }}>
          <i className="bi bi-search" style={{ color: textColor, fontSize: '1rem', marginRight: '12px', opacity: 0.7 }} />
          <input type="text" placeholder="Search..." value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearch} style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '1rem' }} />
        </div>

        {/* Action Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleAddOrUpdate(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: glassBg, padding: '10px', borderRadius: '25px', border: editingId ? '2px solid #3b82f6' : `1px solid ${glassBorder}`, width: '90%', maxWidth: '500px' }}>
          <input type="text" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: '1 1 100px', background: 'transparent', border: 'none', padding: '6px' }} />
          <input type="text" placeholder="URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} style={{ flex: '2 1 150px', background: 'transparent', border: 'none', padding: '6px' }} />
          <button 
            type="submit" 
            style={{ padding: '6px 15px', borderRadius: '10px', background: textColor, color: isDark ? '#000' : '#fff', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {editingId ? 'SAVE' : 'ADD'}
          </button>
          
          {editingId && (
            <button type="button" onClick={(e) => { e.preventDefault(); setEditingId(null); setNewName(''); setNewUrl(''); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}