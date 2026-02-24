import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAnn, setSubmittingAnn] = useState(false);
  const [submittingNotif, setSubmittingNotif] = useState(false);

  const [annForm, setAnnForm] = useState({ title: '', content: '', type: 'info' });
  const [notifForm, setNotifForm] = useState({ userId: '', title: '', content: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [annRes, userRes] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'citizen')
      ]);
      setAnnouncements(annRes.data || []);
      setUsers(userRes.data || []);
    } catch (error) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAnn(true);
    try {
      const { error } = await (supabase.from('announcements') as any).insert([{
        ...annForm,
        is_active: true,
        start_date: new Date().toISOString(),
        created_by: user?.id
      }]);
      if (error) throw error;
      toast.success('Public announcement broadcasted!');
      setAnnForm({ title: '', content: '', type: 'info' });
      loadData();
    } catch (error: any) {
      toast.error('Broadcast failed: ' + error.message);
    } finally {
      setSubmittingAnn(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.userId) return toast.error('Select a recipient');
    setSubmittingNotif(true);
    try {
      const { error } = await (supabase.from('notifications') as any).insert([
        {
          user_id: notifForm.userId,
          title: notifForm.title,
          message: notifForm.content,
          type: 'alert',
          is_read: false
        }
      ]);
      if (error) throw error;
      toast.success('Private notification dispatched!');
      setNotifForm({ userId: '', title: '', content: '' });
    } catch (error: any) {
      toast.error('Dispatch failed: ' + error.message);
    } finally {
      setSubmittingNotif(false);
    }
  };

  if (loading) return <KioskLayout><div className="flex h-full items-center justify-center opacity-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></KioskLayout>;

  return (
    <KioskLayout>
      <div className="max-w-6xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        
        <div className="mb-10">
          <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">Communication Hub</h1>
          <p className="text-[0.8rem] font-semibold text-[#7a7368]">Broadcast public bulletins or dispatch secure private alerts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Announcements Section */}
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] border p-10 space-y-6" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📢</span>
                <h2 className="text-[1.2rem] font-black text-[#0e0d0b]">Public Announcement</h2>
              </div>
              
              <form onSubmit={handleCreateAnnouncement} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Urgency Level</label>
                  <div className="flex bg-[#fafaf9] rounded-2xl border p-1" style={{ borderColor: 'rgba(14,13,11,.08)' }}>
                    {['info', 'warning', 'emergency'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAnnForm({...annForm, type})}
                        className={`flex-1 py-3 rounded-xl text-[0.7rem] font-black uppercase transition-all ${annForm.type === type ? 'bg-[#0e0d0b] text-white shadow-lg' : 'text-[#7a7368] hover:bg-white'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Headline</label>
                  <input
                    value={annForm.title}
                    onChange={e => setAnnForm({...annForm, title: e.target.value})}
                    placeholder="Brief summary of the notice"
                    required
                    className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Detailed Bulletin</label>
                  <textarea
                    value={annForm.content}
                    onChange={e => setAnnForm({...annForm, content: e.target.value})}
                    placeholder="Provide complete details..."
                    rows={4}
                    required
                    className="w-full rounded-2xl border bg-[#fafaf9] p-5 text-[0.95rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAnn}
                  className="w-full py-5 rounded-2xl bg-[#0e0d0b] text-white text-[1rem] font-black hover:opacity-90 shadow-xl transition-all shadow-black/10"
                >
                  {submittingAnn ? '🛰️ Broadcasting...' : '📤 Release Announcement'}
                </button>
              </form>
            </div>

            <div className="bg-[#fafafc] rounded-[40px] border p-8 space-y-4" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
               <h3 className="text-[0.8rem] font-black uppercase tracking-[0.2em] text-[#0e0d0b]/30">Active Bulletins</h3>
               <div className="space-y-3">
                 {announcements.slice(0, 3).map(ann => (
                   <div key={ann.id} className="p-4 bg-white rounded-2xl border border-[#0e0d0b]/05 flex justify-between items-center group">
                     <div>
                       <div className="text-[0.8rem] font-black text-[#0e0d0b]">{ann.title}</div>
                       <div className="text-[0.65rem] font-bold text-[#7a7368] uppercase">{ann.type} • {new Date(ann.created_at).toLocaleDateString()}</div>
                     </div>
                     <button className="h-8 w-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] border p-10 space-y-6" style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🛡️</span>
                <h2 className="text-[1.2rem] font-black text-[#0e0d0b]">Direct Citizen Alert</h2>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Recipient Citizen</label>
                  <select
                    value={notifForm.userId}
                    onChange={e => setNotifForm({...notifForm, userId: e.target.value})}
                    required
                    className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] appearance-none"
                  >
                    <option value="">Search records...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Alert Subject</label>
                  <input
                    value={notifForm.title}
                    onChange={e => setNotifForm({...notifForm, title: e.target.value})}
                    placeholder="Direct message header"
                    required
                    className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Secure Message Content</label>
                  <textarea
                    value={notifForm.content}
                    onChange={e => setNotifForm({...notifForm, content: e.target.value})}
                    placeholder="Type official notification message here..."
                    rows={4}
                    required
                    className="w-full rounded-2xl border bg-[#fafaf9] p-5 text-[0.95rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingNotif}
                  className="w-full py-5 rounded-2xl bg-[#cc5500] text-white text-[1rem] font-black hover:opacity-90 shadow-xl transition-all shadow-orange-500/10"
                >
                  {submittingNotif ? '📩 Dispatching...' : '🚀 Send Private Alert'}
                </button>
              </form>
            </div>

            <div className="p-10 bg-[#0e0d0b] rounded-[40px] text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-[1.2rem] font-black mb-4 flex items-center gap-3">
                   <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   System Identity
                 </h4>
                 <p className="text-[0.8rem] font-bold opacity-60 leading-relaxed mb-6">
                   All communications are cryptographically signed by the official Government Command Gateway and delivered to citizen dashboards instantly.
                 </p>
                 <div className="text-[0.65rem] font-black uppercase tracking-widest opacity-40">Encryption Status: TLS 1.3 AES-256</div>
               </div>
               <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">⚖️</div>
            </div>
          </div>

        </div>
      </div>
    </KioskLayout>
  );
}
