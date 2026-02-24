import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import KioskLayout from '@/components/layouts/KioskLayout';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getComplaintCategories } from '@/db/api';

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    location: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getComplaintCategories();
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        // Fallback if DB is empty
        setCategories([
          { id: 'f1', name: 'Water Supply' },
          { id: 'f2', name: 'Electricity' },
          { id: 'f3', name: 'Roads & Potholes' },
          { id: 'f4', name: 'Sanitation' },
          { id: 'f5', name: 'Other' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Hardcoded fallback on error
      setCategories([
        { id: 'f1', name: 'Water Supply' },
        { id: 'f2', name: 'Electricity' },
        { id: 'f3', name: 'Roads & Potholes' },
        { id: 'f4', name: 'Sanitation' },
        { id: 'f5', name: 'Other' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await (supabase
        .from('complaints') as any)
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          location: formData.location || null,
          status: 'submitted',
          complaint_number: `CMP${Date.now()}${Math.floor(Math.random() * 1000)}`
        }]);

      if (insertError) throw insertError;

      toast.success('Complaint filed successfully! We will look into it.');
      navigate('/complaints');
    } catch (error: any) {
      console.error('Error filing complaint:', error);
      toast.error('Failed to file complaint: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskLayout>
      <div className="max-w-2xl mx-auto h-full flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/complaints')}
            className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-xl hover:bg-[#fafaf9] transition-all"
            style={{ borderColor: 'rgba(14,13,11,.09)' }}
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0e0d0b]">Submit Grievance</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Tell us about the issue you are facing</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border p-8 space-y-6 overflow-y-auto scrollbar-hide"
              style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368] ml-1">Issue Category*</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
                className="w-full h-12 rounded-[14px] border px-4 text-[0.85rem] font-bold bg-[#fafaf9] text-[#0e0d0b] focus:border-[#cc5500] focus:ring-1 focus:ring-[#cc5500] outline-none transition-all appearance-none"
                style={{ borderColor: 'rgba(14,13,11,.15)' }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368] ml-1">Priority Level</label>
              <div className="flex bg-[#fafaf9] rounded-[14px] border p-1" style={{ borderColor: 'rgba(14,13,11,.15)' }}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                    className={`flex-1 py-2 rounded-[11px] text-[0.7rem] font-black uppercase transition-all ${
                      formData.priority === p ? 'bg-[#0e0d0b] text-white' : 'text-[#7a7368] hover:bg-white/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368] ml-1">Short Title*</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Street light not working in Sector 4"
              required
              className="w-full h-12 rounded-[14px] border px-4 text-[0.85rem] font-bold bg-[#fafaf9] text-[#0e0d0b] focus:border-[#cc5500] outline-none transition-all"
              style={{ borderColor: 'rgba(14,13,11,.15)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368] ml-1">Detailed Description*</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide as much detail as possible..."
              required
              rows={4}
              className="w-full rounded-[14px] border p-4 text-[0.85rem] font-bold bg-[#fafaf9] text-[#0e0d0b] focus:border-[#cc5500] outline-none transition-all resize-none"
              style={{ borderColor: 'rgba(14,13,11,.15)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] font-black uppercase tracking-wider text-[#7a7368] ml-1">Precise Location (Address/Area)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter nearby landmark or area name"
                className="w-full h-12 rounded-[14px] border pl-10 pr-4 text-[0.85rem] font-bold bg-[#fafaf9] text-[#0e0d0b] focus:border-[#cc5500] outline-none transition-all"
                style={{ borderColor: 'rgba(14,13,11,.15)' }}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">📍</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-[18px] bg-[#cc5500] text-white text-[1rem] font-black hover:opacity-95 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? '🔐 Processing Submission...' : '🚀 Submit Official Grievance'}
            </button>
          </div>
        </form>

      </div>
    </KioskLayout>
  );
}
