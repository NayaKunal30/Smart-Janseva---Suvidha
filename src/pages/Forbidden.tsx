import { useNavigate } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <KioskLayout>
      <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
        <div className="mb-8 relative">
          <div className="text-[8rem] font-black opacity-[0.05] absolute inset-0 -top-8 select-none">403</div>
          <div className="text-7xl relative z-10">🛡️</div>
        </div>
        
        <h1 className="text-[2.2rem] font-black text-[#0e0d0b] mb-4">Access Restricted</h1>
        <p className="max-w-md text-[0.95rem] font-bold text-[#7a7368] leading-relaxed mb-10">
          This sector requires official clearance. You do not have the necessary permissions to view this administrative page.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-10 py-4 rounded-[20px] bg-[#0e0d0b] text-white text-[1rem] font-black hover:opacity-90 shadow-2xl shadow-black/20 transition-all active:scale-95"
        >
          Return to Safe Zone
        </button>

        <div className="mt-16 p-4 rounded-2xl bg-orange-50 border border-orange-100 max-w-sm">
          <p className="text-[0.65rem] font-black text-[#cc5500] uppercase tracking-widest mb-1">Security Protocol</p>
          <p className="text-[0.7rem] font-bold text-[#a14400]">If you believe this is an error, please contact your department administrator immediately.</p>
        </div>
      </div>
    </KioskLayout>
  );
}
