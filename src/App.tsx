import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider, useCareer } from './context/CareerContext';
import { AppShell } from './components/AppShell';

// Eager landing page for instant initial paint & zero chunk waterfalls
import { Landing } from './pages/Landing';

// Accessible route loading skeleton reserving layout space
export function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      style={{
        minHeight: '440px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid var(--color-line-dark)',
          borderTopColor: 'var(--color-tangerine)',
        }}
        className="spin"
        aria-hidden="true"
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-linen)', fontSize: '0.95rem' }}>
          Loading page...
        </p>
        <p style={{ margin: '4px 0 0', color: 'var(--color-muted-light)', fontSize: '0.8rem' }}>
          Preparing deterministic tools &amp; workspace
        </p>
      </div>
    </div>
  );
}

// Lazy-loaded routes for code splitting and small initial bundle
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Assessment = lazy(() => import('./pages/Assessment').then(m => ({ default: m.Assessment })));
const Paths = lazy(() => import('./pages/Paths').then(m => ({ default: m.Paths })));
const PathBuilder = lazy(() => import('./pages/PathBuilder').then(m => ({ default: m.PathBuilder })));
const RoleDetail = lazy(() => import('./pages/RoleDetail').then(m => ({ default: m.RoleDetail })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Roadmap = lazy(() => import('./pages/Roadmap').then(m => ({ default: m.Roadmap })));
const ResumeLab = lazy(() => import('./pages/ResumeLab').then(m => ({ default: m.ResumeLab })));
const Practice = lazy(() => import('./pages/Practice').then(m => ({ default: m.Practice })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit').then(m => ({ default: m.ProfileEdit })));
const Terms = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.Privacy })));
const AiSafety = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.AiSafety })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const DesignSystemShowcase = lazy(() => import('./pages/DesignSystemShowcase').then(m => ({ default: m.DesignSystemShowcase })));

function AppShellContainer() {
  const { toastMessage, showToast } = useCareer();

  return (
    <AppShell toastMessage={toastMessage}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/paths" element={<Paths />} />
          <Route path="/paths/builder" element={<PathBuilder />} />
          <Route path="/builder" element={<PathBuilder />} />
          <Route path="/paths/:roleSlug" element={<RoleDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/resume" element={<ResumeLab />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/ai-safety" element={<AiSafety />} />
          <Route path="/safety" element={<AiSafety />} />
          <Route path="/design-system" element={<DesignSystemShowcase onTriggerToast={showToast} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <CareerProvider>
        <AppShellContainer />
      </CareerProvider>
    </BrowserRouter>
  );
}

export default App;
