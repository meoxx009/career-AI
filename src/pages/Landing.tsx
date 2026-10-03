import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';

export const Landing = () => {
  const navigate = useNavigate();
  const { setSelectedRoleId, loadRahulDemo } = useCareer();

  const handleStartDemo = () => {
    loadRahulDemo();
    navigate('/dashboard');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">YOUR STARTING POINT / BUILT FOR YOUR GOALS</p>
          <h1>
            FIND YOUR<br />
            <em>NEXT MOVE.</em>
          </h1>
          <p className="hero-lede">
            A clearer way to choose what to practise next. Start with your goals, interests and current skills.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              id="startButton"
              type="button"
              onClick={() => navigate('/onboarding')}
            >
              Find my direction <span aria-hidden="true">→</span>
            </button>
            <a className="button button-quiet" href="#paths">
              See starter paths
            </a>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="wave-field"></div>
          <div className="hero-stamp">
            ONE<br />
            <span>STEP</span><br />
            AT A<br />
            <span>TIME</span>
          </div>
          <div className="hero-label">CAREERAI / EVIDENCE-LED PREPARATION</div>
        </div>
      </section>

      {/* User-Neutral Starting Point Section */}
      <section className="starting-section shell" aria-labelledby="starting-heading">
        <div className="section-intro">
          <p className="eyebrow">YOUR STARTING POINT / 01</p>
          <h2 id="starting-heading">
            A clearer way<br />
            <i>to choose next.</i>
          </h2>
        </div>

        <div className="starting-cards-grid">
          {/* Card 1: Discover direction */}
          <div className="starting-card dark-card">
            <p className="eyebrow" style={{ color: 'var(--color-tangerine)' }}>STEP 01</p>
            <h3 className="starting-card-title">
              Discover your <span>direction</span>
            </h3>
            <p className="starting-card-desc" style={{ color: 'var(--color-muted-light)' }}>
              Take a short diagnostic to understand where your skills stand today. We show what is known, what is still unassessed, and what three roles fit your profile.
            </p>
            <button
              className="card-link"
              type="button"
              style={{ color: 'var(--color-tangerine)' }}
              onClick={() => navigate('/assessment')}
            >
              Start the diagnostic <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Card 2: Build a plan */}
          <div className="starting-card linen-card">
            <p className="eyebrow">STEP 02</p>
            <h3 className="starting-card-title">
              Build a realistic<br />weekly plan
            </h3>
            <p className="starting-card-desc">
              Once you pick a direction, CareerAI builds a four-week learning roadmap with realistic tasks and evidence checkpoints — no guesswork.
            </p>
            <button
              className="card-link ink-link"
              type="button"
              onClick={() => navigate('/roadmap')}
            >
              Explore roadmap <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Card 3: Turn practice into evidence */}
          <div className="starting-card cotton-card">
            <p className="eyebrow">STEP 03</p>
            <h3 className="starting-card-title">
              Turn practice<br />into evidence
            </h3>
            <p className="starting-card-desc">
              Practise interview questions with a deterministic rubric. Review your resume against a job description honestly. Build a story you can actually tell.
            </p>
            <button
              className="card-link ink-link"
              type="button"
              onClick={() => navigate('/practice')}
            >
              Open practice room <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Three Starter Paths Section */}
      <section className="paths shell" id="paths" aria-labelledby="paths-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">THREE DIRECTIONS / 02</p>
            <h2 id="paths-heading">
              Not a verdict.<br />
              <i>A starting point.</i>
            </h2>
          </div>
          <p className="section-note">
            We show what we know, what we do not know yet, and what to practise next.
          </p>
        </div>

        <div className="path-grid">
          {/* Card 1: Backend Developer (Featured Tangerine) */}
          <article className="path-card featured-card">
            <div className="path-number">01</div>
            <div className="path-icon">↗</div>
            <p className="path-type">BACKEND DEVELOPER</p>
            <h3>
              Backend<br />Developer
            </h3>
            <div className="path-starter-state">
              <span className="starter-pill">Starter path</span>
              <span className="starter-subtext">Explore this direction</span>
            </div>
            <div className="path-line"></div>
            <p>Logic, APIs and systems. A strong direction if you enjoy building the parts users never see.</p>
            <button
              className="card-link"
              type="button"
              onClick={() => {
                setSelectedRoleId(1);
                navigate('/paths/backend-developer');
              }}
            >
              Explore path <span aria-hidden="true">↗</span>
            </button>
          </article>

          {/* Card 2: Data Analyst (Cotton) */}
          <article className="path-card cotton-card">
            <div className="path-number">02</div>
            <div className="path-icon ink">◇</div>
            <p className="path-type">DATA ANALYST</p>
            <h3>
              Data<br />Analyst
            </h3>
            <div className="path-starter-state">
              <span className="starter-pill">Starter path</span>
              <span className="starter-subtext">Not assessed yet</span>
            </div>
            <div className="path-line dark-line"></div>
            <p>Patterns, SQL and storytelling with numbers. Take the diagnostic to see how you compare.</p>
            <button
              className="card-link ink-link"
              type="button"
              onClick={() => {
                setSelectedRoleId(3);
                navigate('/paths/data-analyst');
              }}
            >
              Explore path <span aria-hidden="true">↗</span>
            </button>
          </article>

          {/* Card 3: Frontend Developer (Natural #9F886F) */}
          <article className="path-card natural-card">
            <div className="path-number">03</div>
            <div className="path-icon ink">○</div>
            <p className="path-type">FRONTEND DEVELOPER</p>
            <h3>
              Frontend<br />Developer
            </h3>
            <div className="path-starter-state">
              <span className="starter-pill">Starter path</span>
              <span className="starter-subtext">Not assessed yet</span>
            </div>
            <div className="path-line dark-line"></div>
            <p>UI, interactions and the user-facing layer. Take the diagnostic to see what to practise first.</p>
            <button
              className="card-link ink-link"
              type="button"
              onClick={() => {
                setSelectedRoleId(2);
                navigate('/paths/frontend-developer');
              }}
            >
              Explore path <span aria-hidden="true">↗</span>
            </button>
          </article>
        </div>
      </section>

      {/* Practice Room Preview Section */}
      <section className="practice shell" id="practice" aria-labelledby="practice-heading">
        <div className="practice-card">
          <div className="practice-copy">
            <p className="eyebrow">PRACTICE ROOM / 03</p>
            <h2 id="practice-heading">
              Tell the story<br />
              <em>behind the work.</em>
            </h2>
            <p>
              Practise one question in text. Get a rubric, a useful gap and one next action — not a mysterious hiring score.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => navigate('/practice')}
            >
              Start a practice question <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="question-card">
            <p className="eyebrow">ROLE-SPECIFIC QUESTION</p>
            <h3>How would you design a small task-management REST API?</h3>
            <div className="rubric-row">
              <span>CLARIFY</span>
              <span>DESIGN</span>
              <span>VALIDATE</span>
            </div>
            <p className="question-note">
              Text-only mode · your answer stays private until you choose to save it.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta shell">
        <p className="eyebrow">CAREERAI / A CLEARER START</p>
        <h2>
          Your next move<br />
          <i>can be small.</i>
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="button button-primary"
            id="footerStart"
            type="button"
            onClick={() => navigate('/onboarding')}
          >
            Find my direction <span aria-hidden="true">→</span>
          </button>
          <button
            className="button button-quiet"
            type="button"
            onClick={handleStartDemo}
            title="Load the pre-populated synthetic Rahul demo to explore a complete example"
          >
            Explore the demo <span aria-hidden="true">↗</span>
          </button>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--color-muted-light)', marginTop: '12px', maxWidth: '480px' }}>
          The demo shows synthetic data for a fictional learner. It is not a real student profile.
        </p>
      </section>
    </div>
  );
};
