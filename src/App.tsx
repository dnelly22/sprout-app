import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './store/AppStore';
import { trackOnce } from './analytics';
import { AppFrame } from './components/AppFrame';
import { Onboarding } from './screens/onboarding/Onboarding';
import { Today } from './screens/Today';
import { Lessons } from './screens/Lessons';
import { LessonDetail } from './screens/LessonDetail';
import { Coach } from './screens/Coach';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Paywall } from './screens/Paywall';
import { TourProvider } from './components/GuidedTour';

// Lazy: the whole Kid Zone screen (and, behind it, the heavy Journey scenario
// data) becomes its own chunk so the parent-facing initial bundle stays lean.
const KidZone = lazy(() => import('./screens/kidzone/KidZone').then((m) => ({ default: m.KidZone })));
// The acquisition funnel (/start) is its own chunk — the Meta-ads landing page,
// loaded before (and separate from) the app so it stays fast on cold traffic.
const Funnel = lazy(() => import('./funnel/Funnel').then((m) => ({ default: m.Funnel })));

// Captured at load, before react-router can rewrite the URL.
const INITIAL_SEARCH = typeof window !== 'undefined' ? window.location.search : '';

export default function App() {
  const { dispatch } = useApp();

  // Returning from a successful Stripe checkout (?upgraded=1[&plan=annual|monthly])
  // → unlock Premium and fire the Subscribe conversion once.
  useEffect(() => {
    const p = new URLSearchParams(INITIAL_SEARCH);
    if (p.get('upgraded') === '1') {
      dispatch({ type: 'updateSettings', patch: { plan: 'premium', trialStart: undefined } });
      trackOnce('subscribe', 'Subscribe', { plan: p.get('plan') || 'annual', value: p.get('plan') === 'monthly' ? 14.99 : 99, currency: 'USD' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [dispatch]);

  return (
    <TourProvider>
    <Routes>
      {/* Landing funnel — top-level, OUTSIDE the app frame so it skips the
          onboarding gate and bottom nav. This is the ad's destination URL. */}
      <Route path="start" element={<Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F6F1FF' }} />}><Funnel /></Suspense>} />
      <Route element={<AppFrame />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="today" element={<Today />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="lessons/:id" element={<LessonDetail />} />
        <Route path="coach" element={<Coach />} />
        <Route path="kid" element={<Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--kid-bg)' }} />}><KidZone /></Suspense>} />
        <Route path="progress" element={<Progress />} />
        <Route path="settings" element={<Settings />} />
        <Route path="plans" element={<Paywall />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
    </TourProvider>
  );
}
