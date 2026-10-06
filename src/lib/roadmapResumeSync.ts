import type { ResumeDocument, ResumeSourceFact, RoadmapTask, ActualWorkDetails } from '../types';

export const RESUME_ROADMAP_SECTION_HEADER = 'VERIFIED ROADMAP MILESTONES (SELF-REPORTED)';

/**
 * Derives canonical milestone identifier for a task, grouping split segments
 * by their parent template ID.
 */
export function getCanonicalMilestoneId(task: RoadmapTask): string {
  return task.parentTaskId || task.templateId || task.id;
}

/**
 * Checks whether all split segments for a parent task are completed,
 * or if completion is only partial.
 */
export function getSegmentCompletionStatus(
  task: RoadmapTask,
  allTasks: RoadmapTask[]
): { isSplit: boolean; isAllCompleted: boolean; completedCount: number; totalSegments: number } {
  const isSplit = Boolean(task.parentTaskId && task.segmentCount && task.segmentCount > 1);
  if (!isSplit) {
    return {
      isSplit: false,
      isAllCompleted: task.status === 'completed',
      completedCount: task.status === 'completed' ? 1 : 0,
      totalSegments: 1,
    };
  }

  const parentId = task.parentTaskId!;
  const segments = allTasks.filter(t => t.parentTaskId === parentId || t.id === parentId);
  const completedCount = segments.filter(t => t.status === 'completed').length;
  const totalSegments = task.segmentCount || segments.length || 1;

  return {
    isSplit: true,
    isAllCompleted: completedCount >= totalSegments,
    completedCount,
    totalSegments,
  };
}

/**
 * Formats a resume milestone bullet point from a ResumeSourceFact.
 * Strictly respects:
 * 1. Manual user edits if provided.
 * 2. Learner's actual work descriptions when available.
 * 3. Truthful, self-reported educational progress when no actual work is described (NEVER generates "Built X" from planned goals).
 */
export function formatResumeMilestoneBullet(fact: ResumeSourceFact): string {
  if (fact.manualEdit && fact.manualEdit.trim()) {
    return fact.manualEdit.trim();
  }

  const roleTag = fact.roleName ? ` (${fact.roleName})` : '';
  const milestoneTitle = fact.deliverable || fact.claim?.replace(/^Completed study of |^Accomplished: /i, '') || 'Technical Milestone';

  // Path A: Learner described actual work
  if (fact.actualWork && fact.actualWork.whatLearnerDid?.trim()) {
    const work = fact.actualWork.whatLearnerDid.trim();
    const tech = fact.actualWork.technologiesUsed?.trim() ? ` using ${fact.actualWork.technologiesUsed.trim()}` : '';
    const outcome = fact.actualWork.outcomeOrLimitation?.trim() ? ` (${fact.actualWork.outcomeOrLimitation.trim()})` : '';
    const link = fact.actualWork.projectUrl?.trim() ? ` [Demo/Code: ${fact.actualWork.projectUrl.trim()}]` : '';

    return `• ${milestoneTitle}${roleTag}: ${work}${tech}${outcome}${link}`;
  }

  // Path B: Partial segment completion (never implies whole-project completion)
  if (fact.isSegmentPartial) {
    return `• ${milestoneTitle}${roleTag} — Completed partial milestone segment. (Self-reported learning progress)`;
  }

  // Path C: Marked complete without actual work description
  // Truthful learning completion only — strictly no invented "Built X" claims!
  return `• ${milestoneTitle}${roleTag} — Completed milestone learning topics and deliverables. (Self-reported completion)`;
}

export interface SyncTaskParams {
  currentResumeDoc: ResumeDocument;
  task: RoadmapTask;
  allRoadmapTasks: RoadmapTask[];
  roleId: number;
  roleName: string;
  userId: string;
  action: 'complete' | 'uncomplete' | 'update_work';
  updatedActualWork?: ActualWorkDetails;
}

/**
 * Pure and idempotent synchronization of a roadmap task into the resume document.
 * Guarantees:
 * - One source entry per canonical milestone.
 * - Split segments grouped by parent milestone; partial segments do not imply whole completion.
 * - No duplicate bullets on repeated saves or refreshes.
 * - Manual resume edits survive work sync.
 * - Reverting completion marks entry outdated/ineligible without erasing manual edits.
 */
