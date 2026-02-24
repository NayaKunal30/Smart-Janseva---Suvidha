import KioskLayout from '@/components/layouts/KioskLayout';

export default function Home() {

  return (
    <KioskLayout>
      <div className="grid min-h-0 grid-cols-2 gap-4">
        {/* Certificates & Documents */}
        <div
          className="group relative overflow-hidden rounded-[20px] border p-6 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 2px 8px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(204,85,0,.08),rgba(200,153,30,.1))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[0.95rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Certificates & Documents
              </div>
              <div className="mt-1 text-[0.75rem] font-semibold" style={{ color: '#7a7368' }}>
                Income, Caste, Domicile & more
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(204,85,0,.1)' }}
            >
              <span className="text-xl">📄</span>
            </div>
          </div>
        </div>

        {/* Utility Bill Payments */}
        <div
          className="group relative overflow-hidden rounded-[20px] border p-6 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 2px 8px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(14,94,101,.08),rgba(27,143,153,.1))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[0.95rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Utility Bill Payments
              </div>
              <div className="mt-1 text-[0.75rem] font-semibold" style={{ color: '#7a7368' }}>
                Electricity, Water & Gas Bills
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(14,94,101,.1)' }}
            >
              <span className="text-xl">💡</span>
            </div>
          </div>
        </div>

        {/* Grievance Redressal */}
        <div
          className="group relative overflow-hidden rounded-[20px] border p-6 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 2px 8px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(204,85,0,.08),rgba(200,153,30,.1))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[0.95rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Grievance Redressal
              </div>
              <div className="mt-1 text-[0.75rem] font-semibold" style={{ color: '#7a7368' }}>
                File and Track Complaints
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(204,85,0,.1)' }}
            >
              <span className="text-xl">📢</span>
            </div>
          </div>
        </div>

        {/* Land & Property Services */}
        <div
          className="group relative overflow-hidden rounded-[20px] border p-6 transition-all"
          style={{
            borderColor: 'rgba(14,13,11,.09)',
            background: 'white',
            boxShadow: '0 2px 8px rgba(14,13,11,.05)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(145deg,rgba(168,120,32,.08),rgba(200,153,30,.1))',
            }}
          />
          <div className="relative z-[1] flex items-start justify-between">
            <div>
              <div className="text-[0.95rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                Land & Property Services
              </div>
              <div className="mt-1 text-[0.75rem] font-semibold" style={{ color: '#7a7368' }}>
                Property Tax & Land Records
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'rgba(168,120,32,.1)' }}
            >
              <span className="text-xl">🏠</span>
            </div>
          </div>
        </div>

      </div>
    </KioskLayout>
  );
}
