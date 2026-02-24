import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ServiceApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('service_types')
        .select('*')
        .eq('id', id)
        .maybeSingle() as any);

      if (error) throw error;
      if (!data) {
        toast.error('Service not found');
        navigate('/services');
        return;
      }
      setService(data);
    } catch (error: any) {
      console.error('Error loading service:', error);
      toast.error('Failed to load service details');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;

    setSubmitting(true);
    try {
      // Basic validation
      const fields = service.form_schema?.fields || [];
      for (const field of fields) {
        if (field.required && !formData[field.name]) {
          toast.error(`Please provide ${field.label}`);
          setSubmitting(false);
          return;
        }
      }

      const { error } = await (supabase
        .from('service_applications') as any)
        .insert([{
          user_id: user.id,
          service_type: service.name,
          service_name: service.name,
          form_data: formData,
          status: 'submitted',
          application_number: `APP${Date.now()}`
        }]);

      if (error) throw error;

      toast.success('Your application has been received!');
      navigate('/services');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <KioskLayout><div className="flex h-full items-center justify-center opacity-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div></KioskLayout>;

  return (
    <KioskLayout>
      <div className="max-w-3xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => navigate('/services')}
                className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-xl hover:bg-[#fafaf9] transition-all"
                style={{ borderColor: 'rgba(14,13,11,.09)' }}
              >
                ←
              </button>
              <h1 className="text-[1.8rem] font-black text-[#0e0d0b]">Service Application</h1>
            </div>
            <p className="text-[0.85rem] font-semibold text-[#7a7368] ml-14">Processing request for {service.name}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 border border-orange-100">
             <span className="text-sm">⏱️</span>
             <span className="text-[0.75rem] font-bold text-[#cc5500]">Est. {service.processing_time_days || 7} Days</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-y-auto pr-2 scrollbar-hide pb-20">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border p-8 space-y-6"
                  style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
              
              <div className="grid grid-cols-1 gap-8">
                {service.form_schema?.fields?.map((field: any) => (
                  <div key={field.name} className="space-y-3">
                    <label className="text-[0.65rem] font-black uppercase tracking-widest text-[#7a7368] ml-1">
                      {field.label} {field.required && <span className="text-orange-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full rounded-2xl border bg-[#fafaf9] p-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] resize-none"
                        rows={4}
                        placeholder={`Provide details for ${field.label.toLowerCase()}...`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500] appearance-none"
                      >
                         <option value="">Choose an option</option>
                         {field.options?.map((opt: string) => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="w-full h-14 rounded-2xl border bg-[#fafaf9] px-5 text-[0.9rem] font-bold outline-none border-[#0e0d0b]/10 focus:border-[#cc5500]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 rounded-2xl bg-[#0e0d0b] text-white text-[1rem] font-black hover:opacity-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {submitting ? '📦 Processing...' : '📤 Submit Application'}
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] border p-8" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
              <h3 className="text-[1rem] font-black text-[#0e0d0b] mb-4">Required Documents</h3>
              <ul className="space-y-4">
                {service.required_documents?.map((doc: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 h-4 w-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[0.6rem] text-blue-600 font-bold">✓</span>
                    <span className="text-[0.8rem] font-bold text-[#7a7368] leading-tight">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0e0d0b] rounded-[32px] p-8 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-[1rem] font-black mb-2">Notice</h3>
                 <p className="text-[0.75rem] font-medium opacity-70 leading-relaxed">
                   Please ensure all information provided is accurate as per your official government ID to avoid rejection.
                 </p>
               </div>
               <div className="absolute -bottom-4 -right-4 text-6xl opacity-10 rotate-12">🏛️</div>
            </div>
          </div>

        </div>
      </div>
    </KioskLayout>
  );
}