export function syncRoadmapTaskToResumeDoc({
  currentResumeDoc,
  task,
  allRoadmapTasks,
  roleId,
  roleName,
  userId,
  action,
  updatedActualWork,
}: SyncTaskParams): ResumeDocument {
  const canonicalMilestoneId = getCanonicalMilestoneId(task);
  const factId = `fact-rm-${canonicalMilestoneId}`;
  const existingFacts = currentResumeDoc.facts || [];
  const existingFact = existingFacts.find(f => f.id === factId);

  const segmentStatus = getSegmentCompletionStatus(task, allRoadmapTasks);
  const isSegmentPartial = segmentStatus.isSplit && !segmentStatus.isAllCompleted;

  const completionDate = task.completedAt || new Date().toISOString().split('T')[0];
  const actualWork = updatedActualWork !== undefined ? updatedActualWork : task.actualWork || existingFact?.actualWork;

  // --- ACTION: UNCOMPLETE / UNDO ---
  if (action === 'uncomplete') {
    // If not split, or if all segments are now incomplete
    const remainingCompleted = segmentStatus.completedCount;
    if (remainingCompleted === 0 || !segmentStatus.isSplit) {
      if (!existingFact) {
        return currentResumeDoc;
      }

      // If user had manual edits, preserve the fact marked outdated / review needed
      // Otherwise (unreviewed generated entry), exclude it from final facts output appropriately
      let updatedFacts: ResumeSourceFact[];
      if (existingFact.manualEdit) {
        const updatedFact: ResumeSourceFact = {
          ...existingFact,
          verified: false,
          isOutdated: true,
          inclusionStatus: 'outdated',
          sourceStatus: 'self_reported',
        };
        updatedFacts = existingFacts.map(f => (f.id === factId ? updatedFact : f));
      } else {
        updatedFacts = existingFacts.filter(f => f.id !== factId);
      }

      // In rawText:
      // If user had manual edits on this bullet, preserve text so user can review it!
      // If user did NOT manually edit it, cleanly remove the auto-generated bullet.
      let updatedRawText = currentResumeDoc.rawText;
      if (!existingFact.manualEdit) {
        const lines = updatedRawText.split('\n');
        const filteredLines = lines.filter(line => {
          // Check if line corresponds to this task/milestone
          const matchesTitle = line.includes(task.title);
          const isBullet = line.trim().startsWith('•');
          return !(matchesTitle && isBullet);
        });
        updatedRawText = filteredLines.join('\n');

        // If no more roadmap bullets exist, clean up the header
        const hasOtherRoadmapBullets = updatedFacts.some(
          f => f.id.startsWith('fact-rm-') && !f.isOutdated && f.inclusionStatus === 'included'
        );
        if (!hasOtherRoadmapBullets) {
          updatedRawText = updatedRawText.replace(new RegExp(`\\n*${RESUME_ROADMAP_SECTION_HEADER}\\s*`, 'g'), '').trim();
        }
      }

      return {
        ...currentResumeDoc,
        facts: updatedFacts,
        rawText: updatedRawText,
      };
    }
  }

  // --- ACTION: COMPLETE or UPDATE_WORK ---
  const hasWorkDescription = Boolean(actualWork?.whatLearnerDid && actualWork.whatLearnerDid.trim());

  const factText = hasWorkDescription
    ? `Accomplishment for ${roleName}: ${task.title}. ${actualWork!.whatLearnerDid!.trim()}${
        actualWork!.technologiesUsed ? ` using ${actualWork!.technologiesUsed.trim()}` : ''
      }${actualWork!.outcomeOrLimitation ? ` (${actualWork!.outcomeOrLimitation.trim()})` : ''} on ${completionDate}.`
    : `Self-reported milestone completion for ${roleName}: ${task.title}. Completed planned exercises and study deliverables on ${completionDate}.${
        isSegmentPartial ? ` (Partial: Segment completed)` : ''
      }`;

  const factClaim = hasWorkDescription
    ? `Accomplished: ${actualWork!.whatLearnerDid!.trim()} (${roleName})`
    : `Completed study of ${task.title} (${roleName})`;

  const evidenceSnippet = hasWorkDescription
    ? `Technologies: ${actualWork!.technologiesUsed || 'Verified tools'} · Contribution: ${
        actualWork!.ownContribution || 'Direct implementation'
      }${actualWork!.projectUrl ? ` · Link: ${actualWork!.projectUrl}` : ''}`
    : `Planned deliverable: ${task.deliverable}`;

  const newFact: ResumeSourceFact = {
    id: factId,
    category: 'project',
    text: factText,
    claim: factClaim,
    evidenceSnippet,
    deliverable: task.title,
    verifiedAt: completionDate,
    verified: true,
    source: 'roadmap',
    userId,
    roleId,
    roleName,
    milestoneId: canonicalMilestoneId,
    parentMilestoneId: task.parentTaskId,
    sourceRef: canonicalMilestoneId,
    completedAt: completionDate,
    actualWork,
    sourceStatus: 'self_reported',
    inclusionStatus: existingFact?.inclusionStatus === 'dismissed' ? 'dismissed' : 'included',
    manualEdit: existingFact?.manualEdit,
    isOutdated: false,
    isSegmentPartial,
  };

  // Update or append fact idempotently
  const updatedFacts = existingFact
    ? existingFacts.map(f => (f.id === factId ? newFact : f))
    : [...existingFacts, newFact];

  // Update rawText only if inclusionStatus is 'included'
  let updatedRawText = currentResumeDoc.rawText;
  if (newFact.inclusionStatus === 'included') {
    const bulletText = formatResumeMilestoneBullet(newFact);

    // Check if an existing bullet for this milestone is in the text
    const lines = updatedRawText.split('\n');
    const existingBulletIndex = lines.findIndex(line => {
      const isBullet = line.trim().startsWith('•');
      const matchesTitle = line.includes(task.title);
      return isBullet && matchesTitle;
    });

    if (existingBulletIndex >= 0) {
      // If user has a manual edit on this fact, PRESERVE it unless this is an explicit update with new work
      if (!newFact.manualEdit || action === 'update_work') {
        lines[existingBulletIndex] = bulletText;
        updatedRawText = lines.join('\n');
      }
    } else {
      // Append bullet under header idempotently
      if (updatedRawText.includes(RESUME_ROADMAP_SECTION_HEADER)) {
        updatedRawText = updatedRawText.replace(
          RESUME_ROADMAP_SECTION_HEADER,
          `${RESUME_ROADMAP_SECTION_HEADER}\n${bulletText}`
        );
      } else {
        const trimmed = updatedRawText.trim();
        updatedRawText = trimmed
          ? `${trimmed}\n\n${RESUME_ROADMAP_SECTION_HEADER}\n${bulletText}`
          : `${RESUME_ROADMAP_SECTION_HEADER}\n${bulletText}`;
      }
    }
  }

  return {
    ...currentResumeDoc,
    facts: updatedFacts,
    rawText: updatedRawText,
  };
}

