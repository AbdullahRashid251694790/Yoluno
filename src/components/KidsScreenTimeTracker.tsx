/**
 * Kids Screen Time Tracker
 *
 * Sends a heartbeat POST every 30s while the child is on any /kids/ route.
 * Reads the response to check whether today's session time limit has been
 * reached. When it has, renders a full-screen blocking overlay ("Time's up!")
 * that the child cannot dismiss — they must leave kids mode.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';
import lunoHappy from '@/assets/landing/luno-happy.png';
import { Check } from 'lucide-react';

const HEARTBEAT_MS = 30_000;

interface HeartbeatResponse {
  ok: boolean;
  time_up: boolean;
  minutes_used: number;
  limit_minutes: number | null;
}

export function KidsScreenTimeTracker() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract childId directly from the URL path (/kids/:childId/...) instead
  // of from activeChild context. This is critical because KidsHome's cleanup
  // effect calls exitKidsMode() (setting activeChild to null) when navigating
  // to other kids pages like journeys or chat, which would stop heartbeats.
  const pathMatch = location.pathname.match(/^\/kids\/([^/]+)/);
  const onKidsRoute = !!pathMatch;
  const childId = pathMatch?.[1] ?? null;

  const childIdRef = useRef(childId);
  const onKidsRouteRef = useRef(onKidsRoute);
  const timeUpRef = useRef(false);
  childIdRef.current = childId;
  onKidsRouteRef.current = onKidsRoute;

  const [timeUp, setTimeUp] = useState(false);
  const [requested, setRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Reset when leaving kids mode so re-entering starts fresh
  useEffect(() => {
    if (!onKidsRoute) {
      setTimeUp(false);
      setRequested(false);
      setRequesting(false);
      timeUpRef.current = false;
    }
  }, [onKidsRoute]);

  const handleRequestMoreTime = async () => {
    const id = childIdRef.current;
    if (!id || requesting || requested) return;
    setRequesting(true);
    try {
      await apiClient.post(`/kids-mode/request-more-time/${id}`);
      setRequested(true);
    } catch {
      // silently fail
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (!onKidsRoute || !childId) return;

    const send = () => {
      const id = childIdRef.current;
      if (!id || !onKidsRouteRef.current) return;
      if (timeUpRef.current) return; // Stop pinging once blocked

      apiClient
        .post<HeartbeatResponse>(`/kids-mode/heartbeat/${id}`)
        .then((res) => {
          if (res.data.time_up) {
            timeUpRef.current = true;
            setTimeUp(true);
          }
        })
        .catch(() => {
          // Best-effort — never surface errors to the child UI
        });
    };

    send();
    const intervalId = window.setInterval(send, HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [childId, onKidsRoute]);

  if (!timeUp) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)',
      }}
    >
      <div className="text-center px-6 max-w-sm">
        <img
          src={lunoHappy}
          alt="Luno"
          className="w-36 h-36 mx-auto mb-6 object-contain animate-bounce"
          style={{ animationDuration: '2s' }}
        />
        <h1
          className="text-[32px] mb-3"
          style={{
            fontWeight: 700,
            color: '#2A2926',
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}
        >
          Time's Up!
        </h1>
        <p
          className="text-[16px] mb-2 leading-relaxed"
          style={{ color: '#6B675E' }}
        >
          Great job today! You've used all your screen time.
        </p>
        <p
          className="text-[14px] mb-8"
          style={{ color: '#9B978E' }}
        >
          Time to take a break — see you next time!
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => navigate('/play')}
            className="px-6 py-3 rounded-full text-[14px] transition hover:opacity-90 w-full max-w-[240px]"
            style={{
              background: '#3ECDC6',
              color: '#FFFFFF',
              fontWeight: 600,
              border: 'none',
            }}
          >
            Go back to profiles
          </button>
          <button
            onClick={handleRequestMoreTime}
            disabled={requesting || requested}
            className="px-6 py-3 rounded-full text-[14px] transition hover:opacity-90 w-full max-w-[240px] flex items-center justify-center gap-2"
            style={{
              background: requested ? '#E8F6F4' : '#FFFFFF',
              color: requested ? '#3ECDC6' : '#6B675E',
              fontWeight: 500,
              border: requested ? '1px solid #3ECDC6' : '1px solid #E8E6E1',
            }}
          >
            {requested ? (
              <>
                <Check size={14} />
                Request sent!
              </>
            ) : requesting ? (
              'Sending...'
            ) : (
              'Request more time'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
