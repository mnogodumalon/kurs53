import { useState } from 'react';
import { UebersichtTab } from '@/components/tabs/UebersichtTab';
import { KurseTab } from '@/components/tabs/KurseTab';
import { DozentenTab } from '@/components/tabs/DozentenTab';
import { TeilnehmerTab } from '@/components/tabs/TeilnehmerTab';
import { RaeumeTab } from '@/components/tabs/RaeumeTab';
import { AnmeldungenTab } from '@/components/tabs/AnmeldungenTab';
import { LayoutDashboard, GraduationCap, Users, BookOpen, DoorOpen, ClipboardList } from 'lucide-react';

type Tab = 'uebersicht' | 'kurse' | 'dozenten' | 'teilnehmer' | 'raeume' | 'anmeldungen';

const NAV = [
  { id: 'uebersicht' as Tab, label: 'Übersicht', icon: LayoutDashboard },
  { id: 'kurse' as Tab, label: 'Kurse', icon: GraduationCap },
  { id: 'anmeldungen' as Tab, label: 'Anmeldungen', icon: ClipboardList },
  { id: 'teilnehmer' as Tab, label: 'Teilnehmer', icon: Users },
  { id: 'dozenten' as Tab, label: 'Dozenten', icon: BookOpen },
  { id: 'raeume' as Tab, label: 'Räume', icon: DoorOpen },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('uebersicht');

  const renderTab = () => {
    switch (activeTab) {
      case 'uebersicht': return <UebersichtTab />;
      case 'kurse': return <KurseTab />;
      case 'dozenten': return <DozentenTab />;
      case 'teilnehmer': return <TeilnehmerTab />;
      case 'raeume': return <RaeumeTab />;
      case 'anmeldungen': return <AnmeldungenTab />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Logo area */}
        <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'hsl(0 0% 100%)' }}>KursManager</p>
              <p className="text-xs" style={{ color: 'hsl(245 20% 60%)' }}>Kursverwaltung</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <p className="text-xs" style={{ color: 'hsl(245 20% 55%)' }}>© 2026 KursManager</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center px-8 h-14 border-b"
          style={{ background: 'hsl(0 0% 100% / 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border)' }}
        >
          <h1 className="text-base font-semibold">
            {NAV.find(n => n.id === activeTab)?.label}
          </h1>
        </div>

        {/* Content */}
        <div className="px-8 py-7 max-w-6xl">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
