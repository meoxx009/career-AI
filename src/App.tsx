import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CareerProvider } from './context/CareerContext';
import { AppShell } from './components/AppShell';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Assessment } from './pages/Assessment';
import { Dashboard } from './pages/Dashboard';
import { Paths } from './pages/Paths';
import { SkillGaps } from './pages/SkillGaps';
import { Roadmap } from './pages/Roadmap';
import { ResumeLab } from './pages/ResumeLab';
import { InterviewRoom } from './pages/InterviewRoom';

export function App() {
  return (
    <CareerProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/paths/:id/gaps" element={<SkillGaps />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/resume" element={<ResumeLab />} />
            <Route path="/practice" element={<InterviewRoom />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </CareerProvider>
  );
}

export default App;
