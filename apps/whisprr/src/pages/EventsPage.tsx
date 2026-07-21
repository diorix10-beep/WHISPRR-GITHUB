import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Check, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/common/Avatar';

interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  host_id: string | null;
  location: string;
  host?: {
    display_name: string;
    username: string;
    avatar_emoji: string;
    photo_url: string | null;
  };
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);

  // Load RSVP state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whisprr_event_rsvps');
    if (saved) {
      try {
        setRsvpedEvents(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch events from database
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('community_events')
          .select('*, host:profiles(display_name, username, avatar_emoji, photo_url)')
          .order('scheduled_start_time', { ascending: true });

        if (error) throw error;
        if (data) setEvents(data);
      } catch (err) {
        console.error('Error fetching community events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleToggleRsvp = (eventId: string) => {
    let updated: string[];
    if (rsvpedEvents.includes(eventId)) {
      updated = rsvpedEvents.filter(id => id !== eventId);
    } else {
      updated = [...rsvpedEvents, eventId];
    }
    setRsvpedEvents(updated);
    localStorage.setItem('whisprr_event_rsvps', JSON.stringify(updated));
  };

  const getEventActionLink = (location: string) => {
    // If it's a channel name (like #voice-lounge or #ama-stage), link to Discord
    if (location.startsWith('#')) {
      return 'https://discord.gg/WHISPRRHQ'; // Base server invitation or deep link
    }
    return location;
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 dark:bg-primary-950/40 rounded-2xl text-primary-500">
          <CalendarIcon size={28} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-warm-900 dark:text-warm-50">Community Calendar</h1>
          <p className="text-warm-500 text-sm mt-0.5">Participate in official hangouts, coworking, and AMA sessions.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-500 mb-3" size={32} />
          <p className="text-warm-500 text-sm">Loading calendar events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-warm-800 rounded-3xl border border-warm-150 dark:border-warm-700/50 p-8 shadow-sm">
          <p className="text-warm-500 font-medium">No upcoming community events scheduled yet.</p>
          <p className="text-warm-400 text-xs mt-1">Check back later or tune in on Discord for updates!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const hasRsvped = rsvpedEvents.includes(event.id);
            const isDiscordLink = event.location.startsWith('#');
            const targetUrl = getEventActionLink(event.location);
            const isUpcoming = new Date(event.scheduled_start_time) > new Date();

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-warm-800 border border-warm-150 dark:border-warm-700/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
              >
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center bg-warm-50 dark:bg-warm-900/60 p-4 rounded-2xl w-24 shrink-0 border border-warm-100 dark:border-warm-800">
                  <span className="text-[10px] font-bold text-warm-400 dark:text-warm-500 uppercase tracking-widest">
                    {new Date(event.scheduled_start_time).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-3xl font-bold font-serif text-warm-850 dark:text-warm-100 my-0.5">
                    {new Date(event.scheduled_start_time).getDate()}
                  </span>
                  <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">
                    {new Date(event.scheduled_start_time).toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                </div>

                {/* Event Details */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold font-serif text-warm-900 dark:text-warm-50 truncate leading-snug">
                      {event.title}
                    </h2>
                    {!isUpcoming && (
                      <span className="px-2 py-0.5 bg-warm-100 dark:bg-warm-700 text-warm-500 text-[10px] font-bold rounded-md">
                        Ended
                      </span>
                    )}
                  </div>

                  <p className="text-warm-650 dark:text-warm-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs text-warm-500 dark:text-warm-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary-500" />
                      <span>
                        {formatEventTime(event.scheduled_start_time)}
                        {event.scheduled_end_time && ` - ${formatEventTime(event.scheduled_end_time)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Host info */}
                  {event.host && (
                    <div className="flex items-center gap-2 pt-2 border-t border-warm-100 dark:border-warm-700/60 mt-4">
                      <span className="text-[10px] font-bold text-warm-400 dark:text-warm-500 uppercase tracking-wider">
                        Host:
                      </span>
                      <Avatar
                        emoji={event.host.avatar_emoji}
                        photoUrl={event.host.photo_url}
                        size="xs"
                      />
                      <span className="text-xs font-semibold text-warm-800 dark:text-warm-200">
                        {event.host.display_name}
                      </span>
                      <span className="text-[10px] text-warm-400">
                        @{event.host.username}
                      </span>
                    </div>
                  )}
                </div>

                {/* RSVP / Action Buttons */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-warm-100 dark:border-warm-700/60">
                  <button
                    onClick={() => handleToggleRsvp(event.id)}
                    disabled={!isUpcoming}
                    className={`flex-1 md:w-36 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      hasRsvped
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30'
                        : 'bg-warm-100 dark:bg-warm-700/70 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
                    }`}
                  >
                    {hasRsvped ? (
                      <>
                        <Check size={14} />
                        <span>RSVP'd</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>RSVP</span>
                      </>
                    )}
                  </button>

                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:w-36 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center"
                  >
                    {isDiscordLink ? 'Join on Discord' : 'Open Link'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
