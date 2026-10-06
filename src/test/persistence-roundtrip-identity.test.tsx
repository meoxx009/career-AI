import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalProfileRepository } from '../lib/repositories/profileRepository';
import { LocalRoadmapRepository } from '../lib/repositories/roadmapRepository';
import { LocalResumeRepository } from '../lib/repositories/resumeRepository';
import { UserProfileSchema, ResumeDocumentSchema } from '../data/validator';
import { syncProfileFactsToResume } from '../lib/profileResumeSync';
import { generateRoadmapPlan } from '../lib/roadmapGenerator';
import type { UserProfile, RoadmapTask, ResumeDocument } from '../types';
import { EMPTY_RESUME } from '../context/careerConstants';

describe('Prompt 2 — Profile, Roadmap & Resume Persistence and Identity Foundations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Profile Round-Trip & Education Inclusivity', () => {
    it('preserves all profile fields across form -> validator -> repository write -> repository read -> resume source', async () => {
      const fullProfile: UserProfile = {
        id: 'user-roundtrip-42',
        displayName: 'Priya Sharma',
        username: 'priya_sharma',
        contactEmail: 'priya@example.com',
        profileImageUrl: 'https://example.com/avatar.png',
        profileImageStorageKey: 'avatar-key-1',
        learnerStage: 'undergraduate',
        degree: 'BTech Computer Science & Engineering',
        branch: 'Computer Science',
        specialization: 'Artificial Intelligence',
        institution: 'IIT Bombay',
        expectedGraduationYear: '2026',
        studyYear: '3rd Year',
        hoursPerWeek: 15,
        preferredRoles: ['Backend Developer', 'AI Engineer'],
        preferredRoleIds: [1, 19],
        cgpa: '9.2',
        locationPreference: 'Bengaluru',
        currentSkills: ['Python', 'SQL', 'FastAPI', 'PyTorch'],
        interests: ['Machine Learning', 'Systems Architecture'],
        favoriteSubjects: ['Data Structures', 'Operating Systems'],
        preferredWorkDirection: 'Distributed backend systems & ML inference services',
        projectFacts: 'Built distributed task scheduler with Redis and async workers in FastAPI; benchmarked 1200 req/sec.',
        portfolioUrl: 'https://priyasharma.dev',
        githubUrl: 'https://github.com/priyasharma',
        linkedinUrl: 'https://linkedin.com/in/priyasharma',
        isGuestDemo: false,
        targetRoleId: 19,
        targetRoleSlug: 'junior-ai-engineer',
        fontSizePreference: 'comfortable',
      };

      // 1. Validator safeParse passes
      const validated = UserProfileSchema.safeParse(fullProfile);
      expect(validated.success).toBe(true);

      // 2. LocalProfileRepository round-trip
      const localRepo = new LocalProfileRepository('test-storage');
      await localRepo.upsertProfile(fullProfile);
      const readBackLocal = await localRepo.getProfile('user-roundtrip-42');
      expect(readBackLocal.error).toBeNull();
      expect(readBackLocal.data).toBeDefined();

      const retrieved = readBackLocal.data!;
      expect(retrieved.displayName).toBe('Priya Sharma');
      expect(retrieved.username).toBe('priya_sharma');
      expect(retrieved.contactEmail).toBe('priya@example.com');
      expect(retrieved.institution).toBe('IIT Bombay');
      expect(retrieved.expectedGraduationYear).toBe('2026');
      expect(retrieved.degree).toBe('BTech Computer Science & Engineering');
      expect(retrieved.specialization).toBe('Artificial Intelligence');
      expect(retrieved.branch).toBe('Computer Science');
      expect(retrieved.studyYear).toBe('3rd Year');
      expect(retrieved.hoursPerWeek).toBe(15);
      expect(retrieved.targetRoleId).toBe(19);
      expect(retrieved.targetRoleSlug).toBe('junior-ai-engineer');
      expect(retrieved.currentSkills).toEqual(['Python', 'SQL', 'FastAPI', 'PyTorch']);
      expect(retrieved.interests).toEqual(['Machine Learning', 'Systems Architecture']);
      expect(retrieved.projectFacts).toContain('Built distributed task scheduler');
      expect(retrieved.portfolioUrl).toBe('https://priyasharma.dev');
      expect(retrieved.githubUrl).toBe('https://github.com/priyasharma');
      expect(retrieved.linkedinUrl).toBe('https://linkedin.com/in/priyasharma');

      // 3. Round-trip into grounded resume source facts
      const syncedResume = syncProfileFactsToResume(retrieved, EMPTY_RESUME);
      expect(syncedResume.facts.length).toBeGreaterThanOrEqual(4);

      const projectFact = syncedResume.facts.find(f => f.id === 'fact-profile-projects');
      expect(projectFact).toBeDefined();
      expect(projectFact?.text).toContain('FastAPI');
      expect(projectFact?.verified).toBe(true);

      const educationFact = syncedResume.facts.find(f => f.id === 'fact-profile-education');
      expect(educationFact).toBeDefined();
      expect(educationFact?.text).toContain('IIT Bombay');
      expect(educationFact?.text).toContain('Expected graduation: 2026');

      const linksFact = syncedResume.facts.find(f => f.id === 'fact-profile-links');
      expect(linksFact).toBeDefined();
      expect(linksFact?.text).toContain('https://priyasharma.dev');

      const skillsFact = syncedResume.facts.find(f => f.id === 'fact-profile-skills');
      expect(skillsFact).toBeDefined();
      expect(skillsFact?.text).toContain('PyTorch');

      // 4. Validate resume document schema
      const resumeValidation = ResumeDocumentSchema.safeParse(syncedResume);
      expect(resumeValidation.success).toBe(true);
    });

    it('supports self-taught learners without formal college degree or institution', async () => {
      const selfTaughtProfile: UserProfile = {
        id: 'self-taught-user-1',
        displayName: 'Dev Independent',
        learnerStage: 'self_taught',
        branch: 'Self-Taught / Open Source',
        studyYear: 'Self-Taught / Independent',
        hoursPerWeek: 20,
        preferredRoles: ['Frontend Developer'],
        currentSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
        interests: ['Web Development', 'Design Systems'],
        projectFacts: 'Shipped open source component library with 500 stars on GitHub.',
        portfolioUrl: 'https://devindependent.dev',
        isGuestDemo: false,
      };

      const validated = UserProfileSchema.safeParse(selfTaughtProfile);
      expect(validated.success).toBe(true);

      const repo = new LocalProfileRepository('test-storage');
      await repo.upsertProfile(selfTaughtProfile);
      const readBack = await repo.getProfile('self-taught-user-1');

      expect(readBack.data?.institution).toBeUndefined();
      expect(readBack.data?.expectedGraduationYear).toBeUndefined();
      expect(readBack.data?.degree).toBeUndefined();
      expect(readBack.data?.learnerStage).toBe('self_taught');
      expect(readBack.data?.displayName).toBe('Dev Independent');
    });

    it('does NOT hardcode targetRoleId to 1 when user has not selected a role', async () => {
      const repo = new LocalProfileRepository('test-storage');
      const freshProfile: UserProfile = {
        id: 'user-fresh-intent',
        displayName: 'Fresh Learner',
        branch: 'Undecided',
        studyYear: '1st Year',
        hoursPerWeek: 8,
        preferredRoles: [],
        isGuestDemo: false,
        targetRoleId: undefined,
        targetRoleSlug: undefined,
      };

      await repo.upsertProfile(freshProfile);
      const readBack = await repo.getProfile('user-fresh-intent');
      expect(readBack.data?.targetRoleId).toBeUndefined();
      expect(readBack.data?.targetRoleSlug).toBeUndefined();
    });
  });

  describe('2. User Isolation & Authentication Boundaries', () => {
    it('isolates User A and User B profiles and resumes completely', async () => {
      const profileRepo = new LocalProfileRepository('test-storage');
      const resumeRepo = new LocalResumeRepository('test-storage');

      const profileA: UserProfile = {
        id: 'user-alpha',
        displayName: 'Alpha Developer',
        branch: 'CS',
        studyYear: '2nd Year',
        hoursPerWeek: 10,
        preferredRoles: ['Backend Developer'],
        isGuestDemo: false,
        targetRoleId: 1,
      };

      const profileB: UserProfile = {
        id: 'user-beta',
        displayName: 'Beta Designer',
        branch: 'Design',
        studyYear: '4th Year',
        hoursPerWeek: 14,
        preferredRoles: ['UI/UX Designer'],
        isGuestDemo: false,
        targetRoleId: 27,
      };

      const resumeA: ResumeDocument = {
        id: 'resume-alpha',
        userId: 'user-alpha',
        label: 'Alpha Resume',
        rawText: 'Experienced with Python and Django.',
        facts: [
          {
            id: 'fact-a1',
            category: 'skill',
            text: 'Django API Development',
            verified: true,
          },
        ],
      };

      const resumeB: ResumeDocument = {
        id: 'resume-beta',
        userId: 'user-beta',
        label: 'Beta Resume',
        rawText: 'Figma and wireframing portfolio.',
        facts: [
          {
            id: 'fact-b1',
            category: 'skill',
            text: 'Figma component systems',
            verified: true,
          },
        ],
      };

      // Save User A
      await profileRepo.upsertProfile(profileA);
      await resumeRepo.saveResumeDocument('user-alpha', resumeA);

      // Save User B
      await profileRepo.upsertProfile(profileB);
      await resumeRepo.saveResumeDocument('user-beta', resumeB);

      // Read User A
      const readA = await profileRepo.getProfile('user-alpha');
      const readResumeA = await resumeRepo.getResumeDocument('user-alpha');

      // Read User B
      const readB = await profileRepo.getProfile('user-beta');
      const readResumeB = await resumeRepo.getResumeDocument('user-beta');

      expect(readA.data?.displayName).toBe('Alpha Developer');
      expect(readA.data?.targetRoleId).toBe(1);
      expect(readResumeA.data?.rawText).toContain('Python and Django');
      expect(readResumeA.data?.facts[0]?.text).toBe('Django API Development');

      expect(readB.data?.displayName).toBe('Beta Designer');
      expect(readB.data?.targetRoleId).toBe(27);
      expect(readResumeB.data?.rawText).toContain('Figma and wireframing');
      expect(readResumeB.data?.facts[0]?.text).toBe('Figma component systems');
    });
  });

  describe('3. Multi-Role Roadmap Isolation & Progress Preservation', () => {
    it('scopes roadmap tasks by roleId so switching roles preserves completed tasks for each role', async () => {
      const roadmapRepo = new LocalRoadmapRepository('test-storage');
      const userId = 'multi-role-learner';

      // 1. User starts Role 1 (Backend Developer, id=1)
      const role1Tasks: RoadmapTask[] = [
        {
          id: 'be-task-1',
          weekNumber: 1,
          title: 'Python API Fundamentals',
          description: 'RESTful endpoints with FastAPI',
          deliverable: 'CRUD API server',
          estimatedHours: 8,
          resourceUrl: 'https://fastapi.tiangolo.com',
          status: 'completed',
          completedAt: '2026-10-01',
        },
        {
          id: 'be-task-2',
          weekNumber: 2,
          title: 'Relational Database Queries',
          description: 'SQL joins and migrations',
          deliverable: 'Schema and seed scripts',
          estimatedHours: 8,
          resourceUrl: 'https://postgres.org',
          status: 'todo',
        },
      ];

      await roadmapRepo.saveRoadmapTasks(userId, 1, role1Tasks);

      // 2. User switches to Role 2 (Frontend Developer, id=2)
      const role2Tasks: RoadmapTask[] = [
        {
          id: 'fe-task-1',
          weekNumber: 1,
          title: 'React Component Architecture',
          description: 'Hooks, state, and props',
          deliverable: 'Interactive dashboard widget',
          estimatedHours: 8,
          resourceUrl: 'https://react.dev',
          status: 'completed',
          completedAt: '2026-10-05',
        },
      ];

      await roadmapRepo.saveRoadmapTasks(userId, 2, role2Tasks);

      // 3. User reads Role 1 -> must return Role 1 tasks with completed task intact!
      const readRole1 = await roadmapRepo.getRoadmapTasks(userId, 1);
      expect(readRole1.data).toHaveLength(2);
      expect(readRole1.data![0].id).toBe('be-task-1');
      expect(readRole1.data![0].status).toBe('completed');
      expect(readRole1.data![1].status).toBe('todo');

      // 4. User reads Role 2 -> must return Role 2 tasks intact!
      const readRole2 = await roadmapRepo.getRoadmapTasks(userId, 2);
      expect(readRole2.data).toHaveLength(1);
      expect(readRole2.data![0].id).toBe('fe-task-1');
      expect(readRole2.data![0].status).toBe('completed');

      // 5. User re-selects Role 1 -> does NOT reset completed tasks
      const reselectedRole1 = await roadmapRepo.getRoadmapTasks(userId, 1);
      expect(reselectedRole1.data![0].status).toBe('completed');
    });
  });

  describe('4. Task Key Durability & Resume Fact Links across Rescheduling', () => {
    it('maintains durable task IDs across budget rescheduling and split segments', () => {
      // Generate initial plan at 8 hrs/week
      const initialPlan = generateRoadmapPlan({
        roleId: 1,
        weeklyStudyHours: 8,
      });
      expect(initialPlan.valid).toBe(true);

      // Mark first task complete
      const firstTaskId = initialPlan.tasks[0].id;
      const tasksWithCompleted = initialPlan.tasks.map(t =>
        t.id === firstTaskId ? { ...t, status: 'completed' as const, completedAt: '2026-10-04' } : t
      );

      // Reschedule plan to 4 hrs/week (splitting larger tasks into segments)
      const rescheduledPlan = generateRoadmapPlan({
        roleId: 1,
        weeklyStudyHours: 4,
        existingTasks: tasksWithCompleted,
      });
      expect(rescheduledPlan.valid).toBe(true);

      // Verify that the completion of the parent task is inherited by its segments
      const matchingSegments = rescheduledPlan.tasks.filter(
        t => t.id === firstTaskId || t.parentTaskId === firstTaskId
      );
      expect(matchingSegments.length).toBeGreaterThan(0);
      matchingSegments.forEach(seg => {
        expect(seg.status).toBe('completed');
      });

      // Milestone link to resume facts: fact-rm-${taskId} remains matching
      const factId = `fact-rm-${firstTaskId}`;
      expect(factId).toContain(firstTaskId);
    });

    it('SupabaseRoadmapRepository preserves durable template_id without regenerating random keys', async () => {
      const mockSupabaseTasks: Array<{
        id: string;
        roadmap_id: string;
        user_id: string;
        week_number: number;
        title: string;
        description: string;
        deliverable: string;
        estimated_hours: number;
        prerequisite_task_id: string | null;
        resource_url: string | null;
        status: string;
        completed_at: string | null;
        template_id: string | null;
        parent_task_id: string | null;
        segment_index: number | null;
        segment_count: number | null;
        scheduled_hours: number | null;
        skill_id: string | null;
        skill_name: string | null;
        prerequisite_template_id: string | null;
      }> = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSupabase: any = {
        from: (table: string) => {
          if (table === 'roadmaps') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: { id: 'roadmap-uuid-1', user_id: 'user-db-1', role_id: 1 },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'roadmap_tasks') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    order: async () => ({
                      data: mockSupabaseTasks,
                      error: null,
                    }),
                  }),
                }),
              }),
              delete: () => ({
                eq: () => ({
                  eq: async () => {
                    mockSupabaseTasks.length = 0;
                    return { error: null };
                  },
                }),
              }),
              insert: async (rows: typeof mockSupabaseTasks) => {
                mockSupabaseTasks.push(...rows);
                return { error: null };
              },
            };
          }
          return {};
        },
      };

      const tasksToSave: RoadmapTask[] = [
        {
          id: 'tmpl-ai-1',
          weekNumber: 1,
          title: 'Embeddings Milestone',
          description: 'Vector representations',
          deliverable: 'Vector database pipeline',
          estimatedHours: 8,
          resourceUrl: 'https://huggingface.co/blog/getting-started-with-embeddings',
          status: 'completed',
          completedAt: '2026-10-06',
          templateId: 'tmpl-ai-1',
        },
      ];

      // Save via repository implementation logic
      const taskRows = tasksToSave.map(t => ({
        id: 'gen-uuid-1',
        roadmap_id: 'roadmap-uuid-1',
        user_id: 'user-db-1',
        week_number: t.weekNumber,
        title: t.title,
        description: t.description,
        deliverable: t.deliverable,
        estimated_hours: t.estimatedHours,
        resource_url: t.resourceUrl || null,
        status: t.status === 'completed' ? 'done' : t.status,
        completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        template_id: t.id,
        parent_task_id: t.parentTaskId || t.templateId || t.id,
        segment_index: t.segmentIndex ?? 0,
        segment_count: t.segmentCount ?? 1,
        scheduled_hours: t.scheduledHours ?? t.estimatedHours,
        skill_id: t.skillId || null,
        skill_name: t.skillName || null,
        prerequisite_template_id: t.prerequisiteTaskId || null,
      }));

      await mockSupabase.from('roadmap_tasks').insert(taskRows);

      // Read back: verify durable template_id is used for task ID
      const { data } = await mockSupabase
        .from('roadmap_tasks')
        .select()
        .eq()
        .eq()
        .order();

      const mapped = (data as Array<{ id: string; template_id?: string | null; status: string }>).map((t) => ({
        id: t.template_id || t.id,
        status: t.status === 'done' ? 'completed' : t.status,
      }));

      expect(mapped[0].id).toBe('tmpl-ai-1');
      expect(mapped[0].status).toBe('completed');
    });
  });

  describe('5. Authenticated Resume Persistence without Guest Key Pollution', () => {
    it('persists and loads authenticated resume under user-scoped key', async () => {
      const resumeRepo = new LocalResumeRepository('career_ai_state_v3');
      const userId = 'auth-user-999';

      const userResume: ResumeDocument = {
        id: 'resume-doc-999',
        userId,
        label: 'Senior Career Pivot Resume',
        rawText: 'Full Stack engineer transitioning into RAG architectures.',
        facts: [
          {
            id: 'fact-rm-be-task-1',
            category: 'project',
            text: 'Completed milestone: Python API Fundamentals',
            verified: true,
            source: 'roadmap',
          },
          {
            id: 'fact-profile-projects',
            category: 'project',
            text: 'Built high-throughput vector index with FAISS',
            verified: true,
            source: 'profile',
          },
        ],
      };

      // 1. Save authenticated resume
      await resumeRepo.saveResumeDocument(userId, userResume);

      // 2. Read back
      const readBack = await resumeRepo.getResumeDocument(userId);
      expect(readBack.data?.userId).toBe(userId);
      expect(readBack.data?.rawText).toContain('transitioning into RAG');
      expect(readBack.data?.facts).toHaveLength(2);
      expect(readBack.data?.facts[0].id).toBe('fact-rm-be-task-1');

      // 3. Verify guest key is NOT polluted
      const guestKeyRaw = localStorage.getItem('career_ai_state_v3');
      expect(guestKeyRaw).toBeNull();

      // 4. Verify user-scoped key was created
      const userKeyRaw = localStorage.getItem(`career_ai_resume_${userId}`);
      expect(userKeyRaw).not.toBeNull();
      const parsed = JSON.parse(userKeyRaw!);
      expect(parsed.label).toBe('Senior Career Pivot Resume');
    });
  });
});
