/**
 * Content Library / Keepsakes Page
 *
 * Visual design mirrors loveable DashboardLibraryPage exactly; data from DB.
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';
import { toast } from 'sonner';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useContentItems,
  useToggleFavorite,
  useDeleteContent,
  type ContentFilters,
  type ContentType,
} from '@/hooks/queries/useContentLibrary';
import { LoadingSpinner } from '@/components/shared';
import { getUploadUrl } from '@/integrations/api/client';
import { getInitials } from '@/lib/utils';
import {
  ChevronDown,
  Search,
  Download,
  BookOpen,
  Heart,
  Play,
  Printer,
  MoreHorizontal,
  Mic,
  Map,
  CheckCircle2,
} from 'lucide-react';

type Tab = 'all' | 'story' | 'journey' | 'voice';

const CHILD_BGS = ['#E8F6F4', '#F3EFF8', '#FEF0EA', '#FDF6E8'];

function borderColor(type: string) {
  if (type === 'story') return '#B8A5D4';
  if (type === 'journey') return '#E8946A';
  return '#D4A843';
}

export function ContentLibraryPage() {
  const { user } = useAuth();
  const { data: children = [] } = useChildProfiles(user?.id);
  const [childFilter, setChildFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const filters: ContentFilters = {
    childId: childFilter !== 'all' ? childFilter : undefined,
    type: activeTab !== 'all' ? (activeTab as ContentType) : undefined,
    limit: 200,
  };

  const { data: contentData, isLoading } = useContentItems(filters);
  const toggleFavorite = useToggleFavorite();
  const deleteContent = useDeleteContent();
  const [isExporting, setIsExporting] = useState(false);

  const escapeHtml = (s: string) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const shortTheme = (theme: string | null | undefined): string => {
    if (!theme) return '';
    const cleaned = String(theme).replace(/[!?.,]/g, '').trim();
    const words = cleaned.split(/\s+/);
    const STOP = new Set(['a', 'an', 'the', 'some', 'something', 'surprise', 'me']);
    const pick = words.find((w) => !STOP.has(w.toLowerCase())) || words[0] || '';
    return pick.replace(/-.*$/, '');
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/data-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `yoluno-data-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintStory = async (item: { id: string; title: string; content: string; metadata?: any }) => {
    try {
      // Try to fetch pages (storybook format has illustrations per page)
      let pagesHtml = '';
      try {
        const pagesRes = await apiClient.get<{ pages: Array<{ page_number: number; content: string; illustration_url: string | null }> }>(
          `/generate-story/${item.id}/pages`
        );
        const pages = pagesRes.data?.pages ?? [];
        if (pages.length > 0) {
          pagesHtml = pages.map((p) => {
            const imgUrl = getUploadUrl(p.illustration_url);
            return `
            <section class="page">
              ${imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="Page ${p.page_number}" class="illustration" crossorigin="anonymous"/>` : ''}
              <p class="page-text">${escapeHtml(p.content)}</p>
              <p class="page-num">— ${p.page_number} —</p>
            </section>`;
          }).join('');
        }
      } catch {
        // Fall through to plain content below
      }

      const coverUrl = getUploadUrl(item.metadata?.cover_image_url || item.metadata?.illustration_url);

      // Fallback: just render the full content text
      if (!pagesHtml) {
        const paragraphs = (item.content || '').split(/\n\n+/).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
        pagesHtml = `<section class="page"><div class="page-text">${paragraphs}</div></section>`;
      }

      const theme = item.metadata?.theme ? String(item.metadata.theme) : '';
      const createdAt = item.metadata?.created_at ? new Date(item.metadata.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(item.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif; color: #2A2926; background: #FAFAF7; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.7; }
  .cover { text-align: center; padding: 60px 20px; margin-bottom: 30px; page-break-after: always; }
  .cover-img { width: 100%; max-width: 520px; max-height: 520px; object-fit: contain; border-radius: 16px; margin-bottom: 28px; }
  h1 { font-family: 'DM Serif Display', Georgia, serif; font-size: 36px; color: #2A2926; margin: 0 0 16px; line-height: 1.2; }
  .subtitle { font-size: 15px; color: #9B978E; margin: 0 0 8px; }
  .theme-pill { display: inline-block; background: #F3EFF8; color: #B8A5D4; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-top: 12px; }
  .page { padding: 24px 0; margin-bottom: 20px; page-break-inside: avoid; }
  .illustration { width: 100%; max-height: 400px; object-fit: contain; border-radius: 12px; margin-bottom: 20px; }
  .page-text { font-size: 18px; color: #2A2926; margin: 0 0 12px; }
  .page-text p { margin: 0 0 12px; }
  .page-num { text-align: center; font-size: 12px; color: #9B978E; margin-top: 16px; }
  footer { text-align: center; font-size: 12px; color: #9B978E; padding: 24px 0; border-top: 1px solid #E8E6E1; margin-top: 40px; }
  @media print {
    body { background: #FFFFFF; padding: 20px; }
    .page { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="cover">
    ${coverUrl ? `<img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(item.title)}" class="cover-img" crossorigin="anonymous"/>` : ''}
    <h1>${escapeHtml(item.title)}</h1>
    ${createdAt ? `<p class="subtitle">Created ${escapeHtml(createdAt)}</p>` : ''}
    ${theme ? `<span class="theme-pill">${escapeHtml(theme)}</span>` : ''}
  </div>
  ${pagesHtml}
  <footer>Printed from Yoluno — a safe world for kids</footer>
  <script>
    (function() {
      var imgs = Array.prototype.slice.call(document.images);
      if (imgs.length === 0) { window.print(); return; }
      var remaining = imgs.length;
      var done = function() {
        remaining -= 1;
        if (remaining <= 0) setTimeout(function(){ window.print(); }, 200);
      };
      imgs.forEach(function(img) {
        if (img.complete) { done(); return; }
        img.addEventListener('load', done);
        img.addEventListener('error', done);
      });
      setTimeout(function(){ if (remaining > 0) window.print(); }, 8000);
    })();
  </script>
</body>
</html>`;

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        toast.error('Please allow pop-ups to print');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } catch {
      toast.error('Could not prepare story for printing');
    }
  };

  // All items for tab counts (ignore type filter)
  const { data: allForCounts } = useContentItems({
    childId: filters.childId,
    limit: 500,
  });

  const countsByType = useMemo(() => {
    const items = allForCounts?.items ?? [];
    return {
      all: items.length,
      story: items.filter((i) => i.content_type === 'story').length,
      journey: items.filter((i) => i.content_type === 'journey').length,
      voice: items.filter((i) => i.content_type === 'voice').length,
    };
  }, [allForCounts]);

  // Child lookup
  const childMap = useMemo(() => {
    const map: Record<string, { name: string; initial: string; bg: string; avatarUrl?: string }> = {};
    children.forEach((c, i) => {
      map[c.id] = {
        name: c.name,
        initial: getInitials(c.name),
        bg: CHILD_BGS[i % CHILD_BGS.length],
        avatarUrl: getUploadUrl(c.avatarUrl || c.custom_avatar_url) || undefined,
      };
    });
    return map;
  }, [children]);

  // Search filter + sort: stories first, then journeys, then voice
  const TYPE_ORDER: Record<string, number> = { story: 0, journey: 1, voice: 2 };
  const lc = search.toLowerCase();
  const filtered = (contentData?.items ?? [])
    .filter((item) => {
      if (lc && !item.title.toLowerCase().includes(lc) && !item.content?.toLowerCase().includes(lc)) return false;
      return true;
    })
    .sort((a, b) => (TYPE_ORDER[a.content_type] ?? 3) - (TYPE_ORDER[b.content_type] ?? 3));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: countsByType.all },
    { key: 'story', label: 'Stories', count: countsByType.story },
    { key: 'journey', label: 'Journeys', count: countsByType.journey },
    { key: 'voice', label: 'Voice Recordings', count: countsByType.voice },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Family Keepsakes
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Your family's favorite stories, completed journeys, and saved voice
            recordings — all in one place, ready to print or export.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <select
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-lg text-[14px] border cursor-pointer"
              style={{ background: '#FFFFFF', borderColor: '#E8E6E1', color: '#2A2926', fontWeight: 500 }}
            >
              <option value="all">All children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9B978E' }} />
          </div>
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] transition hover:bg-[#E8F6F4]"
            style={{ fontWeight: 600, color: '#3ECDC6', border: '1px solid #3ECDC6' }}
          >
            <Download size={14} /> {isExporting ? 'Exporting...' : 'Export All'}
          </button>
        </div>
      </div>

      {/* Info banner (when empty and no search) */}
      {filtered.length === 0 && !search && !isLoading && (
        <div className="mb-6 px-5 py-4 rounded-xl" style={{ background: '#E8F6F4', borderLeft: '3px solid #3ECDC6' }}>
          <p className="text-[14px]" style={{ color: '#2A2926' }}>
            Favorite a story, complete a journey, or save a voice recording — and it
            will appear here as a keepsake. You can print stories, export recordings,
            and keep everything your family creates.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-4 overflow-x-auto w-fit" style={{ background: '#F5F3EE' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] whitespace-nowrap transition"
            style={{
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? '#2A2926' : '#6B675E',
              background: activeTab === t.key ? '#FFFFFF' : 'transparent',
              boxShadow: activeTab === t.key ? '0 1px 3px rgba(42,41,38,0.08)' : 'none',
            }}
          >
            {t.label}
            <span
              className="text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: activeTab === t.key ? '#F5F3EE' : 'transparent', color: '#9B978E' }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9B978E' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keepsakes..."
          className="w-full pl-11 pr-4 py-3 rounded-xl text-[15px] border outline-none transition focus:border-[#3ECDC6]"
          style={{ background: '#FFFFFF', borderColor: '#E8E6E1', color: '#2A2926' }}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={40} className="mx-auto mb-4 opacity-30" style={{ color: '#D4A843' }} />
          <h2 className="text-[24px] mb-2" style={{ fontWeight: 600, color: '#2A2926' }}>
            Your keepsake collection is waiting
          </h2>
          <p className="text-[16px] max-w-md mx-auto" style={{ color: '#6B675E' }}>
            When your child finishes a story, completes a journey, or when you save a
            voice recording — it appears here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const child = childMap[item.child_profile_id || ''];
            const bc = borderColor(item.content_type);
            const dateLabel = new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });

            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', borderLeft: `4px solid ${bc}` }}
              >
                {/* Story card */}
                {item.content_type === 'story' && (
                  <>
                    <div
                      className="flex items-center justify-center overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #F3EFF8, #E8E6F0)', aspectRatio: '1 / 1' }}
                    >
                      {item.metadata?.illustration_url ? (
                        <img
                          src={getUploadUrl(String(item.metadata.illustration_url)) || ''}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen size={24} style={{ color: '#B8A5D4', opacity: 0.5 }} />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {child?.avatarUrl ? (
                            <img src={child.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" style={{ background: child.bg }} />
                          ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ background: child?.bg || '#F5F3EE', fontWeight: 600, color: '#2A2926' }}>
                              {child?.initial || '?'}
                            </div>
                          )}
                          <span className="text-[12px]" style={{ color: '#9B978E' }}>
                            {item.child_name || child?.name || 'Child'} · with Lumi
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleFavorite.mutate(item.id)} className="p-1 hover:scale-110 transition">
                            <Heart size={14} fill={item.is_favorite ? '#D4A843' : 'none'} style={{ color: '#D4A843' }} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-[16px] mb-1 line-clamp-2" style={{ fontWeight: 600, color: '#2A2926' }}>{item.title}</h3>
                      <p className="text-[13px] mb-3 line-clamp-2" style={{ color: '#6B675E', lineHeight: 1.5 }}>{item.content}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-[12px]" style={{ color: '#9B978E' }}>
                        {item.metadata?.theme && (
                          <span className="px-2.5 py-0.5 rounded-full capitalize" style={{ background: '#F3EFF8', color: '#B8A5D4', fontWeight: 500 }}>
                            {shortTheme(String(item.metadata.theme))}
                          </span>
                        )}
                        {typeof item.metadata?.word_count === 'number' && <span>{item.metadata.word_count} words</span>}
                        <span>·</span>
                        <span>{dateLabel}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-full text-[12px] hover:bg-[#F5F3EE] transition" style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}>Read</button>
                        <button
                          onClick={() => handlePrintStory(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] hover:bg-[#F5F3EE] transition"
                          style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}
                        >
                          <Printer size={11} /> Print
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Journey card */}
                {item.content_type === 'journey' && (
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px]" style={{ background: '#E8F6F4', color: '#3ECDC6', fontWeight: 600 }}>
                        <CheckCircle2 size={11} /> {item.metadata?.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                      <button onClick={() => toggleFavorite.mutate(item.id)} className="p-1 hover:scale-110 transition">
                        <Heart size={14} fill={item.is_favorite ? '#D4A843' : 'none'} style={{ color: '#D4A843' }} />
                      </button>
                    </div>
                    <h3 className="text-[16px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>{item.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {child?.avatarUrl ? (
                        <img src={child.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" style={{ background: child.bg }} />
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ background: child?.bg || '#F5F3EE', fontWeight: 600, color: '#2A2926' }}>
                          {child?.initial || '?'}
                        </div>
                      )}
                      <span className="text-[12px]" style={{ color: '#9B978E' }}>
                        {item.child_name || child?.name || 'Child'} · with Lolo
                      </span>
                    </div>
                    <p className="text-[13px] mb-2" style={{ color: '#6B675E' }}>
                      {dateLabel}
                      {typeof item.metadata?.step_count === 'number' && ` · ${item.metadata.step_count} steps`}
                    </p>
                    {item.content && (
                      <p className="text-[13px] italic mb-3" style={{ color: '#6B675E' }}>"{item.content}"</p>
                    )}
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-full text-[12px] hover:bg-[#F5F3EE] transition" style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}>View Reflections</button>
                    </div>
                  </div>
                )}

                {/* Voice card */}
                {item.content_type === 'voice' && (
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mic size={15} style={{ color: '#D4A843' }} />
                        <span className="text-[12px] uppercase tracking-wider" style={{ fontWeight: 600, color: '#D4A843' }}>
                          Voice Recording
                        </span>
                      </div>
                      <button onClick={() => toggleFavorite.mutate(item.id)} className="p-1 hover:scale-110 transition">
                        <Heart size={14} fill={item.is_favorite ? '#D4A843' : 'none'} style={{ color: '#D4A843' }} />
                      </button>
                    </div>
                    {/* Mini waveform */}
                    <div className="flex items-center gap-0.5 h-8 mb-3">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="flex-1 rounded-full" style={{ height: `${30 + ((item.id.charCodeAt(i % item.id.length) * 7 + i * 13) % 70)}%`, background: '#D4A843', opacity: 0.3 }} />
                      ))}
                    </div>
                    <h3 className="text-[16px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>{item.title}</h3>
                    <p className="text-[13px] mb-1" style={{ color: '#6B675E' }}>
                      {item.child_name || child?.name || 'Child'}
                      {item.metadata?.category && ` · ${String(item.metadata.category)}`}
                    </p>
                    <p className="text-[12px] mb-3" style={{ color: '#9B978E' }}>
                      {typeof item.metadata?.duration_seconds === 'number' &&
                        `${Math.floor(Number(item.metadata.duration_seconds) / 60)} min ${Number(item.metadata.duration_seconds) % 60} sec · `}
                      {dateLabel}
                    </p>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition hover:opacity-80" style={{ background: '#D4A843', color: '#FFFFFF', fontWeight: 600 }}>
                        <Play size={11} /> Play
                      </button>
                      <button className="px-3 py-1.5 rounded-full text-[12px] hover:bg-[#F5F3EE] transition" style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}>
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
