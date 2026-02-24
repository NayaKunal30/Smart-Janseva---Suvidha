import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getDashboardStats, 
  getPendingBills, 
  getUserComplaints, 
  getActiveAnnouncements,
  getUserServiceApplications 
} from '@/db/api';
import { generateUserReport } from '@/db/reportGenerator';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ totalBills: 0, totalPayments: 0, totalComplaints: 0, totalServices: 0 });
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [statsData, billsData, complaintsData, announcementsData, appsData] = await Promise.all([
        getDashboardStats(user!.id),
        getPendingBills(user!.id),
        getUserComplaints(user!.id, 3),
        getActiveAnnouncements(),
        getUserServiceApplications(user!.id, 3)
      ]);
      
      setStats(statsData);
      setPendingBills(billsData.slice(0, 3));
      setRecentComplaints(complaintsData);
      setRecentApplications(appsData);
      setAnnouncements(announcementsData.slice(0, 2));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleDeleteComplaint = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm('Delete this complaint?')) return;
    try {
      const { error, count } = await supabase.from('complaints').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error('Not permitted');
      toast.success('Complaint deleted');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleDeleteService = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm('Delete this service request?')) return;
    try {
      const { error, count } = await supabase.from('service_applications').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error('Not permitted');
      toast.success('Request deleted');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleDownloadReport = async () => {
    if (!user) return;
    setGeneratingReport(true);
    toast.info('Generating your detailed report...');
    try {
      await generateUserReport(user.id);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'submitted': return { background: 'rgba(204,85,0,.1)', color: '#cc5500' };
      case 'acknowledged':
      case 'under_review': return { background: 'rgba(14,94,101,.1)', color: '#0e5e65' };
      case 'in_progress': return { background: 'rgba(59,130,246,.1)', color: '#2563eb' };
      case 'resolved':
      case 'paid':
      case 'approved': return { background: 'rgba(34,197,94,.1)', color: '#16a34a' };
      case 'closed':
      case 'completed': return { background: 'rgba(107,114,128,.1)', color: '#4b5563' };
      case 'escalated':
      case 'rejected': return { background: 'rgba(220,38,38,.1)', color: '#dc2626' };
      default: return { background: 'rgba(107,114,128,.1)', color: '#4b5563' };
    }
  };

  return (
    <KioskLayout>
      <div className="grid grid-cols-12 gap-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Left Column: Stats and Quick Actions */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          
          {/* Welcome Section */}
          <div 
            className="rounded-[16px] border p-4 transition-all flex-shrink-0 flex items-center justify-between"
            style={{
              borderColor: 'rgba(14,13,11,.09)',
              background: 'white',
              boxShadow: '0 2px 8px rgba(14,13,11,.05)',
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #cc5500, #ff8c00)', color: 'white' }}
              >
                {((profile as any)?.full_name as string)?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-[1.1rem] font-extrabold text-[#0e0d0b]">Welcome, {((profile as any)?.full_name as string) || 'Citizen'}</h2>
                <p className="text-[0.75rem] font-semibold text-[#7a7368]">Member since {new Date(((profile as any)?.created_at as string) || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={handleDownloadReport}
              disabled={generatingReport}
              className="px-4 py-2 rounded-[10px] bg-[#0e0d0b] text-white text-[0.7rem] font-extrabold hover:opacity-90 transition-all flex items-center gap-2"
            >
              {generatingReport ? '⏳ Generating...' : '📊 Get Activity Report'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 flex-shrink-0">
            {[
              { label: 'Total Bills', value: stats.totalBills, color: '#cc5500', icon: '📄' },
              { label: 'Payments', value: stats.totalPayments, color: '#16a34a', icon: '💳' },
              { label: 'Complaints', value: stats.totalComplaints, color: '#2563eb', icon: '📝' },
              { label: 'Services', value: stats.totalServices, color: '#8b5cf6', icon: '🏛️' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="rounded-[16px] border p-3 bg-white"
                style={{ borderColor: 'rgba(14,13,11,.09)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-[0.65rem] font-bold text-[#7a7368] uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-[1.3rem] font-black text-[#0e0d0b]">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Main Content Sections */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 flex-grow min-h-0">
            
            {/* Pending Bills */}
            <div 
              className="rounded-[20px] border bg-white flex flex-col overflow-hidden"
              style={{ borderColor: 'rgba(14,13,11,.09)' }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                <h3 className="text-[0.85rem] font-extrabold text-[#0e0d0b] flex items-center gap-2">
                  <span className="text-orange-500">⏳</span> Pending Bills
                </h3>
                <Link to="/bills" className="text-[0.65rem] font-bold text-[#cc5500] hover:underline">View All</Link>
              </div>
              <div className="flex-grow p-3 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
                {pendingBills.length > 0 ? (
                  pendingBills.map((bill) => (
                    <div key={bill.id} className="p-3 rounded-[12px] bg-[#fdfaf5] border border-[#f5f1ea] flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-[0.75rem] font-extrabold text-[#0e0d0b] truncate">{bill.utility_services?.service_name}</div>
                        <div className="text-[0.6rem] font-semibold text-[#7a7368]">Due: {new Date(bill.due_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[0.85rem] font-black text-[#0e0d0b]">₹{bill.amount}</div>
                        <Link to={`/bills/${bill.id}`} className="text-[0.55rem] font-bold text-[#cc5500]">Pay Now</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 py-8">
                    <span className="text-2xl mb-2">🎉</span>
                    <p className="text-[0.7rem] font-bold">No pending bills</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Complaints */}
            <div 
              className="rounded-[20px] border bg-white flex flex-col overflow-hidden"
              style={{ borderColor: 'rgba(14,13,11,.09)' }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                <h3 className="text-[0.85rem] font-extrabold text-[#0e0d0b] flex items-center gap-2">
                  <span className="text-blue-500">📝</span> Recent Complaints
                </h3>
                <Link to="/complaints" className="text-[0.65rem] font-bold text-[#2563eb] hover:underline">View All</Link>
              </div>
              <div className="p-3 flex flex-col gap-2 overflow-y-auto scrollbar-hide max-h-[160px]">
                {recentComplaints.length > 0 ? (
                  recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="p-3 rounded-[12px] bg-[#f8faff] border border-[#eff4ff] flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="text-[0.75rem] font-extrabold text-[#0e0d0b] truncate">{complaint.title}</div>
                        <div className="text-[0.6rem] font-semibold text-[#7a7368] truncate">{complaint.category} • {new Date(complaint.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="px-2 py-0.5 rounded text-[0.5rem] font-black uppercase flex-shrink-0"
                          style={getStatusStyle(complaint.status)}
                        >
                          {complaint.status}
                        </div>
                        <button 
                          onClick={(e) => handleDeleteComplaint(e, complaint.id)}
                          className="p-1 text-red-400 hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 py-4">
                    <p className="text-[0.7rem] font-bold">No complaints filed</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Services Applications */}
            <div 
              className="rounded-[20px] border bg-white flex flex-col overflow-hidden md:col-span-2"
              style={{ borderColor: 'rgba(14,13,11,.09)' }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                <h3 className="text-[0.85rem] font-extrabold text-[#0e0d0b] flex items-center gap-2">
                  <span className="text-purple-500">🏛️</span> Digital Requests
                </h3>
                <Link to="/services" className="text-[0.65rem] font-bold text-[#8b5cf6] hover:underline">Apply New</Link>
              </div>
              <div className="p-3 flex flex-col gap-2 overflow-y-auto scrollbar-hide max-h-[160px]">
                {recentApplications.length > 0 ? (
                  recentApplications.map((app) => (
                    <div key={app.id} className="p-3 rounded-[12px] bg-[#faf5ff] border border-[#f3e8ff] flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="text-[0.75rem] font-extrabold text-[#0e0d0b] truncate">{app.service_name}</div>
                        <div className="text-[0.6rem] font-semibold text-[#7a7368] truncate">#{app.application_number} • {new Date(app.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="px-2 py-0.5 rounded text-[0.5rem] font-black uppercase flex-shrink-0"
                          style={getStatusStyle(app.status)}
                        >
                          {app.status}
                        </div>
                        <button 
                          onClick={(e) => handleDeleteService(e, app.id)}
                          className="p-1 text-red-400 hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 py-4">
                    <p className="text-[0.7rem] font-bold">No active requests</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Quick Actions & Announcements */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Announcements Card */}
          <div 
            className="rounded-[24px] border bg-white flex flex-col overflow-hidden h-[45%]"
            style={{ borderColor: 'rgba(14,13,11,.09)' }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
              <h3 className="text-[0.85rem] font-extrabold text-[#0e0d0b] flex items-center gap-2">
                <span className="text-yellow-500">📢</span> Announcements
              </h3>
            </div>
            <div className="flex-grow p-3 flex flex-col gap-3 overflow-y-auto scrollbar-hide">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-3 rounded-[12px] bg-[#fffcf0] border border-[#fdf8e6]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.55rem] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">{ann.type}</span>
                      <span className="text-[0.55rem] font-bold text-[#7a7368]">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[0.7rem] font-extrabold text-[#0e0d0b] mb-1">{ann.title}</div>
                    <p className="text-[0.65rem] font-medium text-[#7a7368] line-clamp-2">{ann.content}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <p className="text-[0.7rem] font-bold">No new announcements</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Services Link Cards */}
          <div className="flex-grow flex flex-col gap-3">
             <Link 
              to="/services" 
              className="flex-1 rounded-[24px] overflow-hidden relative group p-5 border flex flex-col justify-end"
              style={{ background: 'linear-gradient(135deg, #cc5500, #ff8c00)', borderColor: 'rgba(255,255,255,.2)' }}
             >
               <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:scale-110 transition-transform">🏛️</div>
               <div className="relative text-white">
                 <div className="text-[0.9rem] font-black leading-tight">Apply for<br/>New Services</div>
                 <div className="text-[0.65rem] font-bold opacity-80 mt-1">Water, Electricity, Ration & more</div>
               </div>
             </Link>

             <Link 
              to="/complaints/new" 
              className="flex-1 rounded-[24px] overflow-hidden relative group p-5 border flex flex-col justify-end"
              style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderColor: 'rgba(255,255,255,.2)' }}
             >
               <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:scale-110 transition-transform">⚖️</div>
               <div className="relative text-white">
                 <div className="text-[0.9rem] font-black leading-tight">Grievance<br/>Redressal</div>
                 <div className="text-[0.65rem] font-bold opacity-80 mt-1">Report issues in your locality</div>
               </div>
             </Link>
          </div>

        </div>
      </div>
    </KioskLayout>
  );
}
