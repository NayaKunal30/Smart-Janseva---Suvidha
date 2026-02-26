import KioskLayout from '@/components/layouts/KioskLayout';

export default function Accessibility() {
  return (
    <KioskLayout title="Accessibility Statement">
      <div className="h-full overflow-y-auto pr-4 scrollbar-hide animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-white rounded-[32px] border p-10 mb-8" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-2xl">
              ♿
            </div>
            <div>
              <h2 className="text-[1.4rem] font-bold text-[#0e0d0b]">Our Commitment</h2>
              <p className="text-[0.85rem] font-semibold text-[#7a7368]">Smart Janseva Suvidha Portal</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[0.95rem] font-semibold text-[#0e0d0b] leading-relaxed">
              Smart Janseva is committed to providing a portal that is accessible to the widest possible audience, regardless of technology or ability. 
              We are actively working to increase the accessibility and usability of our portal and in doing so adhere to many of the available standards and guidelines.
            </p>

            <div className="p-6 rounded-[22px] bg-[#f5f1ea] border border-black/5">
              <h3 className="text-[1rem] font-black text-[#0e0d0b] mb-3">Compliance Status</h3>
              <p className="text-[0.85rem] font-bold text-[#7a7368] leading-relaxed">
                This website is designed to conform to the <strong className="text-[#cc5500]">Guidelines for Indian Government Websites (GIGW)</strong> and 
                <strong className="text-[#cc5500]">W3C Web Content Accessibility Guidelines (WCAG) 2.1</strong> at Level AA.
              </p>
            </div>

            <div>
              <h3 className="text-[1.1rem] font-black text-[#0e0d0b] mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1b8f99]" />
                Accessibility Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Skip Link', desc: 'Keyboard users can bypass repetitive navigation using the universal access icon.' },
                  { title: 'Screen Reader', desc: 'Specialized mode for audio descriptions and voice navigation management.' },
                  { title: 'High Contrast', desc: 'Enhanced color tokens for users with visual acuity requirements.' },
                  { title: 'Senior Mode', desc: 'Enlarged interface, 15-minute persistent sessions, and simplified controls.' }
                ].map((f) => (
                  <div key={f.title} className="p-5 rounded-[22px] border border-black/[0.06] bg-white transition-all hover:translate-y-[-2px]">
                    <div className="text-[0.9rem] font-black text-[#0e0d0b] mb-1">{f.title}</div>
                    <div className="text-[0.75rem] font-bold text-[#7a7368] leading-snug">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-6 bg-orange-50 rounded-[22px] border border-orange-100 flex items-center gap-4">
              <span className="text-2xl">🆘</span>
              <p className="text-[0.8rem] font-bold text-orange-900 leading-relaxed">
                If you encounter any accessibility barriers on this site, please report them to our digital helpdesk. We strive to respond within 24 hours.
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-20" /> {/* Spacer */}
      </div>
    </KioskLayout>
  );
}
