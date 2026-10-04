/**
 * Canonical Resource Registry and Resolver
 *
 * Provides verified, authoritative, external HTTPS learning resources
 * for all 33 career paths and 165 curriculum milestones.
 *
 * Guarantees that no milestone or task resolves to unresolvable local
 * hosts (e.g. careerai.local) and heals legacy stored roadmaps.
 */

import type { RoadmapTask } from '../types';

/**
 * Authoritative external documentation and learning guides
 * for all 165 curriculum milestones across 33 career roles.
 */
export const CANONICAL_MILESTONE_RESOURCES: Record<string, string> = {
  // 1. Backend Developer
  'cur-backend-1': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
  'cur-backend-2': 'https://www.postgresql.org/docs/current/tutorial-sql.html',
  'cur-backend-3': 'https://restfulapi.net/',
  'cur-backend-4': 'https://testing-library.com/docs/',
  'cur-backend-5': 'https://12factor.net/',

  // 2. Frontend Developer
  'cur-frontend-1': 'https://www.w3.org/WAI/tutorials/forms/',
  'cur-frontend-2': 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grid',
  'cur-frontend-3': 'https://react.dev/learn/state-a-components-memory',
  'cur-frontend-4': 'https://www.w3.org/WAI/test-evaluate/',
  'cur-frontend-5': 'https://developer.mozilla.org/en-US/docs/Web/Accessibility',

  // 3. Data Analyst
  'cur-data-1': 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/06_calculate_statistics.html',
  'cur-data-2': 'https://www.postgresql.org/docs/current/tutorial-agg.html',
  'cur-data-3': 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/',
  'cur-data-4': 'https://www.data-to-viz.com/',
  'cur-data-5': 'https://www.storytellingwithdata.com/',

  // 4. Software Engineer
  'cur-se-1': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures',
  'cur-se-2': 'https://refactoring.guru/design-patterns',
  'cur-se-3': 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS',
  'cur-se-4': 'https://vitest.dev/guide/',
  'cur-se-5': 'https://google.github.io/eng-practices/review/',

  // 5. Full Stack Developer
  'cur-fs-1': 'https://12factor.net/',
  'cur-fs-2': 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
  'cur-fs-3': 'https://react.dev/learn',
  'cur-fs-4': 'https://playwright.dev/docs/intro',
  'cur-fs-5': 'https://sre.google/sre-book/postmortem-culture/',

  // 6. Mobile Developer
  'cur-mob-1': 'https://reactnative.dev/docs/navigation',
  'cur-mob-2': 'https://reactnative.dev/docs/asyncstorage',
  'cur-mob-3': 'https://reactnative.dev/docs/getting-started',
  'cur-mob-4': 'https://reactnative.dev/docs/testing-overview',
  'cur-mob-5': 'https://developer.android.com/topic/performance/memory',

  // 7. QA Engineer
  'cur-qa-1': 'https://www.istqb.org/',
  'cur-qa-2': 'https://testing-library.com/docs/guiding-principles/',
  'cur-qa-3': 'https://learning.postman.com/docs/writing-scripts/test-scripts/',
  'cur-qa-4': 'https://playwright.dev/docs/test-components',
  'cur-qa-5': 'https://martinfowler.com/articles/practical-test-pyramid.html',

  // 8. SDET Engineer
  'cur-sdet-1': 'https://playwright.dev/docs/pom',
  'cur-sdet-2': 'https://mswjs.io/docs/',
  'cur-sdet-3': 'https://docs.github.com/en/actions',
  'cur-sdet-4': 'https://k6.io/docs/',
  'cur-sdet-5': 'https://martinfowler.com/articles/nonDeterminism.html',

  // 9. DevOps Engineer
  'cur-devops-1': 'https://linuxjourney.com/',
  'cur-devops-2': 'https://docs.docker.com/build/building/multi-stage/',
  'cur-devops-3': 'https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions',
  'cur-devops-4': 'https://developer.hashicorp.com/terraform/intro',
  'cur-devops-5': 'https://sre.google/sre-book/postmortem-culture/',

  // 10. Cloud Engineer
  'cur-cloud-1': 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
  'cur-cloud-2': 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html',
  'cur-cloud-3': 'https://aws.amazon.com/serverless/',
  'cur-cloud-4': 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html',
  'cur-cloud-5': 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html',

  // 11. SRE Engineer
  'cur-sre-1': 'https://sre.google/sre-book/service-level-objectives/',
  'cur-sre-2': 'https://prometheus.io/docs/introduction/overview/',
  'cur-sre-3': 'https://grafana.com/docs/grafana/latest/',
  'cur-sre-4': 'https://principlesofchaos.org/',
  'cur-sre-5': 'https://sre.google/sre-book/postmortem-culture/',

  // 12. Cybersecurity Engineer
  'cur-sec-1': 'https://www.wireshark.org/docs/',
  'cur-sec-2': 'https://owasp.org/www-project-top-ten/',
  'cur-sec-3': 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
  'cur-sec-4': 'https://owasp.org/www-community/Threat_Modeling',
  'cur-sec-5': 'https://csrc.nist.gov/pubs/sp/800/61/r2/final',

  // 13. Embedded Systems Engineer
  'cur-emb-1': 'https://www.arm.com/architecture/cpu/cortex-m',
  'cur-emb-2': 'https://learn.sparkfun.com/tutorials/serial-communication/all',
  'cur-emb-3': 'https://www.freertos.org/Embedded-RTOS-Queues.html',
  'cur-emb-4': 'https://www.freertos.org/Documentation/RTOS_book.html',
  'cur-emb-5': 'https://www.keysight.com/us/en/assets/7018-06843/application-notes/5989-5733.pdf',

  // 14. IoT Engineer
  'cur-iot-1': 'https://mqtt.org/',
  'cur-iot-2': 'https://nodered.org/docs/',
  'cur-iot-3': 'https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html',
  'cur-iot-4': 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/ota.html',
  'cur-iot-5': 'https://docs.nordicsemi.com/',

  // 15. Systems Engineer
  'cur-sys-1': 'https://man7.org/linux/man-pages/man2/syscalls.2.html',
  'cur-sys-2': 'https://man7.org/linux/man-pages/man7/pipe.7.html',
  'cur-sys-3': 'https://sourceware.org/glibc/wiki/MallocInternals',
  'cur-sys-4': 'https://valgrind.org/docs/manual/quick-start.html',
  'cur-sys-5': 'https://man7.org/linux/man-pages/man7/pthreads.7.html',

  // 16. Data Engineer
  'cur-de-1': 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/',
  'cur-de-2': 'https://airflow.apache.org/docs/apache-airflow/stable/tutorial/pipeline.html',
  'cur-de-3': 'https://docs.greatexpectations.io/docs/',
  'cur-de-4': 'https://parquet.apache.org/documentation/latest/',
  'cur-de-5': 'https://sre.google/sre-book/postmortem-culture/',

  // 17. Data Scientist
  'cur-ds-1': 'https://docs.scipy.org/doc/scipy/reference/stats.html',
  'cur-ds-2': 'https://scikit-learn.org/stable/modules/preprocessing.html',
  'cur-ds-3': 'https://scikit-learn.org/stable/supervised_learning.html',
  'cur-ds-4': 'https://shap.readthedocs.io/en/latest/',
  'cur-ds-5': 'https://www.storytellingwithdata.com/',

  // 18. Machine Learning Engineer
  'cur-mle-1': 'https://pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html',
  'cur-mle-2': 'https://mlflow.org/docs/latest/index.html',
  'cur-mle-3': 'https://fastapi.tiangolo.com/',
  'cur-mle-4': 'https://docs.docker.com/guides/get-started/',
  'cur-mle-5': 'https://docs.evidentlyai.com/',

  // 19. AI Engineer
  'cur-ai-1': 'https://huggingface.co/blog/getting-started-with-embeddings',
  'cur-ai-2': 'https://platform.openai.com/docs/guides/structured-outputs',
  'cur-ai-3': 'https://python.langchain.com/docs/tutorials/chatbot/',
  'cur-ai-4': 'https://platform.openai.com/docs/guides/rate-limits',
  'cur-ai-5': 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',

  // 20. Generative AI Engineer
  'cur-genai-1': 'https://jalammar.github.io/illustrated-transformer/',
  'cur-genai-2': 'https://huggingface.co/docs/peft/index',
  'cur-genai-3': 'https://docs.pydantic.dev/latest/',
  'cur-genai-4': 'https://docs.ragas.io/en/stable/concepts/metrics/',
  'cur-genai-5': 'https://platform.openai.com/docs/guides/optimizing-llm-accuracy',

  // 21. LLM Application Engineer
  'cur-llm-1': 'https://www.promptingguide.ai/',
  'cur-llm-2': 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events',
  'cur-llm-3': 'https://python.langchain.com/docs/tutorials/agents/',
  'cur-llm-4': 'https://martinfowler.com/bliki/CircuitBreaker.html',
  'cur-llm-5': 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',

  // 22. RAG Engineer
  'cur-rag-1': 'https://www.pinecone.io/learn/chunking-strategies/',
  'cur-rag-2': 'https://weaviate.io/blog/hybrid-search-explained',
  'cur-rag-3': 'https://www.sbert.net/examples/applications/retrieve_rerank/README.html',
  'cur-rag-4': 'https://docs.ragas.io/en/stable/',
  'cur-rag-5': 'https://arxiv.org/abs/2312.10997',

  // 23. NLP Engineer
  'cur-nlp-1': 'https://docs.python.org/3/library/re.html',
  'cur-nlp-2': 'https://spacy.io/usage/spacy-101',
  'cur-nlp-3': 'https://huggingface.co/docs/transformers/training',
  'cur-nlp-4': 'https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html',
  'cur-nlp-5': 'https://huggingface.co/docs/optimum/index',

  // 24. MLOps Engineer
  'cur-mlops-1': 'https://mlflow.org/docs/latest/tracking.html',
  'cur-mlops-2': 'https://dvc.org/doc/start',
  'cur-mlops-3': 'https://cml.dev/doc',
  'cur-mlops-4': 'https://martinfowler.com/bliki/CanaryRelease.html',
  'cur-mlops-5': 'https://docs.evidentlyai.com/',

  // 25. Computer Vision Engineer
  'cur-cv-1': 'https://docs.opencv.org/4.x/d9/df8/tutorial_root.html',
  'cur-cv-2': 'https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html',
  'cur-cv-3': 'https://docs.ultralytics.com/',
  'cur-cv-4': 'https://onnxruntime.ai/docs/',
  'cur-cv-5': 'https://scikit-learn.org/stable/modules/model_evaluation.html',

  // 26. Business Intelligence Analyst
  'cur-bi-1': 'https://learn.microsoft.com/en-us/power-bi/guidance/star-schema',
  'cur-bi-2': 'https://www.postgresql.org/docs/current/sql-createview.html',
  'cur-bi-3': 'https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards',
  'cur-bi-4': 'https://learn.microsoft.com/en-us/power-bi/enterprise/service-admin-rls',
  'cur-bi-5': 'https://www.storytellingwithdata.com/',

  // 27. UI/UX Designer
  'cur-uiux-1': 'https://www.nngroup.com/articles/persona-scope/',
  'cur-uiux-2': 'https://www.nngroup.com/articles/wireframes/',
  'cur-uiux-3': 'https://m3.material.io/foundations/design-tokens/overview',
  'cur-uiux-4': 'https://www.nngroup.com/articles/usability-testing-101/',
  'cur-uiux-5': 'https://www.figma.com/best-practices/guide-to-developer-handoff/',

  // 28. Product Designer
  'cur-pd-1': 'https://www.nngroup.com/articles/design-thinking/',
  'cur-pd-2': 'https://www.nngroup.com/articles/service-blueprints-definition/',
  'cur-pd-3': 'https://m3.material.io/',
  'cur-pd-4': 'https://www.optimizely.com/optimization-glossary/ab-testing/',
  'cur-pd-5': 'https://www.nngroup.com/articles/design-critiques/',

  // 29. UX Researcher
  'cur-uxr-1': 'https://www.nngroup.com/articles/user-interviews/',
  'cur-uxr-2': 'https://www.nngroup.com/articles/affinity-diagram/',
  'cur-uxr-3': 'https://www.nngroup.com/articles/card-sorting-definition/',
  'cur-uxr-4': 'https://www.nngroup.com/articles/reports-that-work/',
  'cur-uxr-5': 'https://www.nngroup.com/articles/stakeholder-interviews/',

  // 30. Product Manager
  'cur-pm-1': 'https://www.svpg.com/assessing-product-opportunities/',
  'cur-pm-2': 'https://www.atlassian.com/agile/product-management/requirements',
  'cur-pm-3': 'https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/',
  'cur-pm-4': 'https://www.atlassian.com/agile/product-management/product-roadmaps',
  'cur-pm-5': 'https://www.svpg.com/product-fail/',

  // 31. Technical Product Manager
  'cur-tpm-1': 'https://martinfowler.com/articles/architecture-use-cases.html',
  'cur-tpm-2': 'https://spec.openapis.org/oas/latest.html',
  'cur-tpm-3': 'https://swagger.io/docs/specification/about/',
  'cur-tpm-4': 'https://martinfowler.com/bliki/TechnicalDebtQuadrant.html',
  'cur-tpm-5': 'https://12factor.net/',

  // 32. Business Analyst
  'cur-ba-1': 'https://www.bpmn.org/',
  'cur-ba-2': 'https://www.iiba.org/babok-guide/',
  'cur-ba-3': 'https://www.atlassian.com/agile/project-management/gap-analysis',
  'cur-ba-4': 'https://www.guru99.com/user-acceptance-testing.html',
  'cur-ba-5': 'https://www.prosci.com/methodology/adkar',

  // 33. Technical Writer
  'cur-tw-1': 'https://developers.google.com/style',
  'cur-tw-2': 'https://spec.openapis.org/oas/latest.html',
  'cur-tw-3': 'https://developers.google.com/tech-writing',
  'cur-tw-4': 'https://docusaurus.io/docs',
  'cur-tw-5': 'https://www.writethedocs.org/guide/',
};

