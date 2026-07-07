import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { BottomNav } from './ds';

const NAV_HIDDEN_PREFIXES = ['/onboarding', '/settings', '/kid'];

export function AppFrame() {
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Onboarding gate (order is enforced: nothing else is reachable until done).
  if (!state.onboarded && path !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (state.onboarded && path === '/onboarding') return <Navigate to="/today" replace />;

  const activeTab = path.split('/')[1] || 'today';
  const hideNav = NAV_HIDDEN_PREFIXES.some((p) => path.startsWith(p));

  return (
    <div className="app-frame">
      <div className="app-scroll" key={activeTab}>
        <Outlet />
      </div>
      {!hideNav && <BottomNav active={activeTab} onChange={(key) => navigate(`/${key}`)} />}
    </div>
  );
}
