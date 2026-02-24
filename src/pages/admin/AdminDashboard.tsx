import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { generateAdminReport } from '@/db/reportGenerator';
import { toast } from 'sonner';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

const COLORS = ['#cc5500', '#1b8f99', '#c8991e', '#0e0d0b', '#7a7368'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBills: 0,
    totalRevenue: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingServices: 0,
  });
  const [complaintsByCategory, setComplaintsByCategory] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [users, bills, _complaints, services, payments, recentComps, recentServs, recentBls] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bills').select('id', { count: 'exact', head: true }),
        supabase.from('complaints').select('*, profiles!complaints_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('service_applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('complaints').select('*, profiles!complaints_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('service_applications').select('*, profiles!service_applications_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('bills').select('*, profiles!bills_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRev = (payments.data as any[] || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
      // Fetch all complaints for categorization
      const { data: allComplaints } = await supabase.from('complaints').select('category, status');
      const resolved = (allComplaints as any[] || []).filter(c => (c as any).status === 'resolved').length;

      setStats({
        totalUsers: users.count || 0,
        totalBills: bills.count || 0,
        totalRevenue: totalRev,
        totalComplaints: (allComplaints as any[] || []).length,
        resolvedComplaints: resolved,
        pendingServices: services.count || 0,
      });

      setRecentComplaints(recentComps.data || []);
      setRecentServices(recentServs.data || []);
      setRecentBills(recentBls.data || []);

      // Process Categories
      const categories: Record<string, number> = {};
      (allComplaints as any[] || []).forEach(c => {
        const cat = (c as any).category;
        categories[cat] = (categories[cat] || 0) + 1;
      });
      setComplaintsByCategory(Object.entries(categories).map(([name, value]) => ({ name, value })));

      // Mock Revenue Data for Chart
      setRevenueData([
        { name: 'Jan', value: 45000 },
        { name: 'Feb', value: 52000 },
        { name: 'Mar', value: totalRev || 61000 },
      ]);

    } catch (error) {
      console.error('Admin Load Error:', error);
      toast.error('Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      await generateAdminReport();
      toast.success('Admin report generated!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted': return '#cc5500';
      case 'acknowledged': return '#0e5e65';
      case 'in_progress': return '#2563eb';
      case 'resolved': return '#16a34a';
      case 'closed': return '#4b5563';
      case 'escalated': return '#dc2626';
      default: return '#7a7368';
    }
  };

  if (loading) return <KioskLayout><div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc5500]"></div></div></KioskLayout>;

  return (
    <KioskLayout>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">Command Center</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Smart Janseva System Oversight & Analytics</p>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={generatingReport}
            className="px-6 py-3 bg-[#0e0d0b] text-white rounded-[16px] text-[0.8rem] font-black hover:opacity-90 shadow-xl transition-all"
          >
            {generatingReport ? '⌛ Generating...' : '📤 System Audit Report'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="💰" color="#cc5500" />
          <StatCard label="Active Citizens" value={stats.totalUsers.toString()} icon="👥" color="#1b8f99" />
          <StatCard label="Resolution Rate" value={`${stats.totalComplaints ? Math.round((stats.resolvedComplaints/stats.totalComplaints)*100) : 0}%`} icon="✅" color="#16a34a" />
          <StatCard label="Pending Apps" value={stats.pendingServices.toString()} icon="📄" color="#c8991e" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-8 bg-white rounded-[32px] border p-8" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
            <h3 className="text-[1rem] font-black mb-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#cc5500]" /> Revenue Projection
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cc5500" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#cc5500" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#cc5500" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Chart */}
          <div className="lg:col-span-4 bg-white rounded-[32px] border p-8" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
            <h3 className="text-[1rem] font-black mb-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1b8f99]" /> Departmental Grievances
            </h3>
            <div className="h-[280px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintsByCategory}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complaintsByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[1.5rem] font-black">{stats.totalComplaints}</div>
                <div className="text-[0.6rem] font-bold text-[#7a7368] uppercase">Total Cases</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Tables Layer 1: Complaints & Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Complaints Table */}
          <div className="bg-white rounded-[32px] border overflow-hidden" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
              <h3 className="text-[1rem] font-black">Recent Complaints</h3>
              <button className="text-[0.7rem] font-bold text-[#cc5500] hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead>
                  <tr className="bg-[#fafaf9] text-[0.6rem] font-black uppercase text-[#7a7368] tracking-widest border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                    <th className="px-6 py-4">Citizen</th>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.slice(0, 4).map((c) => (
                    <tr key={c.id} className="border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                      <td className="px-6 py-4 text-[0.8rem] font-bold text-[#0e0d0b]">{c.profiles?.full_name || 'Anonymous'}</td>
                      <td className="px-6 py-4 text-[0.8rem] font-semibold text-[#7a7368] truncate max-w-[150px]">{c.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full" style={{ background: getStatusColor(c.status) }} />
                           <span className="text-[0.6rem] font-black uppercase text-[#0e0d0b]">{c.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentComplaints.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-[#7a7368] font-bold text-[0.85rem]">No complaints recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Services Table */}
          <div className="bg-white rounded-[32px] border overflow-hidden" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
              <h3 className="text-[1rem] font-black">Recent Services</h3>
              <button className="text-[0.7rem] font-bold text-[#cc5500] hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead>
                  <tr className="bg-[#fafaf9] text-[0.6rem] font-black uppercase text-[#7a7368] tracking-widest border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                    <th className="px-6 py-4">Citizen</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentServices.slice(0, 4).map((s) => (
                    <tr key={s.id} className="border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                      <td className="px-6 py-4 text-[0.8rem] font-bold text-[#0e0d0b]">{s.profiles?.full_name || 'Anonymous'}</td>
                      <td className="px-6 py-4 text-[0.8rem] font-semibold text-[#7a7368] truncate max-w-[150px]">{s.service_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full" style={{ background: getStatusColor(s.status) }} />
                           <span className="text-[0.6rem] font-black uppercase text-[#0e0d0b]">{s.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentServices.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-[#7a7368] font-bold text-[0.85rem]">No service requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Bills Table Layer 2 */}
        <div className="bg-white rounded-[32px] border overflow-hidden mb-10" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
            <h3 className="text-[1rem] font-black flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#cc5500]" /> Recent Bills Generated
            </h3>
            <span className="text-[0.65rem] font-bold text-[#7a7368] bg-[#fafaf9] px-3 py-1 rounded-full">Automated</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#fafaf9] text-[0.6rem] font-black uppercase text-[#7a7368] tracking-widest border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                  <th className="px-8 py-4">Citizen</th>
                  <th className="px-8 py-4">Bill ID</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b: any) => (
                  <tr key={b.id} className="border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                    <td className="px-8 py-4 text-[0.85rem] font-bold text-[#0e0d0b]">{b.profiles?.full_name || 'Citizen'}</td>
                    <td className="px-8 py-4 text-[0.7rem] font-mono font-bold text-[#7a7368]">{b.bill_number || 'N/A'}</td>
                    <td className="px-8 py-4 text-[0.9rem] font-black text-[#cc5500]">₹{b.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-0.5 rounded text-[0.6rem] font-black uppercase"
                        style={{ background: b.status === 'paid' ? '#dcfce7' : '#fee2e2', color: b.status === 'paid' ? '#166534' : '#991b1b' }}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-[0.75rem] font-bold text-[#7a7368]">{new Date(b.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                  </tr>
                ))}
                {recentBills.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-[#7a7368] font-bold text-[0.85rem]">No bills recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </KioskLayout>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-[28px] border p-6 flex flex-col gap-1 transition-all hover:translate-y-[-4px]" 
         style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="h-1.5 w-6 rounded-full" style={{ background: color }} />
      </div>
      <div className="text-[1.6rem] font-black text-[#0e0d0b] tracking-tight">{value}</div>
      <div className="text-[0.7rem] font-bold text-[#7a7368] uppercase tracking-wider">{label}</div>
    </div>
  );
}
