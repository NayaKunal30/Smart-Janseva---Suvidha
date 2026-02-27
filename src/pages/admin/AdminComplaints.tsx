import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution_notes: '',
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      setFilteredComplaints(complaints.filter(c => 
        (c.complaint_number || '').toLowerCase().includes(q) || 
        (c.title || '').toLowerCase().includes(q)
      ));
    } else {
      setFilteredComplaints(complaints);
    }
  }, [searchTerm, complaints]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('complaints')
        .select('*, profiles!complaints_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setComplaints(data || []);
      setFilteredComplaints(data || []);
    } catch (error: any) {
      console.error('Complaints load error:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedComplaint) return;
    setUpdating(true);
    try {
      const { error } = await (supabase
        .from('complaints') as any)
        .update({
          status: updateData.status,
          resolution_notes: updateData.resolution_notes,
          updated_at: new Date().toISOString(),
          resolved_at: updateData.status === 'resolved' ? new Date().toISOString() : selectedComplaint.resolved_at
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      toast.success('Complaint status updated');
      setShowModal(false);
      loadComplaints();
    } catch (error: any) {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('complaints').delete().eq('id', id);
      if (error) throw error;
      toast.success('Complaint deleted successfully');
      loadComplaints();
    } catch (error: any) {
      toast.error('Failed to delete complaint');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Submitted' };
      case 'acknowledged': return { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Acknowledged' };
      case 'in_progress': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' };
      case 'resolved': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' };
      case 'escalated': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Escalated' };
      case 'closed': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' };
      default: return { bg: 'bg-[#f5f1ea]', text: 'text-[#7a7368]', label: 'Pending' };
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">Grievance Records</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Monitor and resolve citizen complaints</p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <input
              type="text"
              placeholder="Case # or Keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 rounded-[16px] border bg-white pl-12 pr-4 text-[0.85rem] font-bold outline-none focus:border-[#cc5500] transition-all"
              style={{ borderColor: 'rgba(14,13,11,.15)' }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">📂</span>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide pb-10">
          <div className="bg-white rounded-[32px] border overflow-hidden" 
               style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafaf9] border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Reference</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Title & Citizen</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Status</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center text-[0.9rem] font-bold text-[#7a7368]">Syncing cases...</td></tr>
                ) : filteredComplaints.map((c) => {
                  const style = getStatusStyle(c.status);
                  return (
                    <tr key={c.id} className="border-b transition-colors hover:bg-orange-50/10" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                      <td className="px-8 py-6">
                        <div className="text-[0.75rem] font-black font-mono text-[#0e0d0b]">{c.complaint_number}</div>
                        <div className="text-[0.6rem] font-bold uppercase text-[#7a7368] mt-1">{c.category}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[0.9rem] font-black text-[#0e0d0b] line-clamp-1">{c.title}</div>
                        <div className="text-[0.7rem] font-semibold text-[#7a7368]">By: {c.profiles?.full_name || 'Anonymous'}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-tight ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setUpdateData({ status: c.status, resolution_notes: c.resolution_notes || '' });
                              setShowModal(true);
                            }}
                            className="px-5 py-2 rounded-xl bg-[#0e0d0b] text-white text-[0.7rem] font-black hover:opacity-90 transition-all border border-[#0e0d0b] shadow-lg shadow-black/10"
                          >
                            Review Case
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                            title="Delete Complaint"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Robust Custom Modal */}
        {showModal && selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-md rounded-[32px] overflow-y-auto max-h-[90vh] scrollbar-hide shadow-2xl flex flex-col p-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[1.3rem] font-black text-[#0e0d0b]">Case Review</h2>
                    <p className="text-[0.8rem] font-bold text-[#7a7368]">Update grievance resolution progress</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="h-10 w-10 rounded-full border flex items-center justify-center text-xl">×</button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <div className="text-[0.6rem] font-black uppercase text-[#64748b] mb-1">Citizen Narrative</div>
                    <div className="text-[0.85rem] font-bold text-[#1e293b] leading-relaxed">{selectedComplaint.description}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368]">Resolution Status</label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                      className="w-full h-12 rounded-xl border bg-[#fafaf9] px-4 text-[0.85rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368]">Officer Remarks</label>
                    <textarea
                      value={updateData.resolution_notes}
                      onChange={(e) => setUpdateData({ ...updateData, resolution_notes: e.target.value })}
                      placeholder="Enter details of resolution provided..."
                      rows={4}
                      className="w-full rounded-2xl border bg-[#fafaf9] p-4 text-[0.85rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="w-full py-4 rounded-2xl bg-[#0e0d0b] text-white text-[1rem] font-black hover:opacity-95 transition-all shadow-xl shadow-black/10 active:scale-[0.98]"
                  >
                    {updating ? '💾 Saving Records...' : '🚀 Finalize Case Update'}
                  </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </KioskLayout>
  );
}
