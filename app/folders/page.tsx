'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/supabaseClient';

const categorize = (url: string): string => {
  const lowerUrl = url.toLowerCase();
  const rules: Record<string, string[]> = {
    social: ["facebook", "instagram", "x.com", "twitter", "tiktok", "linkedin", "reddit", "discord", "youtube", "whatsapp", "telegram"],
    blog: ["medium", "wordpress", "substack", "tumblr", "ghost", "dev.to"],
    learn: ["wikipedia", "coursera", "udemy", "khanacademy", "edx", "codecademy", "brilliant"],
    code: ["github", "gitlab", "stackoverflow", "codepen", "leetcode", "replit", "codesandbox"],
    design: ["dribbble", "behance", "figma", "canva", "adobe", "freepik"],
    others:[""]
  };
  for (const category in rules) {
    if (rules[category].some(keyword => lowerUrl.includes(keyword))) return category;
  }
  return "others";
};

const categories = [
  { key: 'social', label: 'Social', icon: 'bi-people' },
  { key: 'blog', label: 'Blog', icon: 'bi-journal-text' },
  { key: 'learn', label: 'Learn', icon: 'bi-book' },
  { key: 'code', label: 'Code', icon: 'bi-code-slash' },
  { key: 'design', label: 'Design', icon: 'bi-palette' },
  { key: 'others', label: 'Others', icon: 'bi-grid' },
];

export default function BookmarkFoldersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [newUrl, setNewUrl] = useState('');

  const THEME_COLOR = '#3b82f6';

  const fetchBookmarks = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) {
      setBookmarks(data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace('/login');
        return;
      }

      const currentUser = data.session.user;
      setUser(currentUser);

      await fetchBookmarks(currentUser.id);

      channel = supabase
        .channel(`realtime-bookmarks-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${currentUser.id}`,
          },
          (payload) => {
            setBookmarks((prev) => {
              switch (payload.eventType) {
                case 'INSERT':
                  if (prev.find((b) => b.id === payload.new.id)) return prev;
                  return [...prev, payload.new];

                case 'UPDATE':
                  return prev.map((b) =>
                    b.id === payload.new.id ? payload.new : b
                  );

                case 'DELETE':
                  return prev.filter((b) => b.id !== payload.old.id);

                default:
                  return prev;
              }
            });
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router, fetchBookmarks]);

  const handleAddBookmark = async () => {
    if (!newUrl || !user) return;

    let url = newUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    const category = categorize(url);

    let name = url
      .replace('https://', '')
      .replace('http://', '')
      .replace('www.', '')
      .split(/[/?#]/)[0];

    if (!name || name.trim() === "") {
      name = "New Link";
    }

    const { error } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      name,
      url,
      category,
    });

    if (!error) {
      setNewUrl('');
    } else {
      console.error(error.message);
    }
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  if (loading)
    return (
      <div
        style={{
          color: '#ffffff',
          padding: '50px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        SYNCING...
      </div>
    );

  return (
    <div style={{ height: '100vh', width: '100vw', overflowY: 'scroll', color: '#ffffff', padding: '40px 20px' }}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '250px' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            My Folders
          </h1>
        </header>

        <div style={{ display: 'flex', gap: '10px', background: '#111827', padding: '8px', borderRadius: '12px', border: '2px solid #374151', marginBottom: '50px' }}>
          <input
            type="text"
            placeholder="Enter URL..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', padding: '10px', fontSize: '1rem', fontWeight: '600' }}
          />
          <button
            onClick={handleAddBookmark}
            style={{ background: THEME_COLOR, color: '#ffffff', border: 'none', padding: '0 25px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            ADD
          </button>
        </div>

        {categories.map((cat) => {
          const filtered = bookmarks.filter((b) => b.category === cat.key);

          return (
            <div key={cat.key} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <i className={`bi ${cat.icon}`} style={{ color: THEME_COLOR }} />
                <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, fontWeight: 800 }}>
                  {cat.label}
                </h2>
                <div style={{ flex: 1, height: '1px', background: '#374151' }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {filtered.map((b) => {
                  const domain = new URL(b.url).hostname;
                  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                  return (
                    <div
                      key={b.id}
                      style={{ padding: '14px 18px', background: '#030712', borderRadius: '10px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f3f4f6', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700' }}
                      >
                        <img
                          src={favicon}
                          alt=""
                          style={{ width: '18px', height: '18px', borderRadius: '4px' }}
                        />
                        {b.name}
                      </a>
                      <i
                        className="bi bi-x-lg"
                        onClick={() => deleteBookmark(b.id)}
                        style={{ cursor: 'pointer', color: '#9ca3af' }}
                      />
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '20px', border: '2px dotted #4b5563', borderRadius: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', fontWeight: '700' }}>
                    Folder is empty
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: '100px', textAlign: 'center', paddingTop: '30px', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '6px' }}>
            END OF LIBRARY
          </div>
        </div>
      </div>
    </div>
  );
}
