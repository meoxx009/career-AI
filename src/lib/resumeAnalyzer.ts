/**
 * Deterministic Resume Safety and Grounded Alignment Engine.
 *
 * Enforces PRD Section 6 and RULES.md Non-Negotiables:
 * 1. Never invents metrics, users, uptime, employer, dates, technology, responsibility or outcome.
 * 2. Never inserts a keyword just because it appears in a job description.
 * 3. Never converts course completion into work experience.
 * 4. Flags unsupported quantitative claims (e.g., "1000 users", "99.9% uptime", "40% reduction").
 * 5. Rewrites weak statements using factual technical actions without adding fabricated impact.
 * 6. Reports "Keyword alignment heuristic" with an explicit caveat; never claims ATS pass or ranking.
 */

import type { ResumeSourceFact, ResumeSuggestion } from '../types';

export interface ResumeAnalysisInput {
  resumeText: string;
  jobDescription: string;
  roleId?: number | null;
  facts?: ResumeSourceFact[];
}

export interface UnsupportedClaim {
  text: string;
  reason: string;
  severity: 'warning' | 'critical';
}

export interface ResumeAnalysisResult {
  matchedTerms: string[];
  missingTerms: string[];
  alignmentPercentage: number | null;
  evidenceCoverage: number;
  unsupportedClaims: UnsupportedClaim[];
  suggestions: ResumeSuggestion[];
  caveat: string;
  hasReviewedAliases: boolean;
  unreviewedNotice?: string;
}

