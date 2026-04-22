/**
 * Kids Chat Page
 *
 * Child-facing AI chat with Luno. Redesigned to match loveable KidsChatPage.
 * Sidebar with past sessions, mood-aware greeting, quick actions,
 * bubble-style messages, thinking dots, rounded input bar.
 *
 * All existing backend hooks preserved (sessions, messages, send,
 * mood-aware greeting, real-time socket updates, markdown rendering).
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChild } from '@/contexts/ChildContext';
import { useChildProfile } from '@/hooks/queries';
import { queryKeys } from '@/hooks/queries/keys';
import {
  useChatSessions,
  useCreateChatSession,
  useSessionMessages,
  useSendSessionMessage,
  useUpdateChatSession,
  useDeleteChatSession,
} from '@/hooks/queries/useBuddyChat';
import { greetSession } from '@/services/buddyChat';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getSocket, joinChildRoom, leaveChildRoom, onNewMessage } from '@/integrations/api/socket';
import { LoadingState, ErrorState } from '@/components/shared';
import lunoHero from '@/assets/landing/luno-hero.png';
import type { ChatSession, BuddyMessage } from '@/services/buddyChat';

const QUICK_ACTIONS = [
  { icon: '🧠', label: 'Teach me something' },
  { icon: '❓', label: 'I have a question' },
  { icon: '🎮', label: 'Play a quiz' },
  { icon: '🌍', label: 'Explore a topic' },
];

const MOOD_GREETINGS: Record<string, string> = {
  tired: "Take your time — I'm here whenever you're ready.",
  sad: "I'm glad you're here. What's on your mind?",
  happy: 'What are you curious about today?',
  excited: "I can tell today's going to be great. What shall we explore?",
  angry: "I'm here. What's on your mind?",
  worried: "I'm here. No rush — what's on your mind?",
  calm: 'What would you like to explore?',
  notsure: 'What would you like to explore?',
};

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function KidsChatPage() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enterKidsMode, exitKidsMode } = useChild();
  const { data: child, isLoading, isError } = useChildProfile(childId);
  const { data: sessions = [] } = useChatSessions(childId);
  const createSession = useCreateChatSession();
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    searchParams.get('session') || undefined
  );
  const [input, setInput] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const updateSession = useUpdateChatSession();
  const deleteSession = useDeleteChatSession();

  const moodParam = searchParams.get('mood');
  const mood = moodParam || 'happy';
  const greetingLine = MOOD_GREETINGS[mood] || MOOD_GREETINGS.happy;

  const { data: messages = [], isLoading: messagesLoading } = useSessionMessages(
    currentSessionId ? childId : undefined,
    currentSessionId
  );
  const { mutate: sendSessionMsg, isPending: isSending } = useSendSessionMessage();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activateSession = useCallback(
    (sessionId: string, closeSidebar = false) => {
      setCurrentSessionId(sessionId);
      setSearchParams({ session: sessionId }, { replace: true });
      if (closeSidebar && isMobile) setSidebarOpen(false);
    },
    [setSearchParams, isMobile]
  );

  // Create a session on first load
  useEffect(() => {
    if (!childId || isLoading) return;

    if (moodParam && !currentSessionId) {
      createSession.mutate(
        { childId, input: { mood: moodParam } },
        {
          onSuccess: (s) => {
            activateSession(s.id);
            greetSession(childId, s.id)
              .then(() => {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.buddyChat.sessionMessages(childId, s.id),
                });
              })
              .catch(() => {});
          },
        }
      );
    } else if (!currentSessionId && !moodParam && !createSession.isPending) {
      // Clicking the chatbot always lands in a fresh chat. If an empty session
      // already exists, reuse it instead of creating duplicates.
      const emptySession = sessions.find((s) => s.message_count === 0);
      if (emptySession) {
        activateSession(emptySession.id);
      } else {
        createSession.mutate({ childId }, { onSuccess: (s) => activateSession(s.id) });
      }
    }
  }, [childId, sessions, currentSessionId, moodParam, isLoading]);

  // Enter kids mode
  useEffect(() => {
    if (child && childId) {
      enterKidsMode(child);
    }
    return () => {
      exitKidsMode();
    };
  }, [child, childId, enterKidsMode, exitKidsMode]);

  // Real-time socket updates
  useEffect(() => {
    if (!childId) return;
    const socket = getSocket();
    if (!socket) return;

    joinChildRoom(childId);
    const unsubscribe = onNewMessage(() => {
      if (currentSessionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.buddyChat.sessionMessages(childId, currentSessionId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.buddyChat.sessions(childId),
        });
      }
    });

    return () => {
      leaveChildRoom(childId);
      unsubscribe();
    };
  }, [childId, currentSessionId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length, isSending]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || !childId || !currentSessionId) return;
      sendSessionMsg({ childId, sessionId: currentSessionId, message: text.trim() });
      setInput('');
    },
    [childId, currentSessionId, sendSessionMsg]
  );

  const handleQuickAction = useCallback(
    (action: { icon: string; label: string }) => {
      if (!childId || !currentSessionId) return;

      // "Explore a topic" — backend handles the topic picking so the child's
      // bubble shows a clean label instead of a long prompt.
      if (action.label === 'Explore a topic') {
        handleSend('Explore a topic');
        return;
      }

      // Default: send the action label as-is
      handleSend(action.label);
    },
    [childId, currentSessionId, handleSend]
  );

  const handleNewSession = useCallback(() => {
    if (!childId) return;
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    if (currentSession && currentSession.message_count === 0) return;
    createSession.mutate(
      { childId },
      { onSuccess: (s) => activateSession(s.id, true) }
    );
  }, [childId, createSession, activateSession, sessions, currentSessionId]);

  const handleBack = () => navigate(`/kids/${childId}`);

  const isNewChat = messages.length === 0;

  // Last non-active session for "asking about X last time" hint
  const previousSession = useMemo(
    () =>
      sessions.find(
        (s) => s.id !== currentSessionId && s.message_count > 0 && s.title
      ),
    [sessions, currentSessionId]
  );

  if (isLoading) return <LoadingState message="Loading..." fullPage />;
  if (isError || !child) {
    return (
      <ErrorState
        title="Child not found"
        message="The child profile could not be loaded."
        onRetry={handleBack}
        retryLabel="Back to Dashboard"
        fullPage
      />
    );
  }

  const renderSidebarContent = (inMobileOverlay: boolean) => (
    <>
      <div className="p-4">
        <button
          onClick={() => {
            if (inMobileOverlay) setSidebarOpen(false);
            handleBack();
          }}
          className="w-full flex items-center justify-center gap-2 mb-3 py-2 rounded-xl text-white font-semibold"
          style={{ background: '#3ECDC6', fontSize: 14 }}
        >
          ← Back to Home
        </button>
        <button
          onClick={() => {
            if (inMobileOverlay) setSidebarOpen(false);
            handleNewSession();
          }}
          disabled={createSession.isPending}
          className="w-full py-3 rounded-xl text-white font-semibold transition-opacity disabled:opacity-60"
          style={{ background: '#3ECDC6', fontSize: 14 }}
        >
          ✨ {createSession.isPending ? 'Creating...' : 'New Chat'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 && (
          <p className="text-center py-6" style={{ fontSize: 13, color: '#9B978E' }}>
            No chats yet — start one!
          </p>
        )}
        {sessions.map((session: ChatSession) => {
          const active = session.id === currentSessionId;
          const isRenaming = renamingId === session.id;
          const isMenuOpen = menuOpenId === session.id;

          return (
            <div
              key={session.id}
              className="relative rounded-lg mb-1 group"
              style={{
                borderLeft: active ? '3px solid #3ECDC6' : '3px solid transparent',
                background: active ? '#E8F6F4' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active && !isMenuOpen) (e.currentTarget as HTMLElement).style.background = '#E8F6F4';
              }}
              onMouseLeave={(e) => {
                if (!active && !isMenuOpen) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {isRenaming ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (renameValue.trim() && renameValue !== session.title) {
                      updateSession.mutate({
                        childId: childId!,
                        sessionId: session.id,
                        input: { title: renameValue.trim() },
                      });
                    }
                    setRenamingId(null);
                  }}
                  className="px-3 py-3"
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => setRenamingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className="w-full outline-none"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#2A2926',
                      background: '#FFFFFF',
                      border: '1px solid #3ECDC6',
                      borderRadius: 6,
                      padding: '4px 6px',
                    }}
                  />
                </form>
              ) : (
                <>
                  <button
                    onClick={() => activateSession(session.id, inMobileOverlay)}
                    className="w-full text-left px-3 py-3 pr-9"
                  >
                    <span
                      className="block truncate"
                      style={{ fontSize: 14, fontWeight: 500, color: '#2A2926' }}
                    >
                      {session.title || 'New Chat'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9B978E' }}>
                      {formatRelative(session.last_message_at || session.created_at)}
                    </span>
                  </button>

                  {/* 3-dot menu trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(isMenuOpen ? null : session.id);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ opacity: isMenuOpen || active ? 1 : undefined }}
                    aria-label="Session options"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="3" cy="8" r="1.5" fill="#6B675E" />
                      <circle cx="8" cy="8" r="1.5" fill="#6B675E" />
                      <circle cx="13" cy="8" r="1.5" fill="#6B675E" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div
                        className="absolute right-2 top-10 z-50 rounded-lg overflow-hidden"
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E8E6E1',
                          boxShadow: '0 4px 12px rgba(42,41,38,0.1)',
                          minWidth: 120,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameValue(session.title || '');
                            setRenamingId(session.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-[#F5F3EE] transition-colors"
                          style={{ fontSize: 13, color: '#2A2926' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="#6B675E" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
                          </svg>
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            if (window.confirm('Delete this chat? This cannot be undone.')) {
                              deleteSession.mutate(
                                { childId: childId!, sessionId: session.id },
                                {
                                  onSuccess: () => {
                                    if (active) {
                                      const remaining = sessions.filter((s) => s.id !== session.id);
                                      if (remaining.length > 0) {
                                        activateSession(remaining[0].id);
                                      } else {
                                        setCurrentSessionId(undefined);
                                        setSearchParams({}, { replace: true });
                                      }
                                    }
                                  },
                                }
                              );
                            }
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-[#FEF0EA] transition-colors"
                          style={{ fontSize: 13, color: '#E8946A' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l.5 9a1 1 0 001 1h3a1 1 0 001-1L11 4" stroke="#E8946A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-[260px] flex-shrink-0 border-r"
        style={{ background: '#FAFAF7', borderColor: '#E8E6E1' }}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative w-[280px] h-full flex flex-col border-r"
            style={{ background: '#FAFAF7', borderColor: '#E8E6E1' }}
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Chat area */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ background: 'linear-gradient(180deg, #FAFAF7 0%, #E8F6F4 100%)' }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: '#E8E6E1',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="#2A2926" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <img
              src={lunoHero}
              alt="Luno"
              className="drop-shadow-md"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#2A2926', display: 'block', lineHeight: 1.2 }}>
                Luno
              </span>
              <span style={{ fontSize: 12, color: '#3ECDC6' }}>
                {isSending ? 'Thinking...' : 'Online'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: '#9B978E' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.5 3.2L13 4.8l-2.5 2.5.6 3.7L8 9.2 4.9 11l.6-3.7L3 4.8l3.5-.6L8 1z" stroke="#9B978E" strokeWidth="1.2" fill="none" />
              <path d="M8 14.5c3.6 0 6.5-2.9 6.5-6.5S11.6 1.5 8 1.5 1.5 4.4 1.5 8s2.9 6.5 6.5 6.5z" stroke="#9B978E" strokeWidth="1.2" />
            </svg>
            <span style={{ fontSize: 11 }}>Safe</span>
          </div>
        </header>

        {/* Messages / empty state */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messagesLoading && isNewChat ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p style={{ fontSize: 14, color: '#9B978E' }}>Loading chat...</p>
            </div>
          ) : isNewChat ? (
            <div className="flex flex-col items-center justify-center h-full">
              {/* Luno hero */}
              <div className="mb-2" style={{ animation: 'lunoBreath 4s ease-in-out infinite' }}>
                <img
                  src={lunoHero}
                  alt="Luno"
                  className="drop-shadow-2xl"
                  style={{ width: 120, height: 120, objectFit: 'contain' }}
                />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2A2926', marginBottom: 12 }}>Luno</span>
              <p className="text-center mb-6" style={{ fontSize: 18, color: '#2A2926', maxWidth: 400 }}>
                Hey {child.name}! {greetingLine}
              </p>

              {/* Previous session hint */}
              {previousSession && (
                <div className="mb-6 text-center" style={{ maxWidth: 420 }}>
                  <p className="mb-3" style={{ fontSize: 13, color: '#9B978E', fontStyle: 'italic' }}>
                    You were asking about {previousSession.title?.toLowerCase()} last time — want to keep exploring?
                  </p>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 500 }}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action)}
                    disabled={isSending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all disabled:opacity-50"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E8E6E1',
                      fontSize: 14,
                      color: '#2A2926',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#3ECDC6';
                      (e.currentTarget as HTMLElement).style.background = '#E8F6F4';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#E8E6E1';
                      (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                    }}
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[640px] mx-auto flex flex-col gap-4">
              {messages.map((msg: BuddyMessage) => {
                const isChild = msg.role === 'child';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isChild ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isChild && (
                      <img
                        src={lunoHero}
                        alt="Luno"
                        className="flex-shrink-0 mr-2 mt-1 drop-shadow-sm"
                        style={{ width: 32, height: 32, objectFit: 'contain' }}
                      />
                    )}
                    <div>
                      <div
                        style={{
                          background: isChild ? '#3ECDC6' : '#FFFFFF',
                          border: !isChild ? '1px solid #E8E6E1' : 'none',
                          borderRadius: isChild ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '12px 16px',
                          maxWidth: 440,
                          fontSize: 15,
                          color: isChild ? '#FFFFFF' : '#2A2926',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          boxShadow: isChild ? '0 2px 8px rgba(62,205,198,0.25)' : 'none',
                        }}
                      >
                        {isChild ? (
                          msg.content
                        ) : (
                          <div className="luno-chat-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isSending && (
                <div className="flex justify-start">
                  <img
                    src={lunoHero}
                    alt="Luno"
                    className="flex-shrink-0 mr-2 mt-1 drop-shadow-sm"
                    style={{ width: 32, height: 32, objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E8E6E1',
                      borderRadius: '16px 16px 16px 4px',
                      padding: '12px 20px',
                    }}
                  >
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#3ECDC6',
                            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          className="border-t px-4 py-3"
          style={{ background: '#FFFFFF', borderColor: '#E8E6E1' }}
        >
          <div className="max-w-[640px] mx-auto flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={isSending || !currentSessionId}
              placeholder="Ask Luno anything..."
              className="flex-1 py-3 px-4 rounded-xl outline-none"
              style={{
                background: '#F5F3EE',
                fontSize: 15,
                color: '#2A2926',
                border: 'none',
              }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isSending || !currentSessionId}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
              style={{
                background: input.trim() && !isSending ? '#3ECDC6' : '#B4DED7',
                cursor: input.trim() && !isSending ? 'pointer' : 'default',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12M12 4l6 6-6 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lunoBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .luno-chat-md { white-space: normal !important; }
        .luno-chat-md > *:first-child { margin-top: 0 !important; }
        .luno-chat-md > *:last-child { margin-bottom: 0 !important; }
        .luno-chat-md p { margin: 0 !important; line-height: 1.6; }
        .luno-chat-md p + p { margin-top: 14px !important; }
        .luno-chat-md ul, .luno-chat-md ol { margin: 8px 0 0 !important; padding-left: 20px !important; }
        .luno-chat-md * + ul, .luno-chat-md * + ol { margin-top: 10px !important; }
        .luno-chat-md li { margin: 0 !important; line-height: 1.6; }
        .luno-chat-md li + li { margin-top: 6px !important; }
        .luno-chat-md li p { margin: 0 !important; display: inline; }
        .luno-chat-md li > p + p { margin-top: 6px !important; display: block; }
        .luno-chat-md strong { font-weight: 600; }
        .luno-chat-md table { border-collapse: collapse; margin: 6px 0 !important; font-size: 13px; }
        .luno-chat-md th, .luno-chat-md td { border: 1px solid #E8E6E1; padding: 4px 8px; }
        .luno-chat-md th { background: #F5F3EE; font-weight: 600; }
        .luno-chat-md br { display: none; }
        .luno-chat-md h1, .luno-chat-md h2, .luno-chat-md h3, .luno-chat-md h4 {
          margin: 4px 0 2px !important; font-size: 15px !important; font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
}
