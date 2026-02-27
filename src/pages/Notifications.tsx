import { useState, useEffect } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      
      // Update local state immediately for better UX
      setNotifications([]);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
        
      if (error) throw error;
      loadNotifications(); 
      window.dispatchEvent(new Event('sj-notif-change'));
      // Update global context by triggering a small delay event or it will be picked up on next route/effect
    } catch (error) {
      console.error('Error clearing notifications:', error);
      loadNotifications(); // revert on fail
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 60) return `${diffMins || 1} mins ago`;
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    if (diffDays === 1) return `Yesterday`;
    return `${diffDays} days ago`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return '🔔';
      case 'bill': return '🧾';
      case 'service': return '✅';
      case 'complaint': return '📝';
      default: return '📣';
    }
  };

  return (
    <KioskLayout>
      <div className="max-w-3xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0e0d0b]">Alerts & Notifications</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Official updates on your applications and messages</p>
          </div>
          <button onClick={markAllAsRead} className="text-[0.7rem] font-black uppercase tracking-widest text-[#cc5500] hover:underline cursor-pointer">
            Mark all as read
          </button>
        </div>

        <div className="space-y-4 flex-grow overflow-y-auto pr-2 scrollbar-hide pb-20">
          {loading ? (
             <div className="text-center py-10 opacity-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div></div>
          ) : notifications.length === 0 ? (
             <div className="text-center py-20 text-[0.9rem] font-bold text-[#7a7368]">No recent notifications.</div>
          ) : notifications.map((note: any) => (
            <div 
              key={note.id}
              className={`rounded-[24px] border p-6 flex items-start gap-4 transition-all hover:translate-x-1 ${!note.is_read ? 'bg-white border-[#cc5500]/20' : 'bg-[#fafafa] border-transparent opacity-80'}`}
              style={!note.is_read ? { boxShadow: '0 4px 15px rgba(204,85,0,0.05)' } : {}}
            >
              <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-white border border-[#0e0d0b]/05 flex items-center justify-center text-2xl shadow-sm">
                {getIcon(note.type)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[0.95rem] font-black text-[#0e0d0b]">{note.title}</h3>
                  <span className="text-[0.65rem] font-bold text-[#7a7368]">{getRelativeTime(note.created_at)}</span>
                </div>
                <p className="text-[0.85rem] font-semibold text-[#7a7368] leading-relaxed">
                  {note.message}
                </p>
              </div>
              {!note.is_read && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#cc5500] mt-2" />}
            </div>
          ))}
        </div>

      </div>
    </KioskLayout>
  );
}
