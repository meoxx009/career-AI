import type {
  UserProfile,
  ResumeDocument,
  RoadmapTask,
  SkillObservation,
} from '../types';

/**
 * Synthetic Rahul Sharma profile fixture.
 * STRICT PRIVACY CONTRACT:
 * - This fixture contains purely fictional demo data.
 * - Used exclusively for the deterministic offline/guest walk-through.
 * - Must never overwrite or be persisted to any signed-in user's profile.
 */
export const FICTIONAL_DEMO_BADGE = 'Fictional demo data';

export const DEMO_RAHUL_PROFILE: UserProfile = {
  id: 'synthetic-demo-rahul-01',
  displayName: 'Rahul Sharma (Demo)',
  username: 'rahul_sharma',
  contactEmail: 'rahul.sharma.demo@careerai.local',
  profileImageUrl: '',
  profileImageStorageKey: '',
  learnerStage: 'undergraduate',
  degree: 'BTech / BE Computer Science',
  branch: 'Computer Science & Engineering',
  studyYear: '3rd Year',
  hoursPerWeek: 8,
  preferredRoles: ['backend-developer'],
  preferredRoleIds: [1],
  targetRoleId: 1,
  targetRoleSlug: 'backend-developer',
  cgpa: '7.8',
  currentSkills: ['Programming logic', 'Data structures', 'Programming language', 'SQL', 'Git'],
  interests: ['software-development', 'backend', 'data-analysis'],
  isGuestDemo: true,
};

/**
 * Initial diagnostic observations for Rahul:
 * - Measured levels 1-2 for Python, SQL, and logic.
 * - Explicit nulls for unassessed skills (never coerced to 0).
 */
export const DEMO_RAHUL_OBSERVATIONS: SkillObservation[] = [
  {
    skill_id: 1, // Programming logic
    value: 2,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
    rubricVersion: 'v1',
    confidence: 'High',
  },
  {
    skill_id: 2, // Data structures
    value: 1,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
    rubricVersion: 'v1',
    confidence: 'Medium',
  },
  {
    skill_id: 3, // Programming language (Python)
    value: 2,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
    rubricVersion: 'v1',
    confidence: 'High',
  },
  {
    skill_id: 4, // SQL
    value: 2,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
    rubricVersion: 'v1',
    confidence: 'High',
  },
  {
    skill_id: 5, // REST APIs
    value: null, // Unknown / unassessed
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
    confidence: 'Needs more evidence',
  },
  {
    skill_id: 7, // Testing
    value: null,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
  },
  {
    skill_id: 8, // Git
    value: 2,
    source: 'self_attested_project',
    observedAt: '2026-10-02T10:00:00Z',
  },
  {
    skill_id: 9, // Communication
    value: null,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
  },
  {
    skill_id: 11, // Cloud basics
    value: null,
    source: 'diagnostic',
    observedAt: '2026-10-02T10:00:00Z',
  },
  {
    skill_id: 12, // Project evidence
    value: 1,
    source: 'self_attested_project',
    observedAt: '2026-10-02T10:00:00Z',
  },
];

export const DEMO_RAHUL_ROADMAP_TASKS: RoadmapTask[] = [
  {
    id: 'rb01',
    weekNumber: 1,
    title: 'Programming and HTTP foundations',
    description: 'Review functions, data flow, HTTP requests, status codes and JSON.',
    deliverable: 'Write a one-page request/response note and solve five small logic tasks.',
    estimatedHours: 5,
    resourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    status: 'completed',
    completedAt: '2026-10-01',
  },
  {
    id: 'rb02',
    weekNumber: 2,
    title: 'SQL and API basics',
    description: 'Design a small relational schema and implement CRUD endpoint concepts.',
    deliverable: 'Document tables and six example API requests with error cases.',
    estimatedHours: 6,
    prerequisiteTaskId: 'rb01',
    resourceUrl: 'https://www.postgresql.org/docs/current/tutorial.html',
    status: 'in_progress',
  },
  {
    id: 'rb03',
    weekNumber: 3,
    title: 'Testing and project evidence',
    description: 'Add validation, tests and a clear README to a small backend project.',
    deliverable: 'Publish a README with setup, test output and limitations; do not invent usage metrics.',
    estimatedHours: 6,
    prerequisiteTaskId: 'rb02',
    resourceUrl: 'https://testing-library.com/docs/',
    status: 'todo',
  },
  {
    id: 'rb04',
    weekNumber: 4,
    title: 'Deploy and explain',
    description: 'Practise deployment concepts and explain architecture and trade-offs.',
    deliverable: 'Record a text STAR-style project explanation and complete one mock interview.',
    estimatedHours: 4,
    prerequisiteTaskId: 'rb03',
    resourceUrl: 'https://12factor.net/',
    status: 'todo',
  },
];

export const DEMO_RAHUL_RESUME: ResumeDocument = {
  id: 'resume-demo-rahul',
  userId: 'synthetic-demo-rahul-01',
  label: 'Rahul Sharma — Entry Backend Resume (Draft)',
  rawText: `Rahul Sharma
Computer Science Student · 3rd Year · B.Tech CSE

PROJECTS
• Mini Task Management CLI (Python)
  - Developed a command-line task organizer storing tasks in JSON format.
  - Implemented command parsing with argparse and basic error handling for corrupt files.
  - Added unit test suite using pytest covering CRUD operations.

• Student Library Queries (SQLite)
  - Wrote SQL queries using INNER JOIN, GROUP BY, and HAVING to report book borrow frequency.
  - Handled foreign key constraints between members and book checkout records.

TECHNICAL SKILLS
Languages: Python, SQL
Tools & Practices: Git, Unit Testing (pytest), Markdown documentation`,
  facts: [
    {
      id: 'fact-01',
      category: 'project',
      text: 'Built CLI task organizer in Python with JSON storage.',
      verified: true,
    },
    {
      id: 'fact-02',
      category: 'project',
      text: 'Wrote unit tests with pytest covering CRUD functionality.',
      verified: true,
    },
    {
      id: 'fact-03',
      category: 'project',
      text: 'Authored SQLite queries with joins and aggregations for library checkout records.',
      verified: true,
    },
    {
      id: 'fact-04',
      category: 'skill',
      text: 'Experience with Git version control and Markdown documentation.',
      verified: true,
    },
  ],
};
