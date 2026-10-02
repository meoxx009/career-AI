import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Home } from './pages/Home';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

export function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 2600);
  };

  return (
    <BrowserRouter>
      <AppShell toastMessage={toastMessage}>
        <Routes>
          <Route path="/" element={<Home onTriggerToast={showToast} />} />
          <Route path="/design-system" element={<DesignSystemShowcase onTriggerToast={showToast} />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
