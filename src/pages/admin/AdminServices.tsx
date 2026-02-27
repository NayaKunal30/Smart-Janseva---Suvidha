import { useEffect, useState } from 'react';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function AdminServices() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    status: '',
    review_notes: '',
  });

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      setFilteredApplications(applications.filter(a => 
        (a.application_number || '').toLowerCase().includes(q) || 
        (a.service_name || '').toLowerCase().includes(q)
      ));
    } else {
      setFilteredApplications(applications);
    }
  }, [searchTerm, applications]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('service_applications')
        .select('*, profiles!service_applications_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setApplications(data || []);
      setFilteredApplications(data || []);
    } catch (error: any) {
      console.error('Applications load error:', error);
      toast.error('Failed to load service applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedApp) return;
    setUpdating(true);
    try {
      const { error } = await (supabase
        .from('service_applications') as any)
        .update({
          status: updateData.status,
          review_notes: updateData.review_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast.success('Application status updated successfully');
      setShowModal(false);
      loadApplications();
    } catch (error: any) {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'bg-[#16a34a]', text: 'text-white', label: 'Approved' };
      case 'rejected': return { bg: 'bg-[#dc2626]', text: 'text-white', label: 'Rejected' };
      case 'under_review': return { bg: 'bg-[#c8991e]', text: 'text-white', label: 'Reviewing' };
      case 'completed': return { bg: 'bg-[#0369a1]', text: 'text-white', label: 'Completed' };
      default: return { bg: 'bg-[#f5f1ea]', text: 'text-[#7a7368]', label: 'Pending' };
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">E-Service Pipeline</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Review and approve citizen digital service applications</p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <input
              type="text"
              placeholder="Application # or Service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 rounded-[16px] border bg-white pl-12 pr-4 text-[0.85rem] font-bold outline-none focus:border-[#cc5500] transition-all"
              style={{ borderColor: 'rgba(14,13,11,.15)' }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">📑</span>
          </div>
        </div>

        {/* Applications Table */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide pb-10">
          <div className="bg-white rounded-[32px] border overflow-hidden" 
               style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafaf9] border-b" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Application #</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Service & Applicant</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368]">Status</th>
                  <th className="px-8 py-5 text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center text-[0.9rem] font-bold text-[#7a7368]">Syncing applications...</td></tr>
                ) : filteredApplications.map((a) => {
                  const style = getStatusStyle(a.status);
                  return (
                    <tr key={a.id} className="border-b transition-colors hover:bg-orange-50/10" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
                      <td className="px-8 py-6">
                        <div className="text-[0.75rem] font-black font-mono text-[#0e0d0b]">{a.application_number}</div>
                        <div className="text-[0.6rem] font-bold uppercase text-[#7a7368] mt-1">Submitted: {new Date(a.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[0.9rem] font-black text-[#0e0d0b]">{a.service_name}</div>
                        <div className="text-[0.7rem] font-semibold text-[#7a7368]">Applicant: {a.profiles?.full_name || 'Anonymous'}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-tight ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(a);
                            setUpdateData({ status: a.status, review_notes: a.review_notes || '' });
                            setShowModal(true);
                          }}
                          className="px-5 py-2 rounded-xl bg-[#0e0d0b] text-white text-[0.7rem] font-black hover:opacity-90 transition-all border border-[#0e0d0b] shadow-lg shadow-black/10"
                        >
                          Process Application
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Robust Custom Modal */}
        {showModal && selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-md rounded-[32px] overflow-y-auto max-h-[90vh] scrollbar-hide shadow-2xl flex flex-col p-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[1.3rem] font-black text-[#0e0d0b]">Application Review</h2>
                    <p className="text-[0.8rem] font-bold text-[#7a7368]">Vetting service request for {selectedApp.service_name}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="h-10 w-10 rounded-full border flex items-center justify-center text-xl">×</button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100">
                      <div className="text-[0.55rem] font-black uppercase text-[#cc5500] mb-1">Applicant Reference</div>
                      <div className="text-[0.75rem] font-black text-[#0e0d0b]">{selectedApp.profiles?.email}</div>
                    </div>
                    <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100">
                      <div className="text-[0.55rem] font-black uppercase text-[#0369a1] mb-1">Application ID</div>
                      <div className="text-[0.75rem] font-black text-[#0e0d0b]">{selectedApp.application_number}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368]">Approval Decision</label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                      className="w-full h-12 rounded-xl border bg-[#fafaf9] px-4 text-[0.85rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                    >
                      <option value="submitted">Under Review (Default)</option>
                      <option value="under_review">Vetting Documents</option>
                      <option value="approved">Approve Application</option>
                      <option value="rejected">Reject Application</option>
                      <option value="completed">Services Delivered</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368]">Official Internal Notes</label>
                    <textarea
                      value={updateData.review_notes}
                      onChange={(e) => setUpdateData({ ...updateData, review_notes: e.target.value })}
                      placeholder="Enter verification notes or reasons for rejection..."
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
                    {updating ? '💾 Recording Decision...' : '✅ Save Official Decision'}
                  </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </KioskLayout>
  );
}
