import { useNavigate } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <KioskLayout>
      <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
        <div className="mb-8 relative">
          <div className="text-[10rem] font-black opacity-[0.03] absolute inset-0 -top-12 select-none">404</div>
          <div className="text-7xl relative z-10">🧭</div>
        </div>
        
        <h1 className="text-[2.2rem] font-black text-[#0e0d0b] mb-4">Page Lost in Transition</h1>
        <p className="max-w-md text-[0.95rem] font-bold text-[#7a7368] leading-relaxed mb-10">
          The governance portal could not locate this specific endpoint. It may have been relocated or digitized under a different reference.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-[20px] border-2 border-[#0e0d0b] text-[#0e0d0b] text-[0.9rem] font-black hover:bg-[#fafafc] transition-all"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-4 rounded-[20px] bg-[#0e0d0b] text-white text-[0.9rem] font-black hover:opacity-90 shadow-2xl shadow-black/20 transition-all"
          >
            Dashboard
          </button>
        </div>

        <div className="mt-16 flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-[#cc5500] animate-pulse" />
           <span className="text-[0.65rem] font-black text-[#7a7368] uppercase tracking-[0.2em]">System Status: Operational</span>
        </div>
      </div>
    </KioskLayout>
  );
}
