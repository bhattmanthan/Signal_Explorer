import { useState, useEffect, useMemo } from 'react';
import './index.css';

const MEDIUMS = [
  { name: "Twisted Pair", attenuationDbPerKm: 0.2 },
  { name: "Fiber Optic", attenuationDbPerKm: 0.05 }
];

function App() {
  const [distance, setDistance] = useState(10); // km
  const [temperature, setTemperature] = useState(25); // Celsius
  const [bandwidth, setBandwidth] = useState(20); // MHz
  const [levels, setLevels] = useState(4); // signal levels
  const [inputPowerDb, setInputPowerDb] = useState(-30); // dBW
  const [mediumIdx, setMediumIdx] = useState(0); // 0 or 1
  
  const [visualNoiseScale, setVisualNoiseScale] = useState(20);

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
    
    const baseAmp = 60; 
    
    // FIX: Instead of scaling the amplitude heavily down to 0 (which makes it look like a flat line),
    // we keep the received wave amplitude visually large (75% of base) so you can clearly see the sinusoidal shape.
    let rxAmp = baseAmp * 0.75; 
    
    let snrLinear = results.snr;
    if (!isFinite(snrLinear)) snrLinear = 1e9;
    
    let noiseLevel = rxAmp / Math.sqrt(snrLinear);
    
    let visualMultiplier = Math.pow(visualNoiseScale, 3);
    noiseLevel = noiseLevel * visualMultiplier;
    
    if (noiseLevel > rxAmp * 1.5) noiseLevel = rxAmp * 1.5;
    if (noiseLevel > 80) noiseLevel = 80;

    for (let i = 0; i <= maxPoints; i++) {
        const x = (i / maxPoints) * Math.PI * 8; 
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
            <label>Signal Levels (M) <span className="val">{levels}</span></label>
            <input type="range" min="2" max="256" step="2" value={levels} onChange={e => setLevels(Number(e.target.value))} />
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
             <h2 className="panel-title" style={{border: 'none', marginBottom: '1rem'}}>
                Live Spectrum Oscilloscope
             </h2>
             <div className="waveform-container">
                <svg className="waveform-svg" viewBox="0 0 200 320" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradSignal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: '#38bdf8', stopOpacity: 0.8}} />
                        <stop offset="100%" style={{stopColor: '#818cf8', stopOpacity: 0.8}} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <g className="wave-group">
                        <polyline points={waves.cleanPath} fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.2" strokeDasharray="5 5" />
                        <polyline points={waves.noisyPath} fill="none" stroke="url(#gradSignal)" strokeWidth="1.5" filter="url(#glow)"/>
                    </g>
                </svg>
             </div>
             <div className="legend">
                <div className="legend-item"><div className="legend-color" style={{background: 'rgba(56, 189, 248, 0.3)'}}></div> Source Amplitude (Reference)</div>
                <div className="legend-item"><div className="legend-color" style={{background: 'linear-gradient(to right, #38bdf8, #818cf8)'}}></div> Realized Signal + Boosted Noise</div>
             </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

export default App;
