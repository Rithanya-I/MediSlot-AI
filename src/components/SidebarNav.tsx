import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TicketCheck,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { ScreenId } from '../types/medislot';

export interface NavItem {
  id: ScreenId;
  label: string;
  section: 'Patient Care' | 'My Health & Visits' | 'Clinic Operations';
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', section: 'Patient Care', icon: LayoutDashboard },
  { id: 'triage', label: 'AI Symptom Triage', section: 'Patient Care', icon: Sparkles },
  { id: 'specialists', label: 'Specialists', section: 'Patient Care', icon: Stethoscope },
  { id: 'provider-detail', label: 'Provider Profile', section: 'Patient Care', icon: UserCheck },
  { id: 'booking', label: 'Smart Slot Matrix', section: 'Patient Care', icon: CalendarClock },
  { id: 'confirmation', label: 'Visit Pass', section: 'Patient Care', icon: TicketCheck },
  { id: 'appointments', label: 'My Appointments', section: 'My Health & Visits', icon: CalendarCheck },
  { id: 'telehealth', label: 'Telehealth Room', section: 'My Health & Visits', icon: Video },
  { id: 'intake', label: 'Medical Intake', section: 'My Health & Visits', icon: ClipboardList },
  { id: 'insurance', label: 'Insurance Check', section: 'My Health & Visits', icon: ShieldCheck },
  { id: 'messages', label: 'Care Messages', section: 'My Health & Visits', icon: MessageSquare },
  { id: 'clinic-schedule', label: 'Clinic Capacity', section: 'Clinic Operations', icon: Activity },
  { id: 'analytics', label: 'Ops Analytics', section: 'Clinic Operations', icon: BarChart3 },
];

const SECTIONS: Array<NavItem['section']> = [
  'Patient Care',
  'My Health & Visits',
  'Clinic Operations',
];

interface SidebarNavProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  appointmentCount: number;
}

export function SidebarNav({
  activeScreen,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  appointmentCount,
}: SidebarNavProps) {
  const renderNavBody = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNavigate('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D7A73] rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0D7A73] flex items-center justify-center text-white font-display font-bold text-sm">
            M
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-[#0F2942] whitespace-nowrap">
            MediSlot AI
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-[#0F2942] hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Primary clinical navigation">
        {SECTIONS.map((section) => {
          const items = NAV_ITEMS.filter((item) => item.section === section);
          return (
            <div key={section}>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 tracking-wide">
                {section}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${
                        active
                          ? 'bg-[#EDF4FC] text-[#0D7A73] font-semibold'
                          : 'text-slate-600 hover:text-[#0F2942] hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-[#0D7A73]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.id === 'appointments' && appointmentCount > 0 && (
                        <span className="font-mono tabular-nums text-xs text-[#0D7A73]">
                          {appointmentCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {renderNavBody()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F2942]/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{renderNavBody()}</div>
        </div>
      )}
    </>
  );
}
