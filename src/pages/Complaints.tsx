import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getUserComplaints } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadComplaints();
  }, [user]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await getUserComplaints(user!.id);
      setComplaints(data);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
      const { error, count } = await supabase.from('complaints').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error('Not permitted or already deleted');
      toast.success('Complaint deleted successfully');
      loadComplaints();
    } catch (error: any) {
      console.error('Error deleting complaint:', error);
      toast.error(error.message || 'Failed to delete complaint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return { bg: '#fef3c7', text: '#92400e', label: 'Pending' };
      case 'in_progress': return { bg: '#dbeafe', text: '#1e40af', label: 'In Progress' };
      case 'resolved': return { bg: '#dcfce7', text: '#166534', label: 'Resolved' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' };
      default: return { bg: '#f3f4f6', text: '#374151', label: status };
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#0e0d0b]">Grievance Redressal</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Track and manage your complaints</p>
          </div>
          <Link 
            to="/complaints/new"
            className="px-6 py-2.5 rounded-[12px] bg-[#cc5500] text-white text-[0.8rem] font-black hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <span>➕</span> File New Complaint
          </Link>
        </div>

        {/* Complaints List */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cc5500]"></div>
            </div>
          ) : complaints.length > 0 ? (
            <div className="grid gap-4">
              {complaints.map((complaint) => {
                const status = getStatusColor(complaint.status);
                return (
                  <Link 
                    key={complaint.id}
                    to={`/complaints/${complaint.id}`}
                    className="group rounded-[20px] border bg-white p-4 transition-all hover:bg-[#fafafc] hover:border-[#cc5500]/30"
                    style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 2px 8px rgba(14,13,11,.05)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-[14px] bg-[#f8faff] border border-[#eff4ff] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          {complaint.category === 'Water' ? '🚰' : complaint.category === 'Electricity' ? '⚡' : '📝'}
                        </div>
                        <div>
                          <h3 className="text-[0.95rem] font-extrabold text-[#0e0d0b] group-hover:text-[#cc5500] transition-colors">
                            {complaint.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[0.65rem] font-bold text-[#7a7368]">{complaint.complaint_number}</span>
                            <span className="text-[0.65rem] text-[#d1d0cf]">•</span>
                            <span className="text-[0.65rem] font-bold text-[#7a7368]">{new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-wider"
                          style={{ backgroundColor: status.bg, color: status.text }}
                        >
                          {status.label}
                        </div>
                        <button 
                          onClick={(e) => handleDelete(e, complaint.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                          title="Delete Complaint"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[24px] border border-dashed border-[#d1d0cf]">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-[1rem] font-extrabold text-[#0e0d0b]">No complaints found</h3>
              <p className="text-[0.75rem] font-semibold text-[#7a7368] text-center max-w-[200px] mt-1">
                Everything seems to be working perfectly! 
                If you have an issue, click the button above.
              </p>
            </div>
          )}
        </div>
      </div>
    </KioskLayout>
  );
}