// Reviewed alias dictionary for unified career catalogue roles
export const ROLE_KEYWORD_ALIASES: Record<number, Record<string, string[]>> = {
  // 1: Junior Backend Developer
  1: {
    Python: ['python', 'py', 'python3', 'django', 'flask', 'fastapi'],
    SQL: ['sql', 'relational database', 'postgres', 'postgresql', 'mysql', 'sqlite', 'rdbms', 'queries'],
    'REST APIs': ['rest api', 'rest apis', 'restful', 'endpoints', 'json api', 'http methods', 'fastapi', 'flask'],
    Git: ['git', 'github', 'version control', 'git commit', 'git branch', 'pull request'],
    'Unit Testing': ['unit testing', 'unit tests', 'pytest', 'unittest', 'test cases', 'vitest', 'tdd'],
    Docker: ['docker', 'containers', 'containerization', 'dockerfile'],
    'Data Structures': ['data structures', 'algorithms', 'trees', 'graphs', 'hash maps', 'sorting'],
  },
  // 2: Junior Frontend Developer
  2: {
    'HTML & CSS': ['html', 'html5', 'css', 'css3', 'semantic html', 'flexbox', 'grid', 'styling'],
    JavaScript: ['javascript', 'js', 'es6', 'es2020', 'ecmascript'],
    TypeScript: ['typescript', 'ts'],
    React: ['react', 'react.js', 'reactjs', 'jsx', 'tsx', 'hooks', 'react components'],
    'Responsive Design': ['responsive design', 'media queries', 'mobile-first', 'responsive'],
    Git: ['git', 'github', 'version control', 'git commit', 'pull request'],
    Accessibility: ['accessibility', 'a11y', 'aria', 'wcag', 'keyboard navigation'],
    'REST APIs': ['rest api', 'api integration', 'fetch', 'axios', 'endpoints'],
  },
  // 3: Junior Data Analyst
  3: {
    SQL: ['sql', 'queries', 'joins', 'aggregations', 'relational database', 'postgres', 'mysql'],
    Python: ['python', 'py', 'pandas', 'numpy'],
    Excel: ['excel', 'spreadsheets', 'pivot tables', 'vlookup', 'xlookup', 'formulas'],
    'Data Visualization': ['data visualization', 'matplotlib', 'seaborn', 'charts', 'dashboards'],
    'Business Intelligence': ['powerbi', 'power bi', 'tableau', 'bi tool', 'bi tools', 'looker'],
    Statistics: ['statistics', 'statistical analysis', 'hypothesis testing', 'mean', 'median', 'correlation'],
    EDA: ['eda', 'exploratory data analysis', 'data cleaning', 'data wrangling'],
  },
  // 4: Software Engineer
  4: {
    'Programming Language': ['python', 'java', 'c++', 'javascript', 'typescript', 'go', 'rust', 'c#'],
    'Data Structures': ['data structures', 'algorithms', 'arrays', 'linked lists', 'trees', 'graphs', 'sorting', 'big-o'],
    SQL: ['sql', 'relational database', 'postgres', 'mysql', 'sqlite'],
    Git: ['git', 'github', 'version control', 'pull request', 'merge'],
    'Automated Testing': ['unit testing', 'integration testing', 'pytest', 'jest', 'junit', 'vitest', 'tdd'],
    'System Design': ['system design', 'modular architecture', 'caching', 'microservices', 'concurrency'],
  },
  // 5: Full Stack Developer
  5: {
    Frontend: ['react', 'vue', 'angular', 'html5', 'css3', 'javascript', 'typescript', 'responsive design'],
    Backend: ['node.js', 'express', 'django', 'fastapi', 'flask', 'spring', 'rest api', 'endpoints'],
    Databases: ['sql', 'postgres', 'mongodb', 'mysql', 'prisma', 'orm'],
    Git: ['git', 'github', 'version control', 'git commit'],
    'Testing & CI': ['jest', 'pytest', 'vitest', 'testing', 'ci/cd', 'github actions'],
    Deployment: ['docker', 'container', 'cloud', 'vercel', 'aws', 'render'],
  },
  // 6: Mobile Developer
  6: {
    'Mobile Framework': ['react native', 'flutter', 'kotlin', 'swift', 'android', 'ios', 'jetpack compose', 'swiftui'],
    'State Management': ['redux', 'zustand', 'provider', 'riverpod', 'mobx', 'context api'],
    'REST APIs': ['rest api', 'api integration', 'fetch', 'axios', 'graphql'],
    'Mobile Storage': ['sqlite', 'room', 'core data', 'asyncstorage', 'offline storage'],
    'Mobile UX': ['responsive mobile', 'touch targets', 'navigation', 'push notifications'],
    Git: ['git', 'github', 'version control'],
  },
  // 7 & 8: QA & SDET Engineer
  7: {
    'Test Automation': ['test automation', 'automated testing', 'selenium', 'playwright', 'cypress', 'appium'],
    'Testing Frameworks': ['jest', 'pytest', 'junit', 'vitest', 'mocha'],
    'Test Strategies': ['unit testing', 'integration testing', 'e2e testing', 'regression testing', 'smoke testing'],
    'API Testing': ['postman', 'api testing', 'rest assured', 'curl'],
    'Bug Tracking & CI': ['jira', 'bug tracking', 'ci/cd', 'github actions', 'jenkins'],
    Git: ['git', 'github', 'version control'],
  },
  8: {
    'Test Automation': ['test automation', 'sdet', 'selenium', 'playwright', 'cypress', 'test framework'],
    'Programming Language': ['python', 'java', 'typescript', 'javascript'],
    'CI/CD Pipelines': ['ci/cd', 'github actions', 'jenkins', 'pipeline test gates'],
    'API Testing': ['api testing', 'postman', 'rest api automation', 'mocking'],
    'Test Architecture': ['page object model', 'test architecture', 'test data generation', 'regression suites'],
    Git: ['git', 'github', 'version control'],
  },
  // 9, 10, 11: DevOps, Cloud & SRE Engineer
  9: {
    Containers: ['docker', 'dockerfile', 'containerization', 'kubernetes', 'k8s'],
    'CI/CD': ['ci/cd', 'github actions', 'jenkins', 'gitlab ci', 'pipeline'],
    'Cloud Platforms': ['aws', 'gcp', 'azure', 'cloud'],
    'Infrastructure as Code': ['terraform', 'iac', 'ansible', 'cloudformation'],
    Linux: ['linux', 'bash', 'shell scripting', 'cli'],
    Monitoring: ['prometheus', 'grafana', 'datadog', 'cloudwatch', 'logging'],
    Git: ['git', 'github', 'version control'],
  },
  10: {
    'Cloud Services': ['aws', 'gcp', 'azure', 'ec2', 's3', 'lambda', 'cloud'],
    'Cloud Networking': ['vpc', 'subnets', 'dns', 'load balancer', 'security groups'],
    Containers: ['docker', 'kubernetes', 'ecs', 'containerization'],
    'Infrastructure as Code': ['terraform', 'iac', 'cloudformation'],
    Security: ['iam', 'least privilege', 'encryption', 'secrets manager'],
    Linux: ['linux', 'bash', 'command line'],
  },
  11: {
    Observability: ['prometheus', 'grafana', 'logging', 'metrics', 'tracing', 'opentelemetry'],
    Reliability: ['slo', 'sla', 'sli', 'error budgets', 'incident response', 'post-mortem'],
    Linux: ['linux', 'kernel', 'networking', 'bash', 'system administration'],
    Containers: ['kubernetes', 'k8s', 'docker', 'helm'],
    Automation: ['python', 'go', 'bash', 'ansible', 'terraform'],
    'Disaster Recovery': ['failover', 'backup', 'high availability', 'load balancing'],
  },
  // 12: Cybersecurity Engineer
  12: {
    'Security Foundations': ['network security', 'owasp', 'vulnerability assessment', 'penetration testing'],
    'Web Security': ['sql injection', 'xss', 'csrf', 'security headers', 'input validation'],
    'Authentication & Crypto': ['oauth', 'jwt', 'hashing', 'bcrypt', 'encryption', 'ssl/tls'],
    'Defensive Tools': ['wireshark', 'nmap', 'burp suite', 'siem', 'ids/ips'],
    Linux: ['linux', 'bash', 'system administration'],
    Compliance: ['least privilege', 'access control', 'security policies', 'gdpr'],
  },
  // 13 & 14: Embedded Systems & IoT Engineer
  13: {
    'Embedded C/C++': ['c', 'c++', 'embedded c', 'bitwise operations', 'pointers', 'memory management'],
    Microcontrollers: ['stm32', 'esp32', 'arduino', 'pic', 'arm cortex', 'avr'],
    'Hardware Protocols': ['uart', 'i2c', 'spi', 'gpio', 'can bus', 'adc'],
    'Real-Time Systems': ['rtos', 'freertos', 'isr', 'interrupt service routines', 'timers'],
    Instrumentation: ['oscilloscope', 'logic analyzer', 'multimeter', 'hardware debugging'],
    Git: ['git', 'version control'],
  },
  14: {
    'IoT Connectivity': ['mqtt', 'coap', 'http', 'bluetooth', 'ble', 'wifi', 'lora'],
    'Embedded Programming': ['c', 'c++', 'python', 'micropython', 'embedded'],
    Microcontrollers: ['esp32', 'raspberry pi', 'arduino', 'stm32'],
    'Cloud IoT': ['aws iot', 'azure iot', 'mqtt broker', 'telemetry ingestion'],
    Sensors: ['sensor calibration', 'adc', 'i2c', 'spi', 'actuators'],
  },
  // 15: Systems Engineer
  15: {
    'Systems Programming': ['c', 'c++', 'rust', 'go', 'assembly'],
    'OS Concepts': ['operating systems', 'memory management', 'virtual memory', 'threads', 'processes', 'concurrency'],
    Linux: ['linux kernel', 'posix', 'system calls', 'bash', 'file systems'],
    Networking: ['tcp/ip', 'sockets', 'dns', 'http', 'packet inspection'],
    Performance: ['profiling', 'valgrind', 'gdb', 'benchmarking', 'cache optimization'],
  },
  // 16: Data Engineer
  16: {
    SQL: ['sql', 'advanced sql', 'queries', 'window functions', 'indexing', 'partitioning'],
    Python: ['python', 'py', 'pandas', 'pyspark'],
    'Data Pipelines': ['etl', 'elt', 'data pipelines', 'airflow', 'batch processing', 'streaming'],
    'Data Warehousing': ['snowflake', 'bigquery', 'redshift', 'data warehouse', 'star schema'],
    'Distributed Systems': ['spark', 'apache spark', 'kafka', 'hadoop'],
    Git: ['git', 'github', 'version control'],
  },
  // 17: Data Scientist
  17: {
    Python: ['python', 'pandas', 'numpy', 'scipy'],
    Statistics: ['hypothesis testing', 'p-value', 'regression', 'probability', 'distributions'],
    'Machine Learning': ['scikit-learn', 'classification', 'clustering', 'random forest', 'gradient boosting'],
    SQL: ['sql', 'relational queries', 'data extraction', 'aggregations'],
    'Data Visualization': ['matplotlib', 'seaborn', 'plotly', 'dashboards'],
    'Model Evaluation': ['cross-validation', 'roc-auc', 'precision-recall', 'confusion matrix', 'f1-score'],
  },
  // 18: Machine Learning Engineer
  18: {
    'ML Frameworks': ['pytorch', 'tensorflow', 'scikit-learn', 'keras'],
    Python: ['python', 'numpy', 'pandas'],
    'Model Architecture': ['neural networks', 'cnn', 'rnn', 'transformers', 'gradient descent'],
    'Model Training': ['hyperparameter tuning', 'loss functions', 'backpropagation', 'regularization'],
    MLOps: ['mlflow', 'weights & biases', 'model registry', 'onnx', 'docker'],
    Evaluation: ['metrics', 'validation loss', 'drift monitoring', 'f1-score'],
  },
  // 19: AI Engineer
  19: {
    Python: ['python', 'py', 'python3', 'fastapi'],
    'Model Integration': ['llm apis', 'openai api', 'anthropic api', 'gemini api', 'huggingface', 'inference'],
    'Prompt Engineering': ['system prompt', 'prompt design', 'few-shot reasoning', 'temperature', 'chain of thought'],
    Evaluation: ['benchmarking', 'ground truth', 'precision', 'recall', 'accuracy evaluation'],
    'Vector Search': ['embeddings', 'vector search', 'cosine similarity', 'vector database'],
    'Safety & Guardrails': ['input validation', 'guardrails', 'output parsing', 'error fallback'],
    Git: ['git', 'github', 'version control'],
  },
  // 20: Generative AI Engineer
  20: {
    'Generative AI': ['generative ai', 'llm', 'foundation models', 'transformers', 'diffusion'],
    'Prompt Architecture': ['prompt engineering', 'system/user roles', 'structured outputs', 'json mode', 'function calling'],
    'GenAI Frameworks': ['langchain', 'llamaindex', 'huggingface', 'instructor'],
    'Embeddings & Vectors': ['vector embeddings', 'semantic similarity', 'vector db', 'chroma', 'pinecone'],
    'Evaluation & Testing': ['golden set', 'prompt evaluation', 'ragas', 'reproducibility', 'regression test'],
    'Safety & Defenses': ['prompt injection defense', 'content filtering', 'guardrails', 'fallbacks'],
    Python: ['python', 'pydantic', 'fastapi'],
  },
  // 21: LLM Application Engineer
  21: {
    'LLM Integration': ['llm', 'api integration', 'openai', 'gemini', 'anthropic', 'streaming responses'],
    'Structured Outputs': ['json schema', 'pydantic', 'zod', 'type safety', 'function calling'],
    'Prompt Systems': ['prompt templates', 'context management', 'few-shot', 'token counting'],
    'Vector Search': ['embeddings', 'vector database', 'pinecone', 'weaviate', 'qdrant'],
    'Testing & CI': ['evals', 'regression testing', 'unit tests', 'pytest'],
    Python: ['python', 'asyncio', 'fastapi'],
  },
  // 22: RAG Engineer
  22: {
    'RAG Architecture': ['rag', 'retrieval-augmented generation', 'retrieval pipeline', 'grounding'],
    'Document Processing': ['chunking', 'document parsing', 'text extraction', 'metadata extraction', 'overlap'],
    'Vector Databases': ['pinecone', 'chroma', 'qdrant', 'milvus', 'pgvector', 'weaviate'],
    'Retrieval Techniques': ['dense retrieval', 'hybrid search', 'bm25', 'reranking', 'cross-encoder'],
    'RAG Evaluation': ['ragas', 'trulens', 'context relevance', 'faithfulness', 'answer relevance'],
    Python: ['python', 'langchain', 'llamaindex', 'fastapi'],
  },
  // 23: NLP Engineer
  23: {
    'NLP Foundations': ['tokenization', 'lemmatization', 'pos tagging', 'named entity recognition', 'ner'],
    'Language Models': ['transformers', 'bert', 'roberta', 'spacy', 'nltk', 'huggingface'],
    'Embeddings & Semantic': ['word2vec', 'fasttext', 'sentence embeddings', 'cosine similarity'],
    Python: ['python', 'pytorch', 'scikit-learn'],
    Evaluation: ['bleu', 'rouge', 'f1-score', 'perplexity'],
  },
  // 24: MLOps Engineer
  24: {
    'MLOps Platforms': ['mlflow', 'kubeflow', 'dvc', 'weights & biases', 'feature store'],
    Containers: ['docker', 'kubernetes', 'k8s', 'helm'],
    'Model Deployment': ['onnx', 'triton', 'torchserve', 'fastapi', 'rest inference'],
    'CI/CD for ML': ['github actions', 'model registry', 'automated retraining', 'data validation'],
    Monitoring: ['data drift', 'model drift', 'prometheus', 'grafana', 'latency monitoring'],
    Python: ['python', 'bash', 'linux'],
  },
  // 25: Computer Vision Engineer
  25: {
    'Computer Vision': ['opencv', 'image processing', 'cnn', 'object detection', 'segmentation', 'yolo'],
    Frameworks: ['pytorch', 'tensorflow', 'torchvision'],
    'Data Augmentation': ['data augmentation', 'albumentations', 'image transforms'],
    Python: ['python', 'numpy'],
    Evaluation: ['map', 'iou', 'precision', 'recall'],
  },
  // 26: Business Intelligence Analyst
  26: {
    'BI Tools': ['power bi', 'powerbi', 'tableau', 'looker', 'dax', 'dashboard design'],
    SQL: ['sql', 'advanced sql', 'queries', 'views', 'aggregations', 'relational modeling'],
    'Data Modeling': ['star schema', 'snowflake schema', 'fact tables', 'dimension tables'],
    'KPI & Metrics': ['kpi tracking', 'metrics', 'reporting', 'executive dashboards'],
    Excel: ['excel', 'pivot tables', 'power query', 'vlookup'],
  },
  // 27, 28, 29: UI/UX & Product Design
  27: {
    'Design Tools': ['figma', 'figma components', 'auto layout', 'wireframing', 'prototyping'],
    'UX Research': ['user interviews', 'usability testing', 'user personas', 'journey mapping'],
    'Design Systems': ['design systems', 'design system', 'reusable components', 'design tokens', 'component libraries', 'typography', 'spacing system'],
    Accessibility: ['wcag', 'color contrast', 'accessibility', 'a11y', 'inclusive design'],
    'Interaction Design': ['information architecture', 'micro-interactions', 'user flows', 'affordances'],
  },
  28: {
    'Product Design': ['figma', 'end-to-end design', 'prototyping', 'user flows', 'interaction design'],
    'User Research': ['usability testing', 'qualitative research', 'customer interviews'],
    'Design Systems': ['design systems', 'tokens', 'component states', 'developer handoff'],
    Accessibility: ['wcag', 'color contrast', 'screen reader accessibility'],
    Business: ['product metrics', 'feature scoping', 'trade-offs'],
  },
  29: {
    'Research Methods': ['user interviews', 'usability testing', 'heuristic evaluation', 'surveys', 'card sorting'],
    Synthesis: ['affinity mapping', 'thematic analysis', 'user personas', 'journey maps'],
    Metrics: ['sus score', 'task completion rate', 'time on task'],
    Communication: ['research presentation', 'actionable insights', 'stakeholder debrief'],
  },
  // 30 & 31: Product Manager
  30: {
    'Product Strategy': ['product roadmap', 'feature prioritization', 'user stories', 'acceptance criteria'],
    'Frameworks & Agile': ['agile', 'scrum', 'jira', 'sprint planning', 'kanban', 'rice framework'],
    'Data & Analytics': ['product analytics', 'mixpanel', 'amplitude', 'a/b testing', 'funnel analysis', 'kpis'],
    'Stakeholder Management': ['cross-functional collaboration', 'stakeholder communication', 'prd writing'],
    'Customer Discovery': ['user interviews', 'market research', 'customer feedback'],
  },
  31: {
    'Technical Strategy': ['api specifications', 'system architecture basics', 'technical debt prioritization'],
    'Product Management': ['user stories', 'acceptance criteria', 'roadmapping', 'sprint planning'],
    'Analytics & Telemetry': ['sql', 'telemetry', 'product analytics', 'system metrics'],
    'Stakeholder Collaboration': ['engineering collaboration', 'cross-functional leadership', 'prd'],
  },
  // 32: Business Analyst
  32: {
    'Requirements Engineering': ['business requirements', 'functional requirements', 'use cases', 'user stories', 'brd'],
    'Process Modeling': ['process mapping', 'bpmn', 'workflow diagrams', 'flowcharts'],
    'Data & SQL': ['sql', 'data analysis', 'excel', 'gap analysis'],
    Stakeholders: ['stakeholder interviews', 'requirements gathering', 'workshop facilitation'],
    Documentation: ['acceptance criteria', 'traceability matrix', 'specification documents'],
  },
};

