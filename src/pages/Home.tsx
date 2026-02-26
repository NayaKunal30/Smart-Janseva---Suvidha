import KioskLayout from '@/components/layouts/KioskLayout';

export default function Home() {

  return (
    <KioskLayout>
      <div className="grid min-h-0 grid-cols-2 gap-4">
        {/* Certificates & Documents */}
        <div
          className="group relative overflow-hidden rounded-[22px] border p-5 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 4px 12px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(204,85,0,.08),rgba(200,153,30,.11))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[1.05rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Certificates & Documents
              </div>
              <div className="mt-1 text-[0.84rem] font-semibold" style={{ color: '#7a7368' }}>
                Income, Caste, Domicile & more
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(204,85,0,.11)' }}
            >
              <span className="text-xl">📄</span>
            </div>
          </div>
        </div>

        {/* Utility Bill Payments */}
        <div
          className="group relative overflow-hidden rounded-[22px] border p-5 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 4px 12px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(14,94,101,.08),rgba(27,143,153,.11))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[1.05rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Utility Bill Payments
              </div>
              <div className="mt-1 text-[0.84rem] font-semibold" style={{ color: '#7a7368' }}>
                Electricity, Water & Gas Bills
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(14,94,101,.11)' }}
            >
              <span className="text-xl">💡</span>
            </div>
          </div>
        </div>

        {/* Grievance Redressal */}
        <div
          className="group relative overflow-hidden rounded-[22px] border p-5 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 4px 12px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(204,85,0,.08),rgba(200,153,30,.11))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[1.05rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Grievance Redressal
              </div>
              <div className="mt-1 text-[0.84rem] font-semibold" style={{ color: '#7a7368' }}>
                File and Track Complaints
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(204,85,0,.11)' }}
            >
              <span className="text-xl">📢</span>
            </div>
          </div>
        </div>

        {/* Land & Property Services */}
        <div
          className="group relative overflow-hidden rounded-[22px] border p-5 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 4px 12px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(168,120,32,.08),rgba(200,153,30,.11))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[1.05rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Land & Property Services
              </div>
              <div className="mt-1 text-[0.84rem] font-semibold" style={{ color: '#7a7368' }}>
                Property Tax & Land Records
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(168,120,32,.11)' }}
            >
              <span className="text-xl">🏠</span>
            </div>
          </div>
        </div>

      </div>

      {/* Marquee Ticker */}
      <div className="mt-3 overflow-hidden rounded-xl border border-black/5 bg-white/50 py-1.5 backdrop-blur-sm">
        <div className="flex animate-marquee whitespace-nowrap">
          <div className="flex shrink-0 items-center">
            <span className="px-4 text-[0.75rem] font-bold text-[#cc5500]">
              Welcome to Smart Janseva | Digital Empowerment, Simplified Governance.
            </span>
            <span className="px-4 text-[0.8rem] font-bold text-[#cc5500]">
              Welcome to Smart Janseva | Digital Empowerment, Simplified Governance.
            </span>
            <span className="px-4 text-[0.8rem] font-bold text-[#cc5500]">
              Welcome to Smart Janseva | Digital Empowerment, Simplified Governance.
            </span>
          </div>
          <div className="flex shrink-0 items-center">
            <span className="px-4 text-[0.8rem] font-bold text-[#cc5500]">
              Welcome to Smart Janseva | Digital Empowerment, Simplified Governance.
            </span>
            <span className="px-4 text-[0.8rem] font-bold text-[#cc5500]">
              Welcome to Smart Janseva | Digital Empowerment, Simplified Governance.
            </span>
            <span className="px-4 text-[0.8rem] font-bold text-[#cc5500]">
              Welcome to Smart Janseva | Digital Empowerment, Simplified Governance.
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </KioskLayout>
  );
}
