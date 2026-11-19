import { CalendarPlus, LogIn, LogOut, Menu } from 'lucide-react';
import { NAV_ITEMS } from './SidebarNav';
import { ScreenId } from '../types/medislot';
import { useAuth } from '../context/AuthContext';

interface TopHeaderProps {
  activeScreen: ScreenId;
  onOpenMobileNav: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export function TopHeader({
  activeScreen,
  onOpenMobileNav,
  onNavigate,
}: TopHeaderProps) {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const activeMeta = NAV_ITEMS.find((item) => item.id === activeScreen) || NAV_ITEMS[0];

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-[#0F2942] hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 whitespace-nowrap">
            MediSlot AI
          </span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="hidden md:inline text-slate-500 whitespace-nowrap">
            {activeMeta.section}
          </span>
          <span className="hidden md:inline text-slate-300">/</span>
          <h1 className="font-display font-semibold text-[#0F2942] truncate">
            {activeMeta.label}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {!loading &&
          (user ? (
            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline text-xs font-medium text-slate-600 max-w-[160px] truncate">
                {user.displayName || user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-[#0D7A73]" />
              <span>Sign In</span>
            </button>
          ))}

        <button
          type="button"
          onClick={() => onNavigate('booking')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Book Visit</span>
        </button>
      </div>
    </header>
  );
}
