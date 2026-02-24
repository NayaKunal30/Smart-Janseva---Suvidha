import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: (profile.full_name as string) || '',
        phone: (profile.phone as string) || '',
        email: (profile.email as string) || '',
        address: (profile.address as string) || '',
        city: (profile.city as string) || '',
        state: (profile.state as string) || '',
        pincode: (profile.pincode as string) || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Official records updated!');
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update records');
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !user) return <KioskLayout><div className="flex h-full items-center justify-center opacity-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></KioskLayout>;

  return (
    <KioskLayout>
      <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        
        {/* Profile Identity Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white rounded-[40px] border p-8"
              style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <div className="h-32 w-32 rounded-[40px] bg-[#0e0d0b] text-white flex items-center justify-center text-5xl font-black shadow-2xl shadow-black/20">
            {formData.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-center md:text-left flex-grow">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-[2.2rem] font-black text-[#0e0d0b] leading-tight">{formData.full_name || 'Citizen User'}</h1>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-[#cc5500] text-[0.6rem] font-black uppercase tracking-widest border border-orange-100">
                {(profile as any).role || 'Citizen'}
              </span>
            </div>
            <p className="text-[0.9rem] font-bold text-[#7a7368]">Universal ID: {(user?.id || '').slice(0, 18).toUpperCase()}</p>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={loading}
            className="px-8 py-4 rounded-[20px] bg-[#0e0d0b] text-white text-[0.95rem] font-black hover:opacity-95 transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            {loading ? '💾 Saving...' : editing ? '✅ Save Records' : '✏️ Modify Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Identity & Contact */}
          <div className="lg:col-span-2 bg-white rounded-[40px] border p-10 space-y-10"
                style={{ borderColor: 'rgba(14,13,11,.09)' }}>
            
            <section className="space-y-6">
              <h3 className="text-[0.8rem] font-black uppercase tracking-[0.2em] text-[#0e0d0b]/40">Personal Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">Official Name</label>
                  <input
                    disabled={!editing}
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">Contact Number</label>
                  <input
                    disabled={!editing}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">Email Address</label>
                  <input
                    disabled={!editing}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[0.8rem] font-black uppercase tracking-[0.2em] text-[#0e0d0b]/40">Residential Data</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">Street / Locality</label>
                  <textarea
                    disabled={!editing}
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full rounded-2xl border bg-[#fafaf9] p-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">City</label>
                    <input
                      disabled={!editing}
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">State</label>
                    <input
                      disabled={!editing}
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-[#7a7368] uppercase ml-1">Pincode</label>
                    <input
                      disabled={!editing}
                      value={formData.pincode}
                      onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                      className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-8">
            <div className="bg-[#0e0d0b] rounded-[40px] p-10 text-white flex flex-col items-center text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h4 className="text-[1.2rem] font-black mb-2">Verified Citizen</h4>
              <p className="text-[0.75rem] font-bold opacity-60 leading-relaxed mb-8">
                Your account is linked to India's Integrated Governance Network.
              </p>
              <div className="w-full space-y-4">
                 <div className="flex justify-between items-center text-[0.65rem] font-black uppercase opacity-40">
                   <span>Member Since</span>
                   <span>{new Date((profile as any).created_at || Date.now()).getFullYear()}</span>
                 </div>
                 <div className="h-px bg-white/10" />
                 <div className="flex justify-between items-center text-[0.65rem] font-black uppercase opacity-40">
                   <span>Data Status</span>
                   <span className="text-green-500">Encrypted</span>
                 </div>
              </div>
            </div>

            <div className="bg-[#1b8f99] rounded-[40px] p-10 text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-[1rem] font-black mb-4">Support & Help</h4>
                 <p className="text-[0.75rem] font-bold opacity-80 leading-relaxed mb-6">
                   Need to change your registered email or link your ID? 
                 </p>
                 <button className="text-[0.75rem] font-black underline decoration-2 underline-offset-4">Open Support Ticket</button>
               </div>
               <div className="absolute -bottom-6 -right-6 text-7xl opacity-10 rotate-12 group-hover:scale-125 transition-transform">🎧</div>
            </div>
          </div>

        </div>
      </div>
    </KioskLayout>
  );
}
