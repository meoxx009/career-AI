import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';

export const Landing = () => {
  const navigate = useNavigate();
  const { setSelectedRoleId, showToast } = useCareer();

  const [task1Complete, setTask1Complete] = useState(false);

  const handleStartDemo = () => {
    document.querySelector('#paths')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Synthetic Rahul demo opened — no real student data used.');
  };

  const handleToggleTask = () => {
    setTask1Complete(!task1Complete);
    if (!task1Complete) {
      showToast('Saved in the fictional demo roadmap.');
    } else {
      showToast('Task marked pending.');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">CAREER READINESS / 01</p>
          <h1>
            FIND YOUR<br />
            <em>NEXT MOVE.</em>
          </h1>
          <p className="hero-lede">
            A calm, evidence-led way to choose a direction, practise what matters and tell your story with confidence.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              id="startButton"
              type="button"
              onClick={() => {
                navigate('/assessment');
                showToast('Starting diagnostic assessment.');
              }}
            >
              Find my direction <span aria-hidden="true">→</span>
            </button>
            <a className="button button-quiet" href="#paths">
              See the sample path
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
          <div className="hero-label">CAREERAI / SYNTHETIC DEMO</div>
        </div>
      </section>

      {/* Snapshot Section */}
      <section className="snapshot shell" aria-labelledby="snapshot-heading">
        <div className="section-intro">
          <p className="eyebrow">RAHUL'S SNAPSHOT / FICTIONAL DATA</p>
          <h2 id="snapshot-heading">
            Clarity feels better<br />
            <i>when it is visible.</i>
          </h2>
        </div>

        <div className="snapshot-card linen-card">
          <div className="card-topline">
            <span>ASSESSED ALIGNMENT</span>
            <span className="badge dark-badge">COVERAGE 78%</span>
          </div>
          <div className="big-score">
            82<span>%</span>
          </div>
          <p>Backend Developer</p>
          <div className="mini-meter">
            <span style={{ width: '82%' }}></span>
          </div>
          <div className="card-footer">
            <span>Evidence-led estimate</span>
            <span>Version seed-1</span>
          </div>
        </div>

        <div className="snapshot-card dark-card">
          <div className="card-topline">
            <span>NEXT BEST ACTION</span>
            <span className="w-2 h-2 rounded-full bg-tangerine inline-block"></span>
          </div>
          <h3>
            Build your first<br />
            <span>REST endpoint.</span>
          </h3>
          <p className="muted">
            A 45-minute step to turn your API gap into project evidence.
          </p>
          <button
            className="text-link"
            type="button"
            onClick={() => {
              navigate('/roadmap');
              showToast("Task added to Rahul's fictional roadmap");
            }}
          >
            Add to roadmap <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      {/* Three Directions Section */}
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
            <p className="path-type">PRIMARY DIRECTION</p>
            <h3>
              Backend<br />Developer
            </h3>
            <div className="path-score">
              <strong>82</strong>
              <span>
                assessed<br />alignment
              </span>
            </div>
            <div className="path-line"></div>
            <p>Strong logic and Python evidence. Practise APIs, testing and deployment next.</p>
            <button
              className="card-link"
              type="button"
              onClick={() => {
                setSelectedRoleId('role-backend');
                navigate('/roadmap');
                showToast('Backend plan opened');
              }}
            >
              Explore plan <span aria-hidden="true">↗</span>
            </button>
          </article>

          {/* Card 2: Data Analyst (Cotton) */}
          <article className="path-card cotton-card">
            <div className="path-number">02</div>
            <div className="path-icon ink">◇</div>
            <p className="path-type">SECOND DIRECTION</p>
            <h3>
              Data<br />Analyst
            </h3>
            <div className="path-score">
              <strong>74</strong>
              <span>
                assessed<br />alignment
              </span>
            </div>
            <div className="path-line dark-line"></div>
            <p>Good analytical interest. Build stronger SQL and data-story evidence.</p>
            <button
              className="card-link ink-link"
              type="button"
              onClick={() => {
                setSelectedRoleId('role-analyst');
                navigate('/roadmap');
                showToast('Data Analyst plan opened');
              }}
            >
              Explore plan <span aria-hidden="true">↗</span>
            </button>
          </article>

          {/* Card 3: Frontend Developer (Black Hole) */}
          <article className="path-card black-card">
            <div className="path-number">03</div>
            <div className="path-icon">○</div>
            <p className="path-type">EXPLORE WITH MORE EVIDENCE</p>
            <h3>
              Frontend<br />Developer
            </h3>
            <div className="path-score">
              <strong>68</strong>
              <span>
                alignment<br />coverage 46%
              </span>
            </div>
            <div className="path-line"></div>
            <p>Interesting direction. Take the UI diagnostic before comparing confidently.</p>
            <button
              className="card-link"
              type="button"
              onClick={() => {
                setSelectedRoleId('role-frontend');
                navigate('/assessment');
                showToast('Frontend diagnostic opened');
              }}
            >
              Take diagnostic <span aria-hidden="true">↗</span>
            </button>
          </article>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="roadmap shell" id="roadmap" aria-labelledby="roadmap-heading">
        <div className="roadmap-head">
          <div>
            <p className="eyebrow">THE PLAN / 03</p>
            <h2 id="roadmap-heading">
              Small steps.<br />
              <i>Real proof.</i>
            </h2>
          </div>
          <div className="plan-meta">
            <span>BACKEND / 4 WEEKS</span>
            <strong>6 HRS / WEEK</strong>
          </div>
        </div>

        <div className="roadmap-list">
          {/* Week 1 */}
          <article className="week-row active-week">
            <div className="week-marker">01</div>
            <div className="week-copy">
              <p className="eyebrow orange-eyebrow">CURRENT</p>
              <h3>Programming + HTTP foundations</h3>
              <p>Understand requests, responses and the flow behind a useful endpoint.</p>
            </div>
            <div className="task-status">
              <span className={`status-ring ${task1Complete ? '' : 'empty'}`}></span>
              <span>{task1Complete ? '3 / 3 tasks' : '2 / 3 tasks'}</span>
            </div>
            <button
              className="task-action"
              type="button"
              onClick={handleToggleTask}
            >
              {task1Complete ? 'Task complete' : 'Mark task done'}
            </button>
          </article>

          {/* Week 2 */}
          <article className="week-row">
            <div className="week-marker">02</div>
            <div className="week-copy">
              <p className="eyebrow">NEXT</p>
              <h3>SQL + API basics</h3>
              <p>Design a small schema and document six clear API requests.</p>
            </div>
            <div className="task-status">
              <span className="status-ring empty"></span>
              <span>0 / 3 tasks</span>
            </div>
            <button
              className="task-action"
              type="button"
              onClick={() => {
                navigate('/roadmap');
                showToast('Week 2 opened');
              }}
            >
              View week
            </button>
          </article>

          {/* Week 3 */}
          <article className="week-row">
            <div className="week-marker">03</div>
            <div className="week-copy">
              <p className="eyebrow">UP NEXT</p>
              <h3>Testing + project evidence</h3>
              <p>Make a small project safer and explain exactly what you built.</p>
            </div>
            <div className="task-status">
              <span className="status-ring empty"></span>
              <span>0 / 3 tasks</span>
            </div>
            <button
              className="task-action"
              type="button"
              onClick={() => {
                showToast('Week 3 is locked until prerequisites are complete');
              }}
            >
              View week
            </button>
          </article>
        </div>
      </section>

      {/* Practice Room Section */}
      <section className="practice shell" id="practice" aria-labelledby="practice-heading">
        <div className="practice-card">
          <div className="practice-copy">
            <p className="eyebrow">PRACTICE ROOM / 04</p>
            <h2 id="practice-heading">
              Tell the story<br />
              <em>behind the work.</em>
            </h2>
            <p>
              Practise one question in text. Get a rubric, a useful gap and one next action—not a mysterious hiring score.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                navigate('/practice');
                showToast('Practice question opened');
              }}
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
        <button
          className="button button-primary"
          id="footerStart"
          type="button"
          onClick={handleStartDemo}
        >
          Explore the demo <span aria-hidden="true">↗</span>
        </button>
      </section>
    </div>
  );
};