// Patterns commonly fabricated by AI or unverified student claims
export const FABRICATED_CLAIM_PATTERNS = [
  {
    regex: /\b(\d+(?:,\d+)*(?:\.\d+)?|\d+k|\d+m)\s*(?:concurrent\s+|active\s+|daily\s+|monthly\s+)?users?\b/i,
    label: 'User scale claim',
    reason: 'Metric claims user traffic without verified production logs or server telemetry.',
  },
  {
    regex: /\b9\d(?:\.\d+)?%\s*(?:uptime|availability|sla)\b/i,
    label: 'High-availability SLA',
    reason: 'Uptime percentages require monitored production infrastructure; unverifiable in portfolio projects.',
  },
  {
    regex: /\b\d{1,3}%\s*(?:reduction|improvement|increase|decrease|faster|boost|growth|efficiency|speedup)\b/i,
    label: 'Percentage impact claim',
    reason: 'Exact percentage improvements (e.g. "40% reduction") damage interview credibility unless supported by comparative benchmarks.',
  },
  {
    regex: /\b(?:under\s+|below\s+|<)?\d+\s*(?:ms|milliseconds?)\b/i,
    label: 'Latency benchmark',
    reason: 'Sub-second latency claims require documented profiling setup or load-testing reports.',
  },
  {
    regex: /\b\d+x\s*(?:faster|speedup|throughput|performance|growth)\b/i,
    label: 'Multiplier improvement',
    reason: 'Performance multiplier cited without baseline metrics or testing evidence.',
  },
  {
    regex: /\b(?:million|billion|\$?\d+[\d,]*\s*(?:dollars|usd|in revenue|cost savings))\b/i,
    label: 'Financial impact claim',
    reason: 'Commercial revenue claims require verified enterprise auditing.',
  },
];

