import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { getServiceTypes } from '@/db/api';
import { toast } from 'sonner';

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getServiceTypes();
      setServices(data.length > 0 ? data : [
        { id: '1', name: 'Water Connection', description: 'Apply for new water connection or change existing one', icon: '🚰' },
        { id: '2', name: 'Electricity Connection', description: 'New power line or meter replacement services', icon: '⚡' },
        { id: '3', name: 'Ration Card', description: 'Apply for new or renew your food security card', icon: '🌾' },
        { id: '4', name: 'Property Tax', description: 'Self-assessment and property documentation', icon: '🏠' },
        { id: '5', name: 'Birth Certificate', description: 'Registration and issuance of birth records', icon: '👶' },
        { id: '6', name: 'Death Certificate', description: 'Official registration of death records', icon: '🕊️' },
      ]);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#0e0d0b]">E-Governance Services</h1>
          <p className="text-[0.8rem] font-semibold text-[#7a7368]">Select a service to start your digital application</p>
        </div>

        {/* Services Grid */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cc5500]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Link 
                  key={service.id}
                  to={`/services/${service.id}/apply`}
                  className="group rounded-[28px] border bg-white p-6 transition-all hover:bg-[#fafafc] hover:border-[#cc5500] hover:shadow-xl hover:shadow-orange-500/5 flex flex-col items-start gap-4"
                  style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 2px 8px rgba(14,13,11,.03)' }}
                >
                  <div className="h-14 w-14 rounded-[20px] bg-[#f8faff] border border-[#eff4ff] flex items-center justify-center text-3xl group-hover:bg-[#cc5500] group-hover:text-white transition-all transform group-hover:scale-110">
                    {service.name.toLowerCase().includes('water') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    ) : service.name.toLowerCase().includes('electric') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    ) : service.name.toLowerCase().includes('ration') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>
                    ) : service.name.toLowerCase().includes('tax') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    ) : service.name.toLowerCase().includes('birth') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    ) : service.name.toLowerCase().includes('death') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[1.1rem] font-extrabold text-[#0e0d0b] group-hover:text-[#cc5500] transition-colors">{service.name}</h3>
                    <p className="text-[0.75rem] font-semibold text-[#7a7368] mt-1 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <div className="mt-2 text-[0.7rem] font-black uppercase tracking-widest text-[#cc5500] flex items-center gap-1 group-hover:gap-2 transition-all">
                    Start Application <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </KioskLayout>
  );
}
