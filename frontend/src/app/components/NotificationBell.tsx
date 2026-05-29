import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { notificationApi } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getAll();
      setNotifications(data);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Polling cada 20 segundos
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.leido).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, leido: true } : n))
      );
    } catch (error) {
      console.error("Error marcando como leída:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 w-80 sm:w-96 z-20 shadow-xl border-slate-200 animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Notificaciones</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Bell size={32} className="opacity-20" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                      !notification.leido ? 'bg-blue-50/40 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.leido ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {notification.mensaje}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      {!notification.leido && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-3 border-t text-center bg-slate-50/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como leídas
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

