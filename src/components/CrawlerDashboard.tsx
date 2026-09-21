import React, { useState, useEffect } from 'react';
import { Play, Square, Download, Activity, Terminal, ShieldAlert, Database, Map } from 'lucide-react';

interface CrawlerStatus {
  isRunning: boolean;
  totalScraped: number;
  currentQuery: string;
  logs: string[];
  niche?: string;
  location?: string;
  totalLeads?: number;
}

export const CrawlerDashboard: React.FC = () => {
  const [niche, setNiche] = useState('Dentist');
  const [location, setLocation] = useState('Dubai, UAE');
  const [totalLeads, setTotalLeads] = useState(100);
  const [status, setStatus] = useState<CrawlerStatus>({
    isRunning: false,
    totalScraped: 0,
    currentQuery: '',
    logs: []
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:4001/api/crawler/status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Crawler backend not reachable');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    const cleanNiche = niche.trim();
    const cleanLocation = location.trim();
    const safeTotal = Number(totalLeads) || 0;

    if (!cleanNiche || !cleanLocation || safeTotal <= 0) {
      return alert('Please enter niche, location, and a valid lead count.');
    }

    try {
      await fetch('http://localhost:4001/api/crawler/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: cleanNiche, location: cleanLocation, totalLeads: safeTotal })
      });

      setTimeout(() => setStatus(prev => ({ ...prev, isRunning: true })), 500);
    } catch (err) {
      alert('Error starting crawler. Is the backend running?');
    }
  };

  const handleStop = async () => {
    try {
      await fetch('http://localhost:4001/api/crawler/stop', { method: 'POST' });
    } catch (err) {
      alert('Error stopping crawler');
    }
  };

  const handleDownload = () => {
    window.location.href = 'http://localhost:4001/api/crawler/download';
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderLeft: '5px solid #3b82f6', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', background: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                🚀 Targeted Lead Crawler
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'white' }}>
              Auto-lead scraper
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
              Set niche, location, and desired result count. Click start and the crawler will collect only that campaign.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownload}
              style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
            >
              <Download size={16} /> Download CSV
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Map size={18} color="var(--primary)" /> Campaign Setup
          </h3>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Niche / Business Type</label>
            <input
              type="text"
              className="input-field"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="e.g. Dentist, Real Estate, Plumber"
              disabled={status.isRunning}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Location</label>
            <input
              type="text"
              className="input-field"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Dubai, UAE or Lahore, Pakistan"
              disabled={status.isRunning}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Total Leads Count</label>
            <input
              type="number"
              className="input-field"
              value={totalLeads}
              min={10}
              step={10}
              onChange={e => setTotalLeads(Number(e.target.value) || 0)}
              disabled={status.isRunning}
            />
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            {status.isRunning ? (
              <button
                onClick={handleStop}
                style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Square size={16} fill="white" /> STOP CRAWLER
              </button>
            ) : (
              <button
                onClick={handleStart}
                style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Play size={16} fill="white" /> START
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: status.isRunning ? '#f0fdf4' : '#f8fafc' }}>
              <div style={{ padding: '12px', background: status.isRunning ? '#d1fae5' : '#e2e8f0', borderRadius: '50%' }}>
                <Activity size={24} color={status.isRunning ? '#059669' : '#64748b'} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>CRAWLER STATUS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: status.isRunning ? '#059669' : '#64748b' }}>
                  {status.isRunning ? '🟢 RUNNING' : '⏸️ IDLE'}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '50%' }}>
                <Database size={24} color="#4f46e5" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>TOTAL LEADS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3730a3' }}>
                  {status.totalScraped.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ flex: 1, padding: '20px', background: '#0f172a', color: '#34d399', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>
                <Terminal size={14} /> SYSTEM LOGS {status.currentQuery && `> ${status.currentQuery}`}
              </div>
              <ShieldAlert size={14} color="#64748b" />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column-reverse' }}>
              {status.logs.length === 0 ? (
                <div style={{ color: '#475569' }}>Awaiting command...</div>
              ) : (
                status.logs.map((log, idx) => (
                  <div key={idx} style={{ opacity: 1 - (idx * 0.05) }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
