import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import missionImage from '@assets/image1_1788629027145.jpeg';
import bathLiveImage from '@assets/generated_images/kokku-bathing-live.png';
import mirrorImage from '@assets/image2_1788629045381.jpeg';
import finalImage from '@assets/image3_1788629053979.jpeg';
import bathAudio from '@assets/audio_1788629035312.mpeg';

type Stage = 'opening' | 'bathing' | 'mirror' | 'compare' | 'achievements' | 'result';

const queryClient = new QueryClient();

const bathLines = [
  'അയ്യോ!',
  'വീണ്ടും തുടങ്ങിയോ?',
  'ഞാൻ കാക്കയാണെന്ന് പറഞ്ഞില്ലേ!',
  'ഇത് എന്ത് പരിപാടിയാ?',
  'എനിക്ക് വീട്ടിൽ പോകണം.',
  'നിനക്ക് വേറെ പണിയൊന്നുമില്ലേ?',
  'ഇനി എത്ര കുളിക്കണം?',
  'എന്റെ നിറം മാറില്ലെടാ!',
  'Kakka aanu... kokku alla!',
  'ഇനി കുളിച്ചാൽ ഞാൻ മീനാവുമോ?',
];

const Malayalam = ({ children }: { children: ReactNode }) => <span lang="ml">{children}</span>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary resetKey="operation-kokku">
          <Game />
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Game() {
  const [stage, setStage] = useState<Stage>('opening');
  const [baths, setBaths] = useState(10);
  const [bath, setBath] = useState(0);
  const [error, setError] = useState('');
  const [splashing, setSplashing] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [lifeChoicesError, setLifeChoicesError] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('kokku-theme') === 'dark' ? 'dark' : 'light';
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  const progressIndex = { opening: 0, bathing: 1, mirror: 2, compare: 3, achievements: 4, result: 5 }[stage];
  const isLongMission = baths >= 100;
  const waterUsed = baths * 5;
  const moneyWasted = Math.round(baths * 1.8);
  const bathPercent = baths ? Math.round((bath / baths) * 100) : 0;
  const currentLine = useMemo(() => {
    if (bath === 0) return 'എനിക്ക് എന്തോ പന്തികേട് തോന്നുന്നു...';
    if (bath >= baths) return 'എന്റെ ജീവിതം പോയി...';
    return bathLines[(bath - 1) % bathLines.length];
  }, [bath, baths]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('kokku-theme', theme);
  }, [theme]);

  const playBathAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.42;
    audio.play().then(() => {
      setAudioPlaying(true);
      setAudioBlocked(false);
    }).catch(() => setAudioBlocked(true));
  };

  const startMission = () => {
    const cleanValue = Number(baths);
    if (!Number.isInteger(cleanValue) || cleanValue < 1 || cleanValue > 1000) {
      setError('Enter a whole number between 1 and 1,000 baths.');
      return;
    }
    setError('');
    setBath(0);
    setStage('bathing');
    window.setTimeout(() => {
      playBathAudio();
      setSplashing(true);
      setBath(1);
    }, 260);
  };

  useEffect(() => {
    if (stage !== 'bathing' || bath < 1 || bath >= baths) return;
    const timer = window.setTimeout(() => {
      setSplashing(true);
      setBath((current) => current + 1);
    }, isLongMission ? 520 : 900);
    return () => window.clearTimeout(timer);
  }, [bath, baths, isLongMission, stage]);

  useEffect(() => {
    if (!splashing) return;
    const timer = window.setTimeout(() => setSplashing(false), 650);
    return () => window.clearTimeout(timer);
  }, [splashing]);

  useEffect(() => {
    if (stage !== 'bathing' || bath < baths || bath === 0) return;
    const timer = window.setTimeout(() => {
      audioRef.current?.pause();
      setAudioPlaying(false);
      setStage('mirror');
      setScanLine(0);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [bath, baths, stage]);

  useEffect(() => {
    if (stage !== 'mirror') return;
    const timer = window.setInterval(() => setScanLine((line) => Math.min(line + 1, 5)), 520);
    return () => window.clearInterval(timer);
  }, [stage]);

  const tryAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => {
      setAudioPlaying(true);
      setAudioBlocked(false);
    }).catch(() => setAudioBlocked(true));
  };

  const reset = () => {
    audioRef.current?.pause();
    setAudioPlaying(false);
    setAudioBlocked(false);
    setBath(0);
    setStage('opening');
    setError('');
    setLifeChoicesError(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="game-shell">
      <audio ref={audioRef} src={bathAudio} preload="auto" aria-label="Bathing operation audio" />
      <header className="topbar">
        <div className="brand-mark" data-testid="display-brand">
          <div className="brand-seal">OK</div>
          <div>
            <div className="brand-type">OPERATION KOKKU</div>
            <div className="brand-sub">Field experiment no. 004</div>
          </div>
        </div>
        <div className="operation-id" data-testid="text-operation-id">A scientifically questionable experiment.</div>
        <button
          className="theme-toggle"
          type="button"
          aria-pressed={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          data-testid="button-theme-toggle"
        >
          <span className="theme-toggle-mark" aria-hidden="true" />
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </header>

      <div className="stage-wrap">
        <nav className="stage-progress" aria-label="Mission progress">
          {['Brief', 'Bath', 'Mirror', 'Evidence', 'Achievements', 'Result'].map((label, index) => (
            <div className={`progress-dot ${index <= progressIndex ? 'active' : ''}`} key={label} title={label} data-testid={`progress-${index}`} />
          ))}
          <span className="stage-label" data-testid="text-stage-label">{stageLabel(stage)}</span>
        </nav>

        {stage === 'opening' && (
          <section className="mission-grid stage-enter" data-testid="stage-opening">
            <div>
              <div className="eyebrow">Mission briefing / 01</div>
              <h1 className="display-title">Turn a crow <span>into a heron.</span></h1>
              <p className="subhead">A bold theory. A wet bird. Zero supporting evidence.</p>
              <div className="entry-card">
                <label className="field-label" htmlFor="bath-count">How many times should the crow bathe?</label>
                <div className="number-input">
                  <input
                    id="bath-count"
                    data-testid="input-bath-count"
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={baths}
                    onChange={(event) => setBaths(Number(event.target.value))}
                    onKeyDown={(event) => { if (event.key === 'Enter') startMission(); }}
                    aria-describedby={error ? 'bath-error' : undefined}
                  />
                  <button className="primary-btn" type="button" onClick={startMission} data-testid="button-start-operation">Start operation</button>
                </div>
                {error && <div id="bath-error" className="error-text" data-testid="status-input-error">{error}</div>}
                <div className="note-line"><Malayalam>“എന്തിനാ എന്നെ ഇങ്ങനെ നോക്കുന്നത്?”</Malayalam></div>
              </div>
            </div>
            <div className="mission-art">
              <div className="media-card">
                <img src={missionImage} alt="A suspicious crow sitting in a bath while imagining a white heron" data-testid="img-opening-crow" />
                <div className="caption-strip"><span>Subject: Kakka</span><span>Status: suspicious</span></div>
              </div>
              <div className="speech" data-testid="text-crow-opening"><Malayalam>“എന്തിനാ എന്നെ ഇങ്ങനെ നോക്കുന്നത്?”</Malayalam></div>
            </div>
          </section>
        )}

        {stage === 'bathing' && (
          <section className="stage-enter" data-testid="stage-bathing">
            <div className="section-head">
              <div><div className="eyebrow">Live experiment / 02</div><h1 className="section-title">Bathing operation in progress.</h1></div>
              <div className="mono-status" data-testid="status-bath-count">Bath {bath} / {baths}<br />Species change: 0%</div>
            </div>
            <div className="bath-layout">
              <div className={`bath-stage ${splashing ? 'splashing' : ''}`} data-testid="visual-bath-stage">
                <div className="live-bath-badge"><span className="live-dot" aria-hidden="true" /> LIVE BATH CAM</div>
                <div className="live-bath-frame"> 
                  <img className="bath-image" src={bathLiveImage} alt="The crow actively bathing under a shower" data-testid="img-bathing-crow" />
                  <div className="live-bath-caption">FEED 02 / SPLASH DETECTED</div>
                </div>
                <div className="splash one">SPLASH</div>
                <div className="splash two">PLOP</div>
              </div>
              <div className="bath-copy">
                <div className="dialogue-card" data-testid="card-crow-dialogue">
                  <div className="eyebrow">Crow transmission</div>
                  <blockquote data-testid="text-bath-dialogue"><Malayalam>“{currentLine}”</Malayalam></blockquote>
                </div>
                <div>
                  <div className="mono-status">Cleanliness // {Math.min(100, bathPercent)}%</div>
                  <div className="meter" aria-label={`Cleanliness ${bathPercent}%`}><div className="meter-fill" style={{ width: `${bathPercent}%` }} /></div>
                </div>
                <div className="stats-rail">
                  <div className="tiny-stat"><b data-testid="text-cleanliness">{Math.min(100, bathPercent)}%</b><span>cleanliness</span></div>
                  <div className="tiny-stat"><b data-testid="text-transformation">0%</b><span>transformation</span></div>
                </div>
                <div className="audio-dock" data-testid="audio-dock">
                  <span>{audioBlocked ? 'Audio needs a tap to begin.' : audioPlaying ? 'Operation soundtrack live' : 'Soundtrack paused'}</span>
                  <button type="button" onClick={audioPlaying ? () => { audioRef.current?.pause(); setAudioPlaying(false); } : tryAudio} data-testid="button-audio-toggle">
                    {audioPlaying ? 'Pause audio' : 'Play audio'}
                  </button>
                </div>
                <div className="mono-status">Water used so far: {bath * 5} L</div>
              </div>
            </div>
            <div className="footer-note" data-testid="status-bath-rule">The crow is getting cleaner. The crow is not getting whiter.</div>
          </section>
        )}

        {stage === 'mirror' && (
          <section className="stage-enter" data-testid="stage-mirror">
            <div className="section-head">
              <div><div className="eyebrow">Final transformation test / 03</div><h1 className="section-title">A moment of scientific truth.</h1></div>
              <div className="failure-stamp" data-testid="status-transformation">Transformation failed</div>
            </div>
            <div className="scan-card">
              <div className="scan-visual"><img src={mirrorImage} alt="A crow checking its reflection in a bathroom mirror" data-testid="img-mirror-crow" /></div>
              <div>
                <div className="mono-status" data-testid="status-scan">Scanning feathers... {scanLine >= 5 ? 'Complete.' : ''}</div>
                <ul className="scan-lines">
                  {['Scanning feathers...', 'Checking colour...', 'Checking species...', 'Comparing with heron...', 'Processing...'].map((line, index) => (
                    <li key={line} style={{ opacity: scanLine >= index + 1 ? 1 : .35 }} data-testid={`scan-line-${index}`}>{line}</li>
                  ))}
                </ul>
                {scanLine >= 5 && <div className="scan-dialogue" data-testid="text-mirror-dialogue"><Malayalam>“ഞാൻ ഇപ്പോഴും കാക്ക തന്നെയല്ലേ?”</Malayalam><br /><br /><Malayalam>“ഇത്രയും കുളിപ്പിച്ചിട്ടും ഇതാണോ അവസ്ഥ?”</Malayalam></div>}
                <div className="button-row" style={{ marginTop: '1.2rem' }}>
                  <button className="primary-btn" type="button" disabled={scanLine < 5} onClick={() => setStage('compare')} data-testid="button-continue-mirror">Review evidence</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stage === 'compare' && (
          <section className="stage-enter" data-testid="stage-compare">
            <div className="section-head"><div><div className="eyebrow">Evidence board / 04</div><h1 className="section-title">Before & after.</h1></div><div className="mono-status">Conclusion: still a crow</div></div>
            <div className="compare-card">
              <div className="compare-columns">
                <div className="compare-column"><div className="eyebrow">Before</div><img src={missionImage} alt="Normal crow before the experiment" data-testid="img-before-crow" /><h3>Normal crow</h3><p>Dry. Suspicious. Correct.</p></div>
                <div className="compare-column after"><div className="eyebrow">After</div><img src={mirrorImage} alt="Very clean crow after the experiment" data-testid="img-after-crow" /><h3>Very clean crow</h3><p>Clean. Furious. Still correct.</p></div>
              </div>
              <div className="metrics-grid">
                <div className="metric"><b>{baths}</b><span>Baths taken</span></div>
                <div className="metric"><b>100%</b><span>Cleanliness</span></div>
                <div className="metric"><b>0%</b><span>Transformation</span></div>
                <div className="metric"><b>0%</b><span>Species change</span></div>
                <div className="metric"><b>-80%</b><span>Confidence</span></div>
              </div>
              <p className="quote" data-testid="text-compare-quote"><Malayalam>“കാക്ക തന്നെ. നന്ദി.”</Malayalam></p>
              <div className="button-row" style={{ marginTop: '1.5rem' }}><button className="primary-btn" type="button" onClick={() => setStage('achievements')} data-testid="button-continue-evidence">See useless achievements</button></div>
            </div>
          </section>
        )}

        {stage === 'achievements' && (
          <section className="stage-enter" data-testid="stage-achievements">
            <div className="section-head"><div><div className="eyebrow">Awards & expert consultation / 05</div><h1 className="section-title">Congratulations. You achieved almost nothing.</h1></div><div className="mono-status">{isLongMission ? 'Emergency consultation unlocked' : 'A modest disaster'}</div></div>
            <div className="achievement-layout">
              <div className="achievements-card">
                <div className="eyebrow">Useless achievements</div>
                <div className="achievement-list">
                  {[
                    ['01', 'First bath', 'Crow survived 1 bath.'],
                    ['10', 'Clean crow', `${Math.min(baths, 10)} baths completed.`],
                    ['100', 'Obsessed owner', `${baths} baths completed.`],
                    ['MAX', 'Still a crow', 'Maximum transformation reached: 0%.'],
                  ].map(([badge, title, detail]) => (
                    <div className="achievement" key={title} data-testid={`achievement-${title.toLowerCase().replaceAll(' ', '-')}`}>
                      <div className="achievement-badge">{badge}</div><div><b>{title}</b><span>{detail}</span></div>
                    </div>
                  ))}
                </div>
                <p className="quote"><Malayalam>“നിനക്ക് ശരിക്കും വേറെ പണിയില്ലേ?”</Malayalam></p>
              </div>
              {isLongMission ? (
                <div className="expert-panel" data-testid="panel-expert-consultation">
                  <div className="eyebrow">Emergency expert consultation</div>
                  <h2>Three experts. One obvious answer.</h2>
                  <div className="experts">
                    <div className="expert"><b>Scientist</b><p>“It&apos;s a crow.”</p></div>
                    <div className="expert"><b>Doctor</b><p>“Definitely a crow.”</p></div>
                    <div className="expert"><b>Grandfather</b><p><Malayalam>“ഞാൻ അപ്പോഴേ പറഞ്ഞില്ലേ...”</Malayalam></p></div>
                  </div>
                  <p className="expert-note"><Malayalam>“കാക്ക കുളിച്ചാൽ കൊക്കാവില്ല!”</Malayalam></p>
                </div>
              ) : (
                <div className="expert-panel" data-testid="panel-expert-locked">
                  <div className="eyebrow">Emergency expert consultation</div>
                  <h2>Reach 100 baths to summon the experts.</h2>
                  <p className="expert-note">Your crow has filed a formal complaint about the current workload.</p>
                </div>
              )}
            </div>
            <div className="button-row" style={{ marginTop: '1.5rem' }}><button className="primary-btn" type="button" onClick={() => setStage('result')} data-testid="button-view-result">View final result</button></div>
          </section>
        )}

        {stage === 'result' && (
          <section className="stage-enter" data-testid="stage-result">
            <div className="report-card">
              <figure className="result-art"><img src={finalImage} alt="A dramatically dressed, still-black crow delivering the final verdict" data-testid="img-final-crow" /><figcaption>Official species portrait / crow</figcaption></figure>
              <div>
                <div className="eyebrow">Operation Kokku / complete</div>
                <h1>Mission failed successfully.</h1>
                <div className="report-stats">
                  <div className="report-stat"><b>{baths}</b><span>Baths</span></div>
                  <div className="report-stat"><b>{waterUsed.toLocaleString()} L</b><span>Water used</span></div>
                  <div className="report-stat"><b>₹{moneyWasted.toLocaleString()}</b><span>Money wasted</span></div>
                  <div className="report-stat"><b>100%</b><span>Cleanliness</span></div>
                  <div className="report-stat"><b>0%</b><span>Transformation</span></div>
                  <div className="report-stat"><b>CROW</b><span>Final species</span></div>
                </div>
                <div className="proverb" data-testid="text-final-proverb"><Malayalam>“എത്ര തവണ കുളിപ്പിച്ചാലും ഞാൻ കാക്ക തന്നെയാടാ!”</Malayalam><br /><br /><Malayalam>കാക്ക കുളിച്ചാൽ കൊക്കാവില്ല!</Malayalam></div>
                <div className="button-row"><button className="primary-btn white-btn" type="button" onClick={reset} data-testid="button-try-again">Try again</button></div>
                <p className="final-note">Result: You spent all that time proving a proverb.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function stageLabel(stage: Stage) {
  const labels: Record<Stage, string> = {
    opening: 'Mission briefing',
    bathing: 'Live operation',
    mirror: 'Transformation test',
    compare: 'Evidence review',
    achievements: 'Awards desk',
    result: 'Mission report',
  };
  return labels[stage];
}

export default App;