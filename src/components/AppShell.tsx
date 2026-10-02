import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { Compass, BookOpen, Map, FileText, MessageSquare, RotateCcw } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, resetToDemo, aiMode, setAiMode, language, setLanguage, toastMessage } = useCareer();

  return (
    <div className="min-h-screen bg-void text-linen flex flex-col font-sans selection:bg-tangerine selection:text-void">
      {/* Top Banner / System Notice */}
      <div className="border-b border-neutral-800 bg-void-subtle px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 text-cotton border border-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine"></span>
            {profile.isGuestDemo ? 'Fictional Guest Demo (Rahul)' : 'Active Account'}
          </span>
          <span>Source checked: 02 Oct 2026</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-cotton border border-neutral-700 transition cursor-pointer"
            title="Toggle language: English / Hindi"
          >
            {language === 'en' ? 'हिन्दी (HI)' : 'English (EN)'}
          </button>
          <button
            onClick={() => setAiMode(aiMode === 'ai' ? 'deterministic-fallback' : 'ai')}
            className="text-xs hover:text-linen underline underline-offset-2 transition-colors cursor-pointer"
            title="Toggle between deterministic local rules and simulated AI"
          >
            Mode: {aiMode === 'deterministic-fallback' ? 'Deterministic Fallback' : 'AI Assisted'}
          </button>
          <button
            onClick={resetToDemo}
            className="flex items-center gap-1 text-xs hover:text-tangerine transition-colors cursor-pointer"
            title="Reset data to default Rahul demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset demo
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-neutral-800 bg-void/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="text-xl font-bold tracking-tight text-linen hover:text-cotton transition-colors">
              career<span className="text-tangerine">/ai</span>
            </NavLink>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `transition-colors hover:text-linen ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/paths"
                className={({ isActive }) =>
                  `transition-colors hover:text-linen ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
                }
              >
                Career Paths
              </NavLink>
              <NavLink
                to="/assessment"
                className={({ isActive }) =>
                  `transition-colors hover:text-linen ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
                }
              >
                Diagnostic
              </NavLink>
              <NavLink
                to="/roadmap"
                className={({ isActive }) =>
                  `transition-colors hover:text-linen ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
                }
              >
                Roadmap
              </NavLink>
              <NavLink
                to="/resume"
                className={({ isActive }) =>
                  `transition-colors hover:text-linen ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
                }
              >
                Resume Lab
              </NavLink>
              <NavLink
                to="/practice"
                className={({ isActive }) =>
                  `transition-colors hover:text-linen ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
                }
              >
                Interview Room
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/onboarding"
              className="text-xs uppercase tracking-wider text-neutral-400 hover:text-linen px-3 py-1.5 rounded border border-neutral-800 hover:border-neutral-700 transition"
            >
              Profile
            </NavLink>
            <NavLink
              to="/assessment"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-tangerine text-void font-semibold hover:bg-orange-500 transition shadow-sm cursor-pointer"
            >
              Take Diagnostic
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Mobile Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden sticky bottom-0 z-40 border-t border-neutral-800 bg-void/95 backdrop-blur px-2 py-2 flex justify-around text-xs">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
          }
        >
          <Compass className="w-4 h-4" />
          <span>Overview</span>
        </NavLink>
        <NavLink
          to="/paths"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
          }
        >
          <BookOpen className="w-4 h-4" />
          <span>Paths</span>
        </NavLink>
        <NavLink
          to="/roadmap"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
          }
        >
          <Map className="w-4 h-4" />
          <span>Roadmap</span>
        </NavLink>
        <NavLink
          to="/resume"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
          }
        >
          <FileText className="w-4 h-4" />
          <span>Resume</span>
        </NavLink>
        <NavLink
          to="/practice"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 ${isActive ? 'text-tangerine font-semibold' : 'text-neutral-400'}`
          }
        >
          <MessageSquare className="w-4 h-4" />
          <span>Practice</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-void-subtle py-8 px-4 sm:px-6 text-xs text-neutral-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-linen">CareerAI — Transparent Student Preparation Platform</p>
            <p className="mt-1 text-neutral-500">
              Not a certification or placement guarantee. Pure deterministic scoring & truthful evidence.
            </p>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            <span>Verified Rubric v1.2</span>
            <span>·</span>
            <span>WCAG AA Accessible</span>
          </div>
        </div>
      </footer>

      {/* Ambient background glows */}
      <div className="ambient ambient-top" aria-hidden="true"></div>
      <div className="ambient ambient-bottom" aria-hidden="true"></div>

      {/* Toast Notification Container */}
      <div id="toast" className={`toast ${toastMessage ? 'show' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
};
