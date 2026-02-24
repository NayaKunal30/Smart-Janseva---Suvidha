import { Link } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';

export default function Sitemap() {
  const sections = [
    {
      title: 'Core Portals',
      links: [
        { name: 'Home / Landing', path: '/' },
        { name: 'Citizen Dashboard', path: '/dashboard' },
        { name: 'User Profile', path: '/profile' },
        { name: 'Notifications', path: '/notifications' },
      ]
    },
    {
      title: 'Citizen Services',
      links: [
        { name: 'Service Directory', path: '/services' },
        { name: 'Utility Bill Tracking', path: '/bills' },
        { name: 'Grievance Redressal', path: '/complaints' },
        { name: 'My Activity Reports', path: '/my-reports' },
      ]
    },
    {
      title: 'Administrator Tools',
      links: [
        { name: 'Command Center', path: '/admin' },
        { name: 'System Managed Users', path: '/admin/users' },
        { name: 'Broadcast Management', path: '/admin/announcements' },
      ]
    },
    {
      title: 'Legal & Info',
      links: [
        { name: 'Accessibility Statement', path: '/accessibility' },
        { name: 'Official Sitemap', path: '/sitemap' },
      ]
    }
  ];

  return (
    <KioskLayout title="Portal Sitemap">
      <div className="h-full overflow-y-auto pr-4 scrollbar-hide animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-[32px] border p-8 flex flex-col" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
              <h3 className="text-[1.1rem] font-black text-[#0e0d0b] mb-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#cc5500]" />
                {section.title}
              </h3>
              <div className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    className="group flex items-center justify-between p-4 rounded-[18px] bg-[#f5f1ea] border border-transparent hover:border-[#1b8f99] hover:bg-white transition-all shadow-sm"
                  >
                    <span className="text-[0.85rem] font-bold text-[#7a7368] group-hover:text-[#1b8f99] transition-colors">{link.name}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#cc5500] opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="h-20" />
      </div>
    </KioskLayout>
  );
}
