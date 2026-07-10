import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppFrame } from './components/AppFrame';
import { Onboarding } from './screens/onboarding/Onboarding';
import { Today } from './screens/Today';
import { Lessons } from './screens/Lessons';
import { LessonDetail } from './screens/LessonDetail';
import { Coach } from './screens/Coach';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Paywall } from './screens/Paywall';
import { Success } from './screens/Success';
import { TourProvider } from './components/GuidedTour';

// Lazy: the whole Kid Zone screen (and, behind it, the heavy Journey scenario
// data) becomes its own chunk so the parent-facing initial bundle stays lean.
const KidZone = lazy(() => import('./screens/kidzone/KidZone').then((m) => ({ default: m.KidZone })));
// The acquisition funnel (/start) is its own chunk — the Meta-ads landing page,
// loaded before (and separate from) the app so it stays fast on cold traffic.
const Funnel = lazy(() => import('./funnel/Funnel').then((m) => ({ default: m.Funnel })));

export default function App() {
  return (
    <TourProvider>
    <Routes>
      {/* Landing funnel — top-level, OUTSIDE the app frame so it skips the
          onboarding gate and bottom nav. This is the ad's destination URL. */}
      <Route path="start" element={<Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F6F1FF' }} />}><Funnel /></Suspense>} />
      {/* Stripe checkout success — top-level so it skips the onboarding gate. */}
      <Route path="success" element={<Success />} />
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