/**
 * Fallback authoritative learning references by path slug
 */
export const PATH_FALLBACK_RESOURCES: Record<string, string> = {
  'backend-developer': 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
  'frontend-developer': 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
  'data-analyst': 'https://pandas.pydata.org/docs/',
  'software-engineer': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'full-stack-developer': 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
  'mobile-developer': 'https://reactnative.dev/docs/getting-started',
  'qa-engineer': 'https://testing-library.com/docs/',
  'sdet-engineer': 'https://playwright.dev/docs/intro',
  'devops-engineer': 'https://docs.docker.com/',
  'cloud-engineer': 'https://docs.aws.amazon.com/',
  'sre-engineer': 'https://sre.google/sre-book/table-of-contents/',
  'cybersecurity-engineer': 'https://owasp.org/',
  'embedded-systems-engineer': 'https://www.freertos.org/',
  'iot-engineer': 'https://mqtt.org/',
  'systems-engineer': 'https://man7.org/linux/man-pages/',
  'data-engineer': 'https://airflow.apache.org/docs/',
  'data-scientist': 'https://scikit-learn.org/stable/',
  'machine-learning-engineer': 'https://pytorch.org/docs/stable/index.html',
  'ai-engineer': 'https://huggingface.co/docs',
  'generative-ai-engineer': 'https://huggingface.co/docs',
  'llm-application-engineer': 'https://www.promptingguide.ai/',
  'rag-engineer': 'https://docs.ragas.io/',
  'nlp-engineer': 'https://spacy.io/',
  'mlops-engineer': 'https://mlflow.org/docs/latest/index.html',
  'computer-vision-engineer': 'https://docs.opencv.org/',
  'bi-analyst': 'https://learn.microsoft.com/en-us/power-bi/',
  'ui-ux-designer': 'https://www.nngroup.com/articles/',
  'product-designer': 'https://www.nngroup.com/articles/',
  'ux-researcher': 'https://www.nngroup.com/articles/',
  'product-manager': 'https://www.svpg.com/',
  'technical-product-manager': 'https://martinfowler.com/',
  'business-analyst': 'https://www.iiba.org/',
  'technical-writer': 'https://developers.google.com/tech-writing',
};