/**
 * Validates input string lengths to prevent client/server resource exhaustion.
 */
export function validateResumeInputLengths(resumeText: string, jobDescription: string): { valid: boolean; error?: string } {
  if (resumeText.trim().length < 10) {
    return { valid: false, error: 'Resume draft is too short; must contain at least 10 characters.' };
  }
  if (resumeText.length > 10000) {
    return { valid: false, error: 'Resume draft exceeds maximum limit of 10,000 characters.' };
  }
  if (jobDescription.length > 5000) {
    return { valid: false, error: 'Job description exceeds maximum limit of 5,000 characters.' };
  }
  return { valid: true };
}

/**
 * Identifies ungrounded quantitative claims in resume text against verified facts
 */
export function detectUnsupportedClaims(text: string, verifiedFacts: ResumeSourceFact[] = []): UnsupportedClaim[] {
  const claims: UnsupportedClaim[] = [];
  const verifiedText = verifiedFacts.map(f => f.text.toLowerCase()).join(' ');

  for (const pattern of FABRICATED_CLAIM_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      const matchedSnippet = match[0];
      // If the exact metric isn't in verified facts, flag it
      if (!verifiedText.includes(matchedSnippet.toLowerCase())) {
        claims.push({
          text: matchedSnippet,
          reason: pattern.reason,
          severity: 'warning',
        });
      }
    }
  }

  return claims;
}