/**
 * Toggles inclusion/exclusion of a specific roadmap fact in the resume draft,
 * or applies a custom wording edit without overwriting other resume content.
 */
export function updateFactInclusionOrEdit(
  currentResumeDoc: ResumeDocument,
  factId: string,
  newInclusionStatus: 'included' | 'dismissed',
  customEdit?: string
): ResumeDocument {
  const existingFacts = currentResumeDoc.facts || [];
  const targetFact = existingFacts.find(f => f.id === factId);
  if (!targetFact) return currentResumeDoc;

  const updatedFact: ResumeSourceFact = {
    ...targetFact,
    inclusionStatus: newInclusionStatus,
    manualEdit: customEdit !== undefined ? customEdit : targetFact.manualEdit,
  };

  const updatedFacts = existingFacts.map(f => (f.id === factId ? updatedFact : f));
  let updatedRawText = currentResumeDoc.rawText;
  const milestoneTitle = targetFact.deliverable || targetFact.claim || '';

  if (newInclusionStatus === 'dismissed') {
    // Remove from rawText
    const lines = updatedRawText.split('\n');
    const filtered = lines.filter(l => !(l.trim().startsWith('•') && l.includes(milestoneTitle)));
    updatedRawText = filtered.join('\n');
  } else {
    // Include or update in rawText
    const bullet = formatResumeMilestoneBullet(updatedFact);
    const lines = updatedRawText.split('\n');
    const existingIndex = lines.findIndex(l => l.trim().startsWith('•') && l.includes(milestoneTitle));
    if (existingIndex >= 0) {
      lines[existingIndex] = bullet;
      updatedRawText = lines.join('\n');
    } else {
      if (updatedRawText.includes(RESUME_ROADMAP_SECTION_HEADER)) {
        updatedRawText = updatedRawText.replace(
          RESUME_ROADMAP_SECTION_HEADER,
          `${RESUME_ROADMAP_SECTION_HEADER}\n${bullet}`
        );
      } else {
        const trimmed = updatedRawText.trim();
        updatedRawText = trimmed
          ? `${trimmed}\n\n${RESUME_ROADMAP_SECTION_HEADER}\n${bullet}`
          : `${RESUME_ROADMAP_SECTION_HEADER}\n${bullet}`;
      }
    }
  }

  return {
    ...currentResumeDoc,
    facts: updatedFacts,
    rawText: updatedRawText,
  };
}
