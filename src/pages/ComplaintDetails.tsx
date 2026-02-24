import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('complaints')
        .select('*')
        .eq('id', id)
        .maybeSingle() as any);

      if (error) throw error;
      if (!data) {
        toast.error('Grievance record not found');
        navigate('/complaints');
        return;
      }
      setComplaint(data);
    } catch (error: any) {
      console.error('Error loading complaint:', error);
      toast.error('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved': return { bg: 'bg-[#16a34a]', text: 'text-white', label: 'Completed' };
      case 'in_progress': return { bg: 'bg-[#c8991e]', text: 'text-white', label: 'Processing' };
      case 'escalated': return { bg: 'bg-[#dc2626]', text: 'text-white', label: 'Urgent' };
      default: return { bg: 'bg-[#f5f1ea]', text: 'text-[#7a7368]', label: 'Pending' };
    }
  };

  if (loading) return <KioskLayout><div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></KioskLayout>;

  const style = getStatusStyle(complaint.status);

  return (
    <KioskLayout>
      <div className="max-w-3xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/complaints')}
            className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-xl hover:bg-[#fafaf9] transition-all shadow-sm"
            style={{ borderColor: 'rgba(14,13,11,.09)' }}
          >
            ←
          </button>
          <div>
            <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">Case Details</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Tracking Reference: {complaint.complaint_number}</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border overflow-hidden p-10 space-y-8"
              style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          
          <div className="flex items-center justify-between">
            <div className="px-5 py-2 rounded-2xl bg-orange-50 text-[#cc5500] text-[0.7rem] font-black uppercase tracking-wider">
              {complaint.category}
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-tight ${style.bg} ${style.text}`}>
              {style.label}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-[1.5rem] font-black text-[#0e0d0b] leading-tight">{complaint.title}</h2>
            <p className="text-[0.7rem] font-bold text-[#7a7368]">Filed on {new Date(complaint.created_at).toLocaleDateString()} at {complaint.location || 'Reported Location'}</p>
          </div>

          <div className="p-6 bg-[#fafaf9] rounded-3xl border border-[#0e0d0b]/05">
            <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] mb-3">Citizens Narrative</h4>
            <div className="text-[0.95rem] font-bold text-[#0e0d0b] leading-relaxed opacity-90">
              {complaint.description}
            </div>
          </div>

          {complaint.resolution_notes && (
            <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100/50">
              <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-blue-600 mb-3">Officials Resolution Remarks</h4>
              <div className="text-[0.95rem] font-bold text-[#0e0d0b] leading-relaxed">
                {complaint.resolution_notes}
              </div>
              <div className="mt-4 text-[0.7rem] font-bold text-blue-500 italic">
                Resolved on {new Date(complaint.resolved_at || complaint.updated_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {!complaint.resolution_notes && (
            <div className="flex items-center gap-4 p-5 rounded-3xl border border-dashed border-[#d1d0cf]">
              <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-xl">⏳</div>
              <div>
                <h4 className="text-[0.8rem] font-black text-[#0e0d0b]">Under Preliminary Review</h4>
                <p className="text-[0.7rem] font-semibold text-[#7a7368]">Our officers are currently validating the details of your grievance.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </KioskLayout>
  );
}
