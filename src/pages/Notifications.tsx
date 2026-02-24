import KioskLayout from '@/components/layouts/KioskLayout';

export default function Notifications() {
  const notifications = [
    { id: 1, title: 'Bill Dispatched', desc: 'Your electricity bill for Feb 2026 is now available.', time: '2 hours ago', icon: '🧾', unread: true },
    { id: 2, title: 'Complaint Status', desc: 'Case #CMP1702 has been escalated to Senior Officer.', time: '5 hours ago', icon: '📝', unread: true },
    { id: 3, title: 'Service Approved', desc: 'Your water connection request has been digitally signed.', time: 'Yesterday', icon: '✅', unread: false },
    { id: 4, title: 'System Maintenance', desc: 'Platform will be under maintenance on Sunday midnight.', time: '2 days ago', icon: '⚙️', unread: false },
  ];

  return (
    <KioskLayout>
      <div className="max-w-3xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0e0d0b]">Alerts & Notifications</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Official updates on your applications and bills</p>
          </div>
          <button className="text-[0.7rem] font-black uppercase tracking-widest text-[#cc5500] hover:underline">
            Mark all as read
          </button>
        </div>

        <div className="space-y-4 flex-grow overflow-y-auto pr-2 scrollbar-hide pb-20">
          {notifications.map((note) => (
            <div 
              key={note.id}
              className={`rounded-[24px] border p-6 flex items-start gap-4 transition-all hover:translate-x-1 ${note.unread ? 'bg-white border-[#cc5500]/20' : 'bg-[#fafafa] border-transparent opacity-80'}`}
              style={note.unread ? { boxShadow: '0 4px 15px rgba(204,85,0,0.05)' } : {}}
            >
              <div className="h-12 w-12 rounded-xl bg-white border border-[#0e0d0b]/05 flex items-center justify-center text-2xl shadow-sm">
                {note.icon}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[0.95rem] font-black text-[#0e0d0b]">{note.title}</h3>
                  <span className="text-[0.65rem] font-bold text-[#7a7368]">{note.time}</span>
                </div>
                <p className="text-[0.85rem] font-semibold text-[#7a7368] leading-relaxed">
                  {note.desc}
                </p>
              </div>
              {note.unread && <div className="h-2 w-2 rounded-full bg-[#cc5500] mt-2" />}
            </div>
          ))}
        </div>

      </div>
    </KioskLayout>
  );
}
