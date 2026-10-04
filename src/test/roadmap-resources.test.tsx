import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareerProvider } from '../context/CareerContext';
import { AppShell } from '../components/AppShell';
import { Roadmap } from '../pages/Roadmap';
import {
  CANONICAL_MILESTONE_RESOURCES,
  PATH_FALLBACK_RESOURCES,
  isInvalidOrPlaceholderUrl,
  sanitizeResourceUrl,
  resolveCurriculumResourceUrl,
  resolveTaskResource,
  healRoadmapTask,
  healRoadmapTasks,
} from '../lib/resourceResolver';
import { generateRoadmapPlan } from '../lib/roadmapGenerator';
import { CAREER_CATALOGUE, getCareerPathById } from '../data/careerCatalogue';
import { LocalRoadmapRepository } from '../lib/repositories/roadmapRepository';
import { LocalStorageRoadmapRepository } from '../lib/roadmapRepository';
import { STORAGE_KEY } from '../context/careerConstants';
import type { RoadmapTask } from '../types';

describe('Roadmap Curated Resources Resolution & Healing Across All Roles', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Symptom & Root Cause Resolution (AI Engineer Example)', () => {
    it('resolves AI Engineer Week 01 Milestone to genuine HuggingFace embeddings guide, NOT careerai.local', () => {
      const aiMilestone1 = CANONICAL_MILESTONE_RESOURCES['cur-ai-1'];
      expect(aiMilestone1).toBe('https://huggingface.co/blog/getting-started-with-embeddings');
      expect(aiMilestone1).not.toContain('careerai.local');
      expect(aiMilestone1).not.toContain('.local');

      // Test resolver function directly
      const resolved = resolveCurriculumResourceUrl(
        'cur-ai-1',
        'ai-engineer',
        'Vector Embeddings & Semantic Similarity Search'
      );
      expect(resolved).toBe('https://huggingface.co/blog/getting-started-with-embeddings');
    });

    it('generates an AI Engineer roadmap plan with authentic HTTPS resources on all milestones', () => {
      const plan = generateRoadmapPlan({
        roleId: 19, // AI Engineer
        weeklyStudyHours: 8,
      });

      expect(plan.valid).toBe(true);
      expect(plan.tasks.length).toBeGreaterThanOrEqual(5);

      // Verify no task has a careerai.local or .local URL
      plan.tasks.forEach((task) => {
        expect(task.resourceUrl).toBeTruthy();
        expect(task.resourceUrl).toMatch(/^https:\/\//);
        expect(task.resourceUrl).not.toContain('careerai.local');
        expect(task.resourceUrl).not.toContain('.local');
      });

      // Specific check for week 1 / milestone 1
      const task1 = plan.tasks.find(t => t.weekNumber === 1 || t.title.includes('Vector Embeddings'));
      expect(task1).toBeDefined();
      expect(task1?.resourceUrl).toBe('https://huggingface.co/blog/getting-started-with-embeddings');
    });
  });

  describe('2. Universal Catalogue Coverage Across All 33 Roles and 165 Milestones', () => {
    it('confirms every career path in CAREER_CATALOGUE has 5 milestones with valid HTTPS resource URLs', () => {
      expect(CAREER_CATALOGUE.length).toBe(33);

      let totalMilestones = 0;
      CAREER_CATALOGUE.forEach(path => {
        expect(path.curriculum).toBeDefined();
        expect(path.curriculum.length).toBe(5);

        path.curriculum.forEach((milestone) => {
          totalMilestones++;
          expect(milestone.id).toBeTruthy();
          expect(milestone.resourceUrl).toBeTruthy();
          expect(milestone.resourceUrl).toMatch(/^https:\/\//);
          expect(milestone.resourceUrl).not.toContain('careerai.local');
          expect(milestone.resourceUrl).not.toContain('.local');

          // Must match dictionary
          expect(CANONICAL_MILESTONE_RESOURCES[milestone.id]).toBe(milestone.resourceUrl);
        });
      });

      expect(totalMilestones).toBe(165);
    });

    it('provides path fallback resources and resolves task resources reliably', () => {
      expect(PATH_FALLBACK_RESOURCES['ai-engineer']).toBe('https://huggingface.co/docs');
      expect(resolveTaskResource({ id: 'custom-task' }, 'ai-engineer')).toBe('https://huggingface.co/docs');

      const batch = healRoadmapTasks([
        {
          id: 't1',
          weekNumber: 1,
          title: 'T1',
          description: '',
          deliverable: '',
          estimatedHours: 4,
          resourceUrl: 'https://careerai.local/curriculum/ai-engineer',
          status: 'todo',
        },
      ], 'ai-engineer');
      expect(batch[0].resourceUrl).not.toContain('careerai.local');

      const path = getCareerPathById(19);
      expect(path?.slug).toBe('ai-engineer');
    });

    it('generates valid roadmaps with genuine external resources for every supported role', () => {
      CAREER_CATALOGUE.forEach(path => {
        const plan = generateRoadmapPlan({
          roleId: path.numericId,
          weeklyStudyHours: 8,
        });

        expect(plan.valid).toBe(true);
        expect(plan.tasks.length).toBeGreaterThan(0);
        plan.tasks.forEach(task => {
          expect(task.resourceUrl).toMatch(/^https:\/\//);
          expect(task.resourceUrl).not.toContain('careerai.local');
          expect(task.resourceUrl).not.toContain('.local');
        });
      });
    });
  });

  describe('3. URL Sanitization and Placeholder Detection', () => {
    it('detects and flags invalid, unsafe, or placeholder URLs', () => {
      expect(isInvalidOrPlaceholderUrl('https://careerai.local/curriculum/ai-engineer')).toBe(true);
      expect(isInvalidOrPlaceholderUrl('http://test.local/guide')).toBe(true);
      expect(isInvalidOrPlaceholderUrl('http://localhost:3000')).toBe(true);
      expect(isInvalidOrPlaceholderUrl('http://127.0.0.1/doc')).toBe(true);
      expect(isInvalidOrPlaceholderUrl('https://example.com/learn')).toBe(true);
      expect(isInvalidOrPlaceholderUrl('javascript:alert(1)')).toBe(true);
      expect(isInvalidOrPlaceholderUrl('')).toBe(true);
      expect(isInvalidOrPlaceholderUrl(null)).toBe(true);
      expect(isInvalidOrPlaceholderUrl(undefined)).toBe(true);

      // Valid external URLs
      expect(isInvalidOrPlaceholderUrl('https://huggingface.co/blog/getting-started-with-embeddings')).toBe(false);
      expect(isInvalidOrPlaceholderUrl('https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview')).toBe(false);
      expect(isInvalidOrPlaceholderUrl('https://www.postgresql.org/docs/current/tutorial-sql.html')).toBe(false);
    });

    it('sanitizes URLs safely, stripping invalid/local hosts to null while passing valid URLs', () => {
      expect(sanitizeResourceUrl('https://careerai.local/curriculum/ai-engineer')).toBeNull();
      expect(sanitizeResourceUrl('https://developer.mozilla.org')).toBe('https://developer.mozilla.org');
      expect(sanitizeResourceUrl('https://huggingface.co/docs')).toBe('https://huggingface.co/docs');
      expect(sanitizeResourceUrl('javascript:void(0)')).toBeNull();
    });
  });

  describe('4. Legacy Data Healing for Saved Roadmaps', () => {
    it('repairs legacy tasks containing careerai.local in-place while preserving status, dates, and hours', () => {
      const legacyTask: RoadmapTask = {
        id: 'cur-ai-1',
        weekNumber: 1,
        title: 'Foundations: Vector Embeddings & Semantic Similarity Search',
        description: 'Review embeddings mathematics',
        deliverable: 'A Python script generating text embeddings',
        estimatedHours: 8,
        resourceUrl: 'https://careerai.local/curriculum/ai-engineer',
        status: 'completed',
        completedAt: '2026-10-01',
      };

      const healed = healRoadmapTask(legacyTask, 'ai-engineer');

      // Resource URL is repaired
      expect(healed.resourceUrl).toBe('https://huggingface.co/blog/getting-started-with-embeddings');

      // State is strictly preserved
      expect(healed.id).toBe('cur-ai-1');
      expect(healed.status).toBe('completed');
      expect(healed.completedAt).toBe('2026-10-01');
      expect(healed.estimatedHours).toBe(8);
      expect(healed.deliverable).toBe('A Python script generating text embeddings');
    });

    it('LocalRoadmapRepository heals legacy stored tasks on read', async () => {
      const repo = new LocalRoadmapRepository('test-storage-key');
      const legacyStoredTasks = [
        {
          id: 'cur-ai-1',
          weekNumber: 1,
          title: 'Foundations: Vector Embeddings & Semantic Similarity Search',
          description: 'Desc',
          deliverable: 'Deliverable',
          estimatedHours: 8,
          resourceUrl: 'https://careerai.local/curriculum/ai-engineer',
          status: 'todo' as const,
        },
      ];

      localStorage.setItem('career_ai_roadmap_test-user', JSON.stringify(legacyStoredTasks));

      const res = await repo.getRoadmapTasks('test-user', 19);
      expect(res.data).toBeDefined();
      expect(res.data![0].resourceUrl).toBe('https://huggingface.co/blog/getting-started-with-embeddings');
      expect(res.data![0].resourceUrl).not.toContain('careerai.local');
    });

    it('LocalStorageRoadmapRepository heals legacy stored tasks on read', async () => {
      const repo = new LocalStorageRoadmapRepository('test-repo-key');
      const legacyState = {
        selectedRoleId: 19,
        roadmapTasks: [
          {
            id: 'tmpl-ai-engineer-1',
            weekNumber: 1,
            title: 'Foundations: Vector Embeddings & Semantic Similarity Search',
            description: 'Desc',
            deliverable: 'Deliverable',
            estimatedHours: 8,
            resourceUrl: 'https://careerai.local/curriculum/ai-engineer',
            status: 'completed' as const,
            completedAt: '2026-09-30',
          },
        ],
      };

      localStorage.setItem('test-repo-key', JSON.stringify(legacyState));

      const tasks = await repo.getTasks(19);
      expect(tasks[0].resourceUrl).toBe('https://huggingface.co/blog/getting-started-with-embeddings');
      expect(tasks[0].status).toBe('completed');
      expect(tasks[0].completedAt).toBe('2026-09-30');
    });
  });

  describe('5. UI Rendering & Interaction Safety in Roadmap Component', () => {
    it('renders the Curated Resource link targeting external tab without marking complete', async () => {
      // Seed an AI Engineer roadmap with an uncompleted task
      const aiPlan = generateRoadmapPlan({ roleId: 19, weeklyStudyHours: 8 });
      const initialTasks = aiPlan.tasks;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoleId: 19,
          profile: { targetRoleId: 19, hoursPerWeek: 8 },
          roadmapTasks: initialTasks,
        })
      );

      render(
        <MemoryRouter initialEntries={['/roadmap']}>
          <CareerProvider>
            <AppShell>
              <Routes>
                <Route path="/roadmap" element={<Roadmap />} />
              </Routes>
            </AppShell>
          </CareerProvider>
        </MemoryRouter>
      );

      // Find the Curated Resource links
      const resourceLinks = screen.getAllByRole('link', { name: /Curated Resource/i });
      expect(resourceLinks.length).toBeGreaterThan(0);

      const firstLink = resourceLinks[0];
      expect(firstLink).toHaveAttribute('href', 'https://huggingface.co/blog/getting-started-with-embeddings');
      expect(firstLink).toHaveAttribute('target', '_blank');
      expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

      // Clicking resource link must NOT mark task complete
      fireEvent.click(firstLink);

      // Verify the task is still incomplete ("Mark ... as completed" button is still present)
      const markButtons = screen.getAllByRole('button', { name: /as completed/i });
      expect(markButtons.length).toBeGreaterThan(0);
    });

    it('renders safe valid URL even if stored task initially held careerai.local', async () => {
      const corruptTasks = [
        {
          id: 'cur-ai-1',
          weekNumber: 1,
          title: 'Foundations: Vector Embeddings & Semantic Similarity Search',
          description: 'Desc',
          deliverable: 'Deliverable',
          estimatedHours: 8,
          resourceUrl: 'https://careerai.local/curriculum/ai-engineer',
          status: 'todo' as const,
        },
      ];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoleId: 19,
          profile: { targetRoleId: 19, hoursPerWeek: 8 },
          roadmapTasks: corruptTasks,
        })
      );

      render(
        <MemoryRouter initialEntries={['/roadmap']}>
          <CareerProvider>
            <AppShell>
              <Routes>
                <Route path="/roadmap" element={<Roadmap />} />
              </Routes>
            </AppShell>
          </CareerProvider>
        </MemoryRouter>
      );

      // The UI must render the healed link, NOT careerai.local
      const resourceLinks = screen.getAllByRole('link', { name: /Curated Resource/i });
      expect(resourceLinks.length).toBeGreaterThan(0);
      const resourceLink = resourceLinks[0];
      expect(resourceLink).toHaveAttribute('href', 'https://huggingface.co/blog/getting-started-with-embeddings');
      expect(resourceLink.getAttribute('href')).not.toContain('careerai.local');
    });
  });
});
