import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus, Sparkles } from 'lucide-react';
import { actionsApi, eventsApi } from '../lib/api';
import { formatDate } from '../lib/utils';
import { AppLayout } from '../components/AppLayout';
import { Modal } from '../components/ui';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [actions, setActions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [createEventModal, setCreateEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', event_date: '', event_time: '', location: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [actRes, evRes] = await Promise.all([actionsApi.list(), eventsApi.list()]);
        setActions(actRes.data);
        setEvents(evRes.data);
      } catch { toast.error('Failed to load calendar data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = startOfMonth(currentMonth).getDay();

  const getItemsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayActions = actions.filter(a => a.due_date === dateStr && a.status !== 'completed');
    const dayEvents = events.filter(e => e.event_date === dateStr);
    return { actions: dayActions, events: dayEvents };
  };

  const selectedDayItems = selectedDay ? getItemsForDay(selectedDay) : null;

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) {
      toast.error('Title and date are required');
      return;
    }
    try {
      const res = await eventsApi.create(newEvent);
      setEvents(prev => [...prev, res.data]);
      setCreateEventModal(false);
      setNewEvent({ title: '', event_date: '', event_time: '', location: '' });
      toast.success('Event created!');
    } catch { toast.error('Failed to create event'); }
  };

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-neon-cyan animate-pulse" /> Time & Event Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Action Calendar
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Deadlines, extracted meetings, and schedule commitments.
          </p>
        </div>
        <button
          onClick={() => {
            if (selectedDay) {
              setNewEvent(prev => ({ ...prev, event_date: format(selectedDay, 'yyyy-MM-dd') }));
            }
            setCreateEventModal(true);
          }}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-[0_0_20px_rgba(124,58,255,0.4)]"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black tracking-tight text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-ink-muted uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`off-${i}`} className="h-14 rounded-2xl opacity-20" />
              ))}

              {days.map(day => {
                const { actions: da, events: de } = getItemsForDay(day);
                const isCurrent = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      relative h-14 rounded-2xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer border
                      ${isCurrent
                        ? 'bg-gradient-to-br from-brand-600 to-pink-600 text-white border-brand-400 shadow-[0_0_15px_rgba(124,58,255,0.5)]'
                        : isSelected
                        ? 'bg-surface-2 text-white border-neon-cyan shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                        : 'bg-surface-2/40 text-ink-muted hover:text-white hover:bg-surface-2 border-white/[0.04]'
                      }
                    `}
                  >
                    <span className="text-sm font-extrabold">{format(day, 'd')}</span>
                    {(da.length > 0 || de.length > 0) && (
                      <div className="flex items-center gap-1 mt-1">
                        {da.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-neon-amber shadow-[0_0_6px_#ffd700]" />
                        )}
                        {de.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_#00e5ff]" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-6 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-amber shadow-[0_0_8px_#ffd700]" />
                <span>Action Deadlines ({actions.filter(a => a.status !== 'completed' && a.due_date).length})</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_8px_#00e5ff]" />
                <span>Document Events ({events.length})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day & Upcoming Panels */}
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-white/[0.06] flex items-center justify-between">
              <span>{selectedDay ? (isToday(selectedDay) ? 'Today · ' : '') + format(selectedDay, 'MMMM d, yyyy') : 'Selected Date'}</span>
              {selectedDay && (
                <span className="text-xs font-mono font-bold text-neon-cyan">
                  {(selectedDayItems?.actions.length || 0) + (selectedDayItems?.events.length || 0)} items
                </span>
              )}
            </h3>

            {(!selectedDayItems?.actions.length && !selectedDayItems?.events.length) ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 text-ink-subtle mx-auto mb-2 opacity-50" />
                <p className="text-xs text-ink-muted">Nothing scheduled for this date</p>
                <button
                  onClick={() => {
                    if (selectedDay) setNewEvent(prev => ({ ...prev, event_date: format(selectedDay, 'yyyy-MM-dd') }));
                    setCreateEventModal(true);
                  }}
                  className="mt-3 text-xs text-neon-cyan font-bold hover:underline"
                >
                  + Add event on this day
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {selectedDayItems?.events.map((ev: any) => (
                  <div key={ev.id} className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CalendarIcon className="w-4 h-4 text-neon-cyan" />
                      <p className="text-xs font-bold text-white">{ev.title}</p>
                    </div>
                    {ev.event_time && (
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-200 mt-1">
                        <Clock className="w-3 h-3 text-neon-cyan" /> {ev.event_time}
                      </div>
                    )}
                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-200 mt-1">
                        <MapPin className="w-3 h-3 text-neon-pink" /> {ev.location}
                      </div>
                    )}
                  </div>
                ))}

                {selectedDayItems?.actions.map((a: any) => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white">{a.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {a.priority}
                      </span>
                    </div>
                    {a.assignee && (
                      <p className="text-[11px] text-amber-200 mt-1">👤 Assignee: {a.assignee}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="p-5 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
              Upcoming Schedule
            </h3>
            {events.slice(0, 5).length === 0 ? (
              <p className="text-xs text-ink-subtle">No upcoming events scheduled</p>
            ) : (
              <div className="space-y-2.5">
                {events.slice(0, 5).map((ev: any) => (
                  <div key={ev.id} className="flex items-center gap-3 p-2 rounded-xl bg-surface-2/60 border border-white/[0.04]">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_6px_#00e5ff] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{ev.title}</p>
                      <p className="text-[10px] font-mono text-cyan-300">{formatDate(ev.event_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={createEventModal} onClose={() => setCreateEventModal(false)} title="Create New Calendar Event">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Event Title *</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-neon-cyan"
              placeholder="e.g. Contract Signing Meeting"
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Date *</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-cyan"
                value={newEvent.event_date}
                onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-cyan"
                value={newEvent.event_time}
                onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Location / Room / Link</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-neon-cyan"
              placeholder="e.g. Google Meet link or Conference Room 3"
              value={newEvent.location}
              onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreateEvent}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-pink-600 hover:from-brand-500 hover:to-pink-500 shadow-[0_0_20px_rgba(124,58,255,0.4)] transition-all cursor-pointer"
          >
            Save Event
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
