import { useState, useEffect } from 'react';
// @ts-ignore
import { AnimatePresence, motion } from 'framer-motion';
// @ts-ignore
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'reaction' | 'comment' | 'message';
  title: string;
  description: string;
  createdAt: string;
  read?: boolean;
  link?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkAsRead }) => {
  const [open, setOpen] = useState(false);
  const [lastNotiId, setLastNotiId] = useState<string | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Mostrar toast emergente para nuevas notificaciones
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (lastNotiId && latest.id !== lastNotiId) {
      toast(latest.title + ': ' + latest.description, {
        action: {
          label: 'Ver',
          onClick: () => {
            if (latest.link) window.location.href = latest.link;
            setOpen(true);
          }
        },
        duration: 6000
      });
    }
    setLastNotiId(latest.id);
    // eslint-disable-next-line
  }, [notifications]);

  // Cerrar el panel de notificaciones al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const notifPanel = document.getElementById('notification-center-panel');
      if (notifPanel && !notifPanel.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 focus:outline-none group transition shadow-md border border-gray-200 dark:border-gray-800"
        onClick={() => setOpen(v => !v)}
        aria-label="Ver notificaciones"
        style={{ boxShadow: open ? '0 0 0 3px #a5b4fc' : undefined, borderColor: open ? '#6366f1' : undefined }}
      >
        <span className="relative block">
          <Bell className={`h-7 w-7 text-gray-700 dark:text-gray-200 group-hover:scale-110 transition-transform ${open ? 'text-primary-600 dark:text-primary-400' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-lg border-2 border-white dark:border-gray-900 animate-bounce select-none pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="notification-center-panel"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute right-0 mt-2 w-96 max-w-xs bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 z-50 animate-fade-in"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-lg text-gray-700 dark:text-gray-200">Notificaciones</span>
              <button className="text-xs text-primary-600 hover:underline" onClick={() => setOpen(false)}>Cerrar</button>
            </div>
            {/* Lista vertical, sin fichas/filtros */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-base">Sin notificaciones</div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 items-center px-4 py-3 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all ${!n.read ? 'bg-primary-50/60 dark:bg-primary-900/10 border-l-4 border-primary-400' : ''}`}
                  onClick={() => { onMarkAsRead?.(n.id); setOpen(false); if(n.link) window.location.href = n.link; }}
                >
                  <span className="flex-shrink-0 text-2xl">
                    {n.type === 'reaction' && '💖'}
                    {n.type === 'comment' && '💬'}
                    {n.type === 'message' && '✉️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-base text-gray-800 dark:text-gray-100 block truncate">{n.title}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 block truncate">{n.description}</span>
                    <span className="text-[11px] text-gray-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
