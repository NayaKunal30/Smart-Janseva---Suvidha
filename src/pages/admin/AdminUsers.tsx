import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(u => 
        (u.full_name || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q)
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      console.error('Users load error:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (error: any) {
      toast.error('Role update failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">User Directory</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Manage identities and access controls</p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 rounded-[16px] border bg-white pl-12 pr-4 text-[0.85rem] font-bold outline-none focus:border-[#cc5500] transition-all"
              style={{ borderColor: 'rgba(14,13,11,.15)' }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide pb-10">
          <div className="bg-white rounded-[32px] border overflow-hidden" 
               style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafaf9] border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Identity</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Current Role</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Joined</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center text-[0.9rem] font-bold text-[#7a7368]">Syncing records...</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-orange-50/10" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#f0f9ff] flex items-center justify-center text-lg font-black text-[#0369a1] border border-[#e0f2fe]">
                          {u.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-[0.9rem] font-black text-[#0e0d0b]">{u.full_name || 'Anonymous User'}</div>
                          <div className="text-[0.7rem] font-semibold text-[#7a7368]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-tight ${
                        u.role === 'admin' ? 'bg-[#0e0d0b] text-white' : 
                        u.role === 'officer' ? 'bg-[#1b8f99] text-white' : 'bg-[#f5f1ea] text-[#7a7368]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[0.8rem] font-bold text-[#7a7368]">
                      {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <select
                        value={u.role}
                        disabled={updating === u.id}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="h-10 rounded-xl bg-[#fafaf9] border px-4 text-[0.75rem] font-black outline-none focus:border-[#cc5500] cursor-pointer"
                        style={{ borderColor: 'rgba(14,13,11,.1)' }}
                      >
                        <option value="citizen">Mark as Citizen</option>
                        <option value="officer">Promote to Officer</option>
                        <option value="admin">Grant Admin Powers</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </KioskLayout>
  );
}
