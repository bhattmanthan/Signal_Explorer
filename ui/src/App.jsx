import { useState, useEffect, useMemo } from 'react';
import './index.css';

const MEDIUMS = [
  { name: "Twisted Pair", attenuationDbPerKm: 0.2 },
  { name: "Fiber Optic", attenuationDbPerKm: 0.05 }
];

function App() {
  const [distance, setDistance] = useState(30); // km
  const [temperature, setTemperature] = useState(25); // Celsius
  const [bandwidth, setBandwidth] = useState(1000); // MHz
  const [levels, setLevels] = useState(4); // signal levels
  const [inputPowerDb, setInputPowerDb] = useState(-80); // dBW
  const [mediumIdx, setMediumIdx] = useState(0); // 0 or 1
  
  const [visualNoiseScale, setVisualNoiseScale] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const [results, setResults] = useState({
    receivedPower: 0,
    noisePower: 0,
    snr: 100,
    snrDb: 20,
    nyquistRate: 0,
    shannonCapacity: 0
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchSimulation = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const query = new URLSearchParams({
          distance,
          temperature: temperature,
          bandwidth: bandwidth * 1e6, 
          levels,
          inputPower: inputPowerDb,
          medium: mediumIdx
        });
        const res = await fetch(`http://localhost:3000/simulate?${query}`);
        if (!res.ok) throw new Error("Backend error connection");
        const data = await res.json();
        
        if (!data || isNaN(data.receivedPower)) throw new Error("Invalid format");
        
        if (active) {
            setResults(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
            setFetchError("API Unreachable: Ensure node server is running.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    
    const timeoutMsg = setTimeout(() => fetchSimulation(), 150);
    return () => {
      active = false;
      clearTimeout(timeoutMsg); 
    };
  }, [distance, temperature, bandwidth, levels, inputPowerDb, mediumIdx]);

  const formatSci = (num) => (num ? num.toExponential(2).replace('e', ' E') : "0 E0");
  const formatLarge = (num) => {
    if (!num) return "0 bps";
    if (num > 1e9) return (num / 1e9).toFixed(2) + ' Gbps';
    if (num > 1e6) return (num / 1e6).toFixed(2) + ' Mbps';
    if (num > 1e3) return (num / 1e3).toFixed(2) + ' kbps';
    return num.toFixed(2) + ' bps';
  };

  const waves = useMemo(() => {
    if (!results) return { cleanPath: "", noisyPath: "" };
    
    const maxPoints = 400; 
    const cleanPoints = [];
    const noisyPoints = [];
    
    let powerScale = 1.0 + (inputPowerDb / 150);
    if (powerScale < 0.2) powerScale = 0.2; 
    const baseAmp = 60 * powerScale; 
    
    const inputPowerW = Math.pow(10, inputPowerDb / 10);
    // Calculate the real physical attenuation
    let attenuationRatio = results.receivedPower / inputPowerW;
    if(!isFinite(attenuationRatio) || attenuationRatio < 1e-10) attenuationRatio = 1e-10;
    if(attenuationRatio > 1) attenuationRatio = 1;
    
    // We dampen the shrinkage slightly using power(0.4) so massive attenuation still leaves a viewable tiny wave,
    // but the user will visibly see the wave shrink as distance increases!
    let rxAmp = baseAmp * Math.pow(attenuationRatio, 0.4); 
    if (rxAmp < 3) rxAmp = 3; // hard floor so it never disappears to 0px

    
    let snrLinear = results.snr;
    if (!isFinite(snrLinear)) snrLinear = 1e9;
    
    // Strict physics scale: base thermal noise
    let noiseLevel = rxAmp / Math.sqrt(snrLinear);
    
    // Artificial visual amplification
    let visualMultiplier = Math.pow(visualNoiseScale, 3);
    noiseLevel = noiseLevel * visualMultiplier;
    
    if (noiseLevel > rxAmp * 1.5) noiseLevel = rxAmp * 1.5;
    if (noiseLevel > 80) noiseLevel = 80;

    // Enforce an even number of cycles so the SVG CSS translation loops seamlessly without snapping!
    let rawCycles = 2 + Math.pow(bandwidth / 5000, 0.4) * 15;
    let cycles = Math.max(2, Math.round(rawCycles / 2) * 2);

    for (let i = 0; i <= maxPoints; i++) {
        const x = (i / maxPoints) * Math.PI * 2 * cycles; 
        const yClean = Math.sin(x) * baseAmp;
        const yRxClean = Math.sin(x) * rxAmp;
        
        const noise = (Math.random() - 0.5) * 2 * noiseLevel;
        const yNoisy = yRxClean + noise;

        cleanPoints.push(`${i},${160 - yClean}`);
        noisyPoints.push(`${i},${160 - yNoisy}`);
    }

    return { cleanPath: cleanPoints.join(' '), noisyPath: noisyPoints.join(' ') };
  }, [results, visualNoiseScale]);

  return (
    <div className="app-container">
      <header>
        <h1>Signal Explorer</h1>
        <p>Real-time Channel Capacity & Degradation Analytics Engine</p>
      </header>

      <div className="dashboard">
        <div className="glass-panel">
          <div className={`loading-overlay ${loading ? 'active' : ''}`}>
            SYNCING TELEMENTRY...
          </div>
          <h2 className="panel-title">Physical Channel Parameters</h2>
          
          <div className="control-group">
            <label>Transmission Medium</label>
            <select value={mediumIdx} onChange={e => setMediumIdx(Number(e.target.value))}>
              {MEDIUMS.map((m, i) => (
                <option key={i} value={i}>{m.name} ({m.attenuationDbPerKm} dB/km α)</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Distance <span className="val">{distance} km</span></label>
            <input type="range" min="1" max="250" step="1" value={distance} onChange={e => setDistance(Number(e.target.value))} />
          </div>

          <div className="control-group">
            <label>Input Power <span className="val">{inputPowerDb} dBW</span></label>
            <input type="range" min="-100" max="50" step="1" value={inputPowerDb} onChange={e => setInputPowerDb(Number(e.target.value))} />
          </div>

          <div className="control-group">
            <label>Bandwidth <span className="val">{bandwidth} MHz</span></label>
            <input type="range" min="1" max="5000" step="1" value={bandwidth} onChange={e => setBandwidth(Number(e.target.value))} />
          </div>

          <div className="control-group">
            <label>Signal Levels (M = 2^n) <span className="val">{levels} (n={Math.log2(levels)})</span></label>
            <input type="range" min="1" max="8" step="1" value={Math.log2(levels)} onChange={e => setLevels(Math.pow(2, Number(e.target.value)))} />
          </div>

          <div className="control-group">
            <label>Ambient Temperature <span className="val">{temperature} °C</span></label>
            <input type="range" min="-100" max="200" step="1" value={temperature} onChange={e => setTemperature(Number(e.target.value))} />
          </div>
          
          <hr style={{borderColor: "rgba(255,255,255,0.05)", margin: "2rem 0 1.5rem"}}/>
          
          <div className="control-group">
            <label style={{color: 'var(--purple)'}}>Oscilloscope Noise Extrapolator <span className="val" style={{color: 'var(--purple)'}}>{visualNoiseScale}x</span></label>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.3rem', marginBottom: '0.8rem', lineHeight: '1.4'}}>
              Boost this multiplier strictly for visual rendering to artificially surface microscopic noise floors onto the oscilloscope view.
            </p>
            <input type="range" min="1" max="100" step="1" value={visualNoiseScale} onChange={e => setVisualNoiseScale(Number(e.target.value))} />
          </div>
        </div>

        <div className="results-panel">
          {fetchError ? (
            <div style={{color: '#f43f5e', padding: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '16px', border: '1px solid rgba(244, 63, 94, 0.2)'}}>
              <strong>CONNECTION FAULT:</strong> {fetchError}
            </div>
          ) : (
          <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Received Power [W]</div>
              <div className="stat-value">{formatSci(results.receivedPower)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Thermal Noise Floor [W]</div>
              <div className="stat-value">{formatSci(results.noisePower)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">SNR Magnitude</div>
              <div className={`stat-value ${results.snrDb < 15 ? 'danger' : 'success'}`}>
                {results.snrDb.toFixed(2)} dB
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card" style={{borderColor: 'rgba(192, 132, 252, 0.3)'}}>
               <div className="stat-label" style={{color: 'var(--purple)'}}>Nyquist Theoretical Bit Rate</div>
               <div className="stat-value" style={{color: 'var(--purple)', textShadow: '0 0 20px rgba(192, 132, 252, 0.4)'}}>{formatLarge(results.nyquistRate)}</div>
            </div>
            <div className="stat-card" style={{borderColor: 'rgba(251, 191, 36, 0.3)'}}>
               <div className="stat-label" style={{color: 'var(--gold)'}}>Shannon Capacity Limit</div>
               <div className="stat-value" style={{color: 'var(--gold)', textShadow: '0 0 20px rgba(251, 191, 36, 0.4)'}}>{formatLarge(results.shannonCapacity)}</div>
            </div>
          </div>

          <div className="glass-panel" style={{padding: '1.5rem'}}>
             <h2 className="panel-title" style={{border: 'none', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>Live Spectrum Oscilloscope</span>
                <div style={{display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)'}}>
                   <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                     <input type="checkbox" checked={isPaused} onChange={e => setIsPaused(e.target.checked)} style={{accentColor: 'var(--accent)', cursor: 'pointer'}} />
                     PAUSE
                   </label>
                   <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                     <span style={{letterSpacing: '0.05em'}}>ZOOM:</span>
                     <input type="range" min="0.5" max="4.0" step="0.1" value={zoomLevel} onChange={e => setZoomLevel(Number(e.target.value))} style={{width: '70px', marginTop: 0}}/>
                     <span style={{width: '35px', textAlign: 'right', fontFamily: 'monospace'}}>{zoomLevel.toFixed(1)}x</span>
                   </label>
                </div>
             </h2>
             <div className="waveform-container">
                <svg className="waveform-svg" viewBox={`${100 - (100/zoomLevel)} ${160 - (160/zoomLevel)} ${200/zoomLevel} ${320/zoomLevel}`} preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                      </pattern>
                      <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                        <rect width="100" height="100" fill="url(#grid)" />
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                      </pattern>
                    </defs>

                    <rect width="1000" height="1000" x="-500" y="-500" fill="url(#grid-major)" />
                    <line x1="-500" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                    <g className="wave-group" style={{ animationPlayState: isPaused ? 'paused' : 'running' }}>
                        <polyline points={waves.cleanPath} fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.2" strokeDasharray="4 4" />
                        <polyline points={waves.noisyPath} fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </svg>
             </div>
             <div className="legend">
                <div className="legend-item"><div className="legend-color" style={{background: 'rgba(255, 255, 255, 0.4)'}}></div> Source (Reference)</div>
                <div className="legend-item"><div className="legend-color" style={{background: '#22d3ee'}}></div> Received Signal (+ True Noise)</div>
             </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

export default App;
