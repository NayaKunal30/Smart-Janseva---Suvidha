import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { useAuth } from '@/contexts/AuthContext';
import { generateUserReport } from '@/db/reportGenerator';
import { getDashboardStats } from '@/db/api';
import { toast } from 'sonner';

export default function MyReports() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ totalBills: 0, totalPayments: 0, totalComplaints: 0, totalServices: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats(user!.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      await generateUserReport(user.id);
      toast.success('Report generated and downloaded!');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const activityData = [
    { label: 'Bills Issued', value: stats.totalBills.toString(), icon: '📄', trend: 'Latest lifecycle' },
    { label: 'Payments', value: stats.totalPayments.toString(), icon: '💳', trend: 'Securely processed' },
    { label: 'Grievances', value: stats.totalComplaints.toString(), icon: '📝', trend: 'Tracked cases' },
    { label: 'Applications', value: stats.totalServices.toString(), icon: '🏛️', trend: 'Digital services' }
  ];

  if (loading) return <KioskLayout><div className="flex h-full items-center justify-center opacity-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></KioskLayout>;

  return (
    <KioskLayout>
      <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#0e0d0b]">My Activity Reports</h1>
          <p className="text-[0.8rem] font-semibold text-[#7a7368]">Review your platform engagement and download official statements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Main Download Card */}
          <div className="rounded-[32px] border bg-white p-8 group overflow-hidden relative"
               style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
            <div className="absolute top-0 right-0 p-8 text-6xl opacity-[0.03] group-hover:scale-110 transition-transform">📊</div>
            <h2 className="text-[1.2rem] font-black text-[#0e0d0b] mb-2">Annual Citizen Report</h2>
            <p className="text-[0.75rem] font-semibold text-[#7a7368] mb-8 leading-relaxed">
              Generate a comprehensive PDF statement of all your payments, applications, and grievances for legal or financial records.
            </p>
            <button
              onClick={handleDownload}
              disabled={generating}
              className="px-8 py-3.5 rounded-[16px] bg-[#0e0d0b] text-white text-[0.85rem] font-black hover:opacity-90 transition-all flex items-center justify-center gap-3 w-full shadow-xl shadow-black/10"
            >
              {generating ? '⌛ Working...' : '📥 Download Report (PDF)'}
            </button>
          </div>

          {/* Activity Grid */}
          <div className="grid grid-cols-2 gap-4">
            {activityData.map((item, i) => (
              <div key={i} className="rounded-[24px] border bg-white p-5" style={{ borderColor: 'rgba(14,13,11,.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#7a7368]">{item.label}</span>
                </div>
                <div className="text-[1.8rem] font-black text-[#0e0d0b] leading-none mb-1">{item.value}</div>
                <div className="text-[0.6rem] font-bold text-[#cc5500] bg-orange-50 px-2 py-0.5 rounded-full inline-block">
                  {item.trend}
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="rounded-[28px] border bg-[#f8faff] border-[#eff4ff] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">💡</div>
            <div>
              <h4 className="text-[0.85rem] font-extrabold text-[#0e0d0b]">Digital Transformation Fact</h4>
              <p className="text-[0.7rem] font-semibold text-[#7a7368]">Using this platform reduces government response time by up to 60% compared to physical visits.</p>
            </div>
          </div>
        </div>

      </div>
    </KioskLayout>
  );
}