/**
 * Checks whether a URL is null, empty, malformed, or points to an unresolvable
 * placeholder host (e.g. *.local, careerai.local, localhost, etc.).
 */
export function isInvalidOrPlaceholderUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  // Reject unsafe schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    // Must be HTTP or HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true;
    }
    const host = parsed.hostname.toLowerCase();
    // Reject local, unresolvable or dummy hosts
    if (
      host === 'careerai.local' ||
      host.endsWith('.local') ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'example.com' ||
      host.endsWith('.example.com')
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Safely sanitizes a resource URL. Returns the clean URL string,
 * or null if invalid, dangerous, or pointing to a placeholder host.
 */
export function sanitizeResourceUrl(url?: string | null): string | null {
  if (isInvalidOrPlaceholderUrl(url)) return null;
  return url!.trim();
}

/**
 * Helper to extract path slug and index from template id like "tmpl-ai-engineer-1"
 */
function parseTemplateId(id?: string): { slug?: string; index?: number } {
  if (!id) return {};
  const match = id.match(/^tmpl-([a-z0-9-]+)-(\d+)$/);
  if (match) {
    return { slug: match[1], index: parseInt(match[2], 10) };
  }
  return {};
}

/**
 * Helper to map (slug, index 1..5) to milestone ID
 */
const SLUG_TO_PREFIX: Record<string, string> = {
  'backend-developer': 'backend',
  'frontend-developer': 'frontend',
  'data-analyst': 'data',
  'software-engineer': 'se',
  'full-stack-developer': 'fs',
  'mobile-developer': 'mob',
  'qa-engineer': 'qa',
  'sdet-engineer': 'sdet',
  'devops-engineer': 'devops',
  'cloud-engineer': 'cloud',
  'sre-engineer': 'sre',
  'cybersecurity-engineer': 'sec',
  'embedded-systems-engineer': 'emb',
  'iot-engineer': 'iot',
  'systems-engineer': 'sys',
  'data-engineer': 'de',
  'data-scientist': 'ds',
  'machine-learning-engineer': 'mle',
  'ai-engineer': 'ai',
  'generative-ai-engineer': 'genai',
  'llm-application-engineer': 'llm',
  'rag-engineer': 'rag',
  'nlp-engineer': 'nlp',
  'mlops-engineer': 'mlops',
  'computer-vision-engineer': 'cv',
  'bi-analyst': 'bi',
  'ui-ux-designer': 'uiux',
  'product-designer': 'pd',
  'ux-researcher': 'uxr',
  'product-manager': 'pm',
  'technical-product-manager': 'tpm',
  'business-analyst': 'ba',
  'technical-writer': 'tw',
};

/**
 * Resolves a curriculum item's genuine resource URL
 */
export function resolveCurriculumResourceUrl(
  curriculumId: string,
  pathSlug?: string,
  _title?: string
): string {
  if (CANONICAL_MILESTONE_RESOURCES[curriculumId]) {
    return CANONICAL_MILESTONE_RESOURCES[curriculumId];
  }
  if (pathSlug && PATH_FALLBACK_RESOURCES[pathSlug]) {
    return PATH_FALLBACK_RESOURCES[pathSlug];
  }
  return 'https://developer.mozilla.org/en-US/docs/Learn_web_development';
}

/**
 * Resolves the genuine external learning resource for a roadmap task.
 * If the task already has a valid, non-placeholder URL, it is returned.
 * If invalid, empty, or pointing to careerai.local, it is repaired using
 * the task's metadata (id, parentTaskId, title, or pathSlug).
 */
export function resolveTaskResource(
  task: Partial<RoadmapTask>,
  pathSlug?: string
): string {
  // 1. If existing resourceUrl is already valid and not a placeholder, keep it
  if (task.resourceUrl && !isInvalidOrPlaceholderUrl(task.resourceUrl)) {
    return task.resourceUrl.trim();
  }

  // 2. Try milestone ID directly
  if (task.id && CANONICAL_MILESTONE_RESOURCES[task.id]) {
    return CANONICAL_MILESTONE_RESOURCES[task.id];
  }

  // 3. Try base task ID for split segments (e.g. "cur-ai-1__s0" or "tmpl-ai-engineer-1__s0")
  const rawId = task.parentTaskId || task.id || '';
  const baseId = rawId.split('__s')[0];

  if (CANONICAL_MILESTONE_RESOURCES[baseId]) {
    return CANONICAL_MILESTONE_RESOURCES[baseId];
  }

  // 4. Try template ID parse: tmpl-[slug]-[index]
  const { slug: parsedSlug, index: parsedIndex } = parseTemplateId(baseId);
  const activeSlug = pathSlug || parsedSlug;
  if (activeSlug && parsedIndex && parsedIndex >= 1 && parsedIndex <= 5) {
    const prefix = SLUG_TO_PREFIX[activeSlug];
    if (prefix) {
      const candidateCurId = `cur-${prefix}-${parsedIndex}`;
      if (CANONICAL_MILESTONE_RESOURCES[candidateCurId]) {
        return CANONICAL_MILESTONE_RESOURCES[candidateCurId];
      }
    }
  }

  // 5. Try weekNumber if pathSlug is known
  if (activeSlug && task.weekNumber && task.weekNumber >= 1 && task.weekNumber <= 5) {
    const prefix = SLUG_TO_PREFIX[activeSlug];
    if (prefix) {
      const candidateCurId = `cur-${prefix}-${task.weekNumber}`;
      if (CANONICAL_MILESTONE_RESOURCES[candidateCurId]) {
        return CANONICAL_MILESTONE_RESOURCES[candidateCurId];
      }
    }
  }

  // 6. Match by specific title keywords (e.g. "Vector Embeddings & Semantic Similarity Search")
  const title = (task.title || '').toLowerCase();
  if (title.includes('vector embedding') || title.includes('semantic similarity')) {
    return CANONICAL_MILESTONE_RESOURCES['cur-ai-1'];
  }
  if (title.includes('structured output') || title.includes('json schema')) {
    return CANONICAL_MILESTONE_RESOURCES['cur-ai-2'];
  }
  if (title.includes('multi-turn') && title.includes('ai')) {
    return CANONICAL_MILESTONE_RESOURCES['cur-ai-3'];
  }
  if (title.includes('token budgeting') || title.includes('latency benchmark')) {
    return CANONICAL_MILESTONE_RESOURCES['cur-ai-4'];
  }
  if (title.includes('guardrails') || title.includes('prompt injection')) {
    return CANONICAL_MILESTONE_RESOURCES['cur-ai-5'];
  }

  // 7. Path fallback
  if (activeSlug && PATH_FALLBACK_RESOURCES[activeSlug]) {
    return PATH_FALLBACK_RESOURCES[activeSlug];
  }

  // 8. Universal safe fallback
  return 'https://developer.mozilla.org/en-US/docs/Learn_web_development';
}

/**
 * Heals a single RoadmapTask if its resourceUrl is broken or points to careerai.local.
 * Strictly preserves all other properties (status, completedAt, deliverable, id, etc.).
 */
export function healRoadmapTask(task: RoadmapTask, pathSlug?: string): RoadmapTask {
  if (isInvalidOrPlaceholderUrl(task.resourceUrl)) {
    return {
      ...task,
      resourceUrl: resolveTaskResource(task, pathSlug),
    };
  }
  return task;
}

/**
 * Heals an array of RoadmapTasks, replacing any invalid or placeholder
 * URLs with their verified canonical resources.
 */
export function healRoadmapTasks(tasks: RoadmapTask[], pathSlug?: string): RoadmapTask[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.map(t => healRoadmapTask(t, pathSlug));
}
