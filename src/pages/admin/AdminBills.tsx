import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function AdminBills() {
  const [users, setUsers] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    month: '',
    dueDate: '',
    serviceName: 'Water Supply',
    utilityType: 'water' as string,
  });

  useEffect(() => {
    loadUsers();
    loadBills();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'citizen');
    setUsers(data || []);
  };

  const loadBills = async () => {
    const { data } = await (supabase
      .from('bills')
      .select('*, utility_services(service_name, utility_type), profiles!bills_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(20) as any);
    setBills(data || []);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.amount || !formData.dueDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create utility service record with all required fields
      const serviceNumber = `SVC-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const { data: newSvc, error: svcErr } = await (supabase
        .from('utility_services') as any)
        .insert({
          user_id: formData.userId,
          service_name: formData.serviceName,
          utility_type: formData.utilityType,
          service_number: serviceNumber,
          provider_name: 'Suvidha Municipal Corporation',
          connection_address: 'On Record',
          is_active: true,
        })
        .select()
        .single();
      
      if (svcErr) throw svcErr;

      const { error } = await (supabase
        .from('bills') as any)
        .insert({
          user_id: formData.userId,
          utility_service_id: (newSvc as any).id,
          bill_number: `BILL-${Date.now()}`,
          bill_date: new Date().toISOString().split('T')[0],
          amount: parseFloat(formData.amount),
          due_date: formData.dueDate,
          billing_period_start: new Date().toISOString().split('T')[0],
          billing_period_end: formData.dueDate,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Official bill dispatched to citizen!');
      setFormData({ userId: '', amount: '', month: '', dueDate: '', serviceName: 'Water Supply', utilityType: 'water' });
      setUserSearch('');
      loadBills();
    } catch (error: any) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      toast.success('Bill deleted successfully');
      loadBills();
    } catch (error: any) {
      toast.error('Failed to delete bill');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const serviceOptions = [
    { name: 'Water Supply', type: 'water' },
    { name: 'Electricity', type: 'electricity' },
    { name: 'Property Tax', type: 'municipal' },
    { name: 'Sanitation Fee', type: 'municipal' },
    { name: 'Road Maintenance', type: 'municipal' },
    { name: 'General Governance Fee', type: 'municipal' },
  ];

  return (
    <KioskLayout>
      <div className="max-w-5xl mx-auto flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        
        <div className="mb-6">
          <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">Billing Management</h1>
          <p className="text-[0.8rem] font-semibold text-[#7a7368]">Generate official financial demands and track payment status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Create Bill Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCreateBill} className="bg-white rounded-[24px] border p-6 space-y-4"
                  style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
              
              <h2 className="text-[1rem] font-black text-[#0e0d0b] flex items-center gap-2">
                <span className="text-lg">🧾</span> Issue New Bill
              </h2>

              <div className="space-y-2 relative">
                <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Target Citizen</label>
                <div 
                  className="relative" 
                  tabIndex={0} 
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setTimeout(() => setShowUserDropdown(false), 200);
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setShowUserDropdown(true);
                      setFormData(prev => ({ ...prev, userId: '' }));
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    className="w-full h-11 rounded-xl border bg-[#fafaf9] px-4 text-[0.8rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] transition-all"
                  />
                  {showUserDropdown && (
                    <div className="absolute top-12 left-0 right-0 max-h-56 overflow-y-auto bg-white border border-[#0e0d0b]/10 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#0e0d0b]/5">
                      {users.filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).length > 0 ? (
                        users.filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                          <div
                            key={u.id}
                            className="px-4 py-2.5 cursor-pointer hover:bg-orange-50/50 transition-colors"
                            onClick={() => {
                               setFormData(prev => ({ ...prev, userId: u.id }));
                               setUserSearch(`${u.full_name} (${u.email})`);
                               setShowUserDropdown(false);
                            }}
                          >
                            <div className="font-bold text-[#0e0d0b] text-[0.8rem] leading-none mb-1">{u.full_name}</div>
                            <div className="text-[0.65rem] font-semibold text-[#7a7368] truncate">{u.email}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-[0.75rem] text-[#7a7368] font-bold text-center">No citizens match your search</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Service Type</label>
                <select
                  value={formData.serviceName}
                  onChange={(e) => {
                    const opt = serviceOptions.find(s => s.name === e.target.value);
                    setFormData(prev => ({ ...prev, serviceName: e.target.value, utilityType: opt?.type || 'municipal' }));
                  }}
                  className="w-full h-11 rounded-xl border bg-[#fafaf9] px-4 text-[0.8rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] appearance-none"
                >
                  {serviceOptions.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full h-11 rounded-xl border bg-[#fafaf9] px-4 text-[0.8rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                    className="w-full h-11 rounded-xl border bg-[#fafaf9] px-4 text-[0.8rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.6rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">Billing Cycle</label>
                <input
                  type="text"
                  placeholder="e.g. March 2026"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full h-11 rounded-xl border bg-[#fafaf9] px-4 text-[0.8rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0e0d0b] text-white text-[0.85rem] font-black hover:opacity-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? '🔐 Processing...' : '📤 Dispatch Bill'}
              </button>
            </form>
          </div>

          {/* Recent Bills Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[24px] border overflow-hidden" 
                 style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                <h3 className="text-[0.9rem] font-black text-[#0e0d0b] flex items-center gap-2">
                  <span>📋</span> Issued Bills
                </h3>
                <span className="text-[0.65rem] font-bold text-[#7a7368] bg-[#fafaf9] px-3 py-1 rounded-full">{bills.length} records</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
                {bills.length > 0 ? bills.map((bill) => (
                  <div key={bill.id} className="px-5 py-4 border-b flex items-center justify-between hover:bg-[#fafaf9] transition-colors" style={{ borderColor: 'rgba(14,13,11,.04)' }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.8rem] font-black text-[#0e0d0b] truncate">
                        {bill.profiles?.full_name || 'Citizen'} — {bill.utility_services?.service_name || 'Service'}
                      </div>
                      <div className="text-[0.65rem] font-semibold text-[#7a7368]">
                        {bill.bill_number} • Due: {new Date(bill.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-[0.9rem] font-black text-[#0e0d0b]">₹{bill.amount}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[0.55rem] font-black uppercase ${getStatusBadge(bill.status)}`}>
                        {bill.status}
                      </span>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                        title="Delete Bill"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-[0.8rem] font-bold text-[#7a7368]">No bills issued yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </KioskLayout>
  );
}