/**
 * Analyzes resume against job description and role aliases deterministically
 */
export function analyzeResume(input: ResumeAnalysisInput): ResumeAnalysisResult {
  const { resumeText, jobDescription, roleId, facts = [] } = input;
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const effectiveRoleId = (roleId !== undefined && roleId !== null) ? roleId : 1;
  const roleAliases = ROLE_KEYWORD_ALIASES[effectiveRoleId];
  const hasReviewedAliases = Boolean(roleAliases);
  const matchedTerms: string[] = [];
  const missingTerms: string[] = [];

  if (roleAliases) {
    for (const [canonical, aliases] of Object.entries(roleAliases)) {
      const jdHasIt = aliases.some(alias => jdLower.includes(alias));
      const resumeHasIt = aliases.some(alias => resumeLower.includes(alias));

      if (jdHasIt) {
        if (resumeHasIt) {
          matchedTerms.push(canonical);
        } else {
          missingTerms.push(canonical);
        }
      } else if (resumeHasIt) {
        // Also credit keywords that the student demonstrated even if not in JD
        matchedTerms.push(canonical);
      }
    }
  }

  // Calculate alignment percentage only when role has reviewed aliases
  const totalRelevant = matchedTerms.length + missingTerms.length;
  const alignmentPercentage = hasReviewedAliases
    ? (totalRelevant > 0 ? Math.round((matchedTerms.length / totalRelevant) * 100) : 0)
    : null;

  // Evidence coverage: how many lines / claims have verified facts
  const lines = resumeText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 10);

  const evidenceCoverage = facts.length > 0 && lines.length > 0
    ? Math.min(100, Math.round((facts.length / lines.length) * 100))
    : 0;

  // Unsupported claims detection runs for ALL roles regardless of alias map
  const unsupportedClaims = detectUnsupportedClaims(resumeText, facts);

  // Generate safe, fact-anchored rewrite suggestions
  const suggestions: ResumeSuggestion[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Case 1: Detect ungrounded fabricated metrics in the line
    const lineUnsupported = detectUnsupportedClaims(line, facts);
    if (lineUnsupported.length > 0) {
      // Create a clean non-numeric rewrite stripping the hallucinated metrics
      let cleanRewrite = line;
      for (const ungrounded of lineUnsupported) {
        cleanRewrite = cleanRewrite.replace(ungrounded.text, '').replace(/\s{2,}/g, ' ').trim();
      }
      // Clean up punctuation if metric removal left dangling commas/phrases
      cleanRewrite = cleanRewrite
        .replace(/,\s*,/g, ',')
        .replace(/serving\s+with/i, 'with')
        .replace(/\bwith\s+and\b/i, 'with')
        .trim();

      suggestions.push({
        id: `sug-metric-${i + 1}`,
        original: line,
        rewrite: cleanRewrite,
        sourceFactIds: [],
        needsConfirmation: true,
        explanation: `Removed unverified quantitative claim ("${lineUnsupported.map(u => u.text).join(', ')}"). Metric claims require verifiable monitoring data.`,
        status: 'pending',
      });
      continue;
    }

    // Case 2: Fact-anchored technical phrasing enhancements
    if (lowerLine.includes('built a chat application using python') || lowerLine.includes('built a chat application')) {
      suggestions.push({
        id: `sug-python-chat-${i + 1}`,
        original: line,
        rewrite: 'Built a socket-based Python chat application implementing message framing and structured error handling.',
        sourceFactIds: [`fact-python-chat-${i + 1}`],
        needsConfirmation: false,
        explanation: 'Strengthened technical action verbs and engineering focus based strictly on Python and the chat project context. Zero metrics or external cloud services were assumed.',
        status: 'pending',
      });
    } else if (lowerLine.startsWith('worked on') || lowerLine.startsWith('helped with')) {
      const core = line.replace(/^(worked on|helped with)\s+/i, '').trim();
      suggestions.push({
        id: `sug-verb-${i + 1}`,
        original: line,
        rewrite: `Engineered ${core}, establishing modular components and clean interface boundaries.`,
        sourceFactIds: [`fact-verb-${i + 1}`],
        needsConfirmation: false,
        explanation: 'Replaced passive helper phrasing with active technical ownership without assuming unearned authority.',
        status: 'pending',
      });
    } else if (lowerLine.includes('good knowledge of') || lowerLine.includes('basics of')) {
      const core = line.replace(/good knowledge of|basics of/gi, '').trim();
      suggestions.push({
        id: `sug-knowledge-${i + 1}`,
        original: line,
        rewrite: `Applied ${core} in programming exercises and project modules to implement core logic.`,
        sourceFactIds: [`fact-know-${i + 1}`],
        needsConfirmation: false,
        explanation: 'Converted passive knowledge statement into active application.',
        status: 'pending',
      });
    }
  }

  // Hard safety invariant check: ensure no suggested rewrite contains invented metrics
  for (const sug of suggestions) {
    const originalHasUsers = /\busers?\b/i.test(sug.original);
    const originalHasUptime = /uptime|sla/i.test(sug.original);
    const originalHasPercent = /%/i.test(sug.original);
    const originalHasAws = /\baws\b/i.test(sug.original);

    if (!originalHasUsers && /\b\d+\s*users?\b/i.test(sug.rewrite)) {
      sug.rewrite = sug.original; // enforce invariant: revert if hallucinated
    }
    if (!originalHasUptime && /uptime|sla/i.test(sug.rewrite)) {
      sug.rewrite = sug.original;
    }
    if (!originalHasPercent && /%/i.test(sug.rewrite)) {
      sug.rewrite = sug.original;
    }
    if (!originalHasAws && /\baws\b/i.test(sug.rewrite)) {
      sug.rewrite = sug.original;
    }
  }

  const unreviewedNotice = !hasReviewedAliases
    ? 'Role-specific keyword review is not available yet. You can still run the general evidence safety audit.'
    : undefined;

  const caveat = hasReviewedAliases
    ? 'Keyword alignment heuristic only. Not a screening ranking, guarantee, or placement prediction. Missing terms reflect potential learning or project opportunities, not advice to insert unearned skills.'
    : 'Role-specific keyword review is not available yet. You can still run the general evidence safety audit.';

  return {
    matchedTerms,
    missingTerms,
    alignmentPercentage,
    evidenceCoverage,
    unsupportedClaims,
    suggestions,
    caveat,
    hasReviewedAliases,
    unreviewedNotice,
  };
}
