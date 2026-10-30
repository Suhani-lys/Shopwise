import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  X, 
  Layers, 
  Database, 
  Server, 
  Monitor, 
  Sparkles, 
  Globe, 
  Cpu, 
  CheckCircle2, 
  ArrowDown, 
  ShieldCheck, 
  BarChart3 
} from 'lucide-react';

export default function ArchitectureModal() {
  const { 
    isArchitectureModalOpen, 
    setIsArchitectureModalOpen, 
    backendOnline, 
    dbStatus 
  } = useShopwise();

  const [activeLayer, setActiveLayer] = useState('dataFlow'); // 'dataFlow', 'techStack', 'algorithm'

  if (!isArchitectureModalOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 140,
      background: 'rgba(12, 10, 23, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-card)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C5CFC 0%, #5A32E8 100%)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>ShopWise System Architecture & Design</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Final Year Project Technical Specification & MERN Full-Stack Blueprint
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card-subtle)'
        }}>
          {[
            { id: 'dataFlow', label: 'End-to-End System Flow', icon: Layers },
            { id: 'techStack', label: 'MERN Technology Stack', icon: Server },
            { id: 'algorithm', label: 'Proprietary SVS & Trust Formula', icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTab = activeLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                className={isTab ? "btn-lavender" : "btn-secondary"}
                style={{ padding: '8px 16px', fontSize: '0.825rem' }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px' }}>
          {/* TAB 1: System Flow Diagram */}
          {activeLayer === 'dataFlow' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>MERN Stack System Architecture (From Poster)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Multi-tier decoupled architecture separating presentation, REST orchestration, data persistence, and intelligence services.
                </p>
              </div>

              {/* Block Diagram Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
                {/* Layer 1: Client UI */}
                <div style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      1. Presentation Tier (React 18 + Vite)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Lavender glassmorphism UI, real-time product search, side-by-side matrices, interactive SVG price tracking charts, and target price alert triggers.
                    </div>
                  </div>
                  <span className="badge-lavender">Client Port 5173</span>
                </div>

                <ArrowDown size={18} color="var(--primary-lavender)" />

                {/* Layer 2: Backend API */}
                <div style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Server size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      2. Application & Controller Tier (Node.js + Express REST API)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      REST endpoints for <code>/api/products</code>, <code>/api/compare</code>, <code>/api/alerts</code>, and <code>/api/smart-rank</code> with CORS, rate-limiting & error middleware.
                    </div>
                  </div>
                  <span className="badge-green">API Port 5000</span>
                </div>

                <ArrowDown size={18} color="var(--primary-lavender)" />

                {/* Layer 3: Intelligence & Data Tier */}
                <div style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px'
                }}>
                  {/* Database */}
                  <div style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <Database size={24} color="var(--primary-lavender)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>3A. Persistence Layer</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        MongoDB / Mongoose with enterprise zero-crash fallback hybrid store.
                      </div>
                    </div>
                  </div>

                  {/* AI & Scoring */}
                  <div style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <Cpu size={24} color="var(--accent-green)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>3B. AI & Analytics Engine</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        NLP Sentiment Summarizer, Review Trust Scoring, and Smart Value Ranker.
                      </div>
                    </div>
                  </div>
                </div>

                <ArrowDown size={18} color="var(--primary-lavender)" />

                {/* Layer 4: Multi-Store Feeds */}
                <div style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={20} color="var(--primary-lavender)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>
                      4. Data Integration Layer (E-Commerce Feeds & Scrapers)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Amazon.in', 'Flipkart', 'Myntra', 'Croma', 'Reliance Digital'].map(store => (
                      <span key={store} className="badge-lavender" style={{ fontSize: '0.72rem' }}>
                        {store}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tech Stack Breakdown */}
          {activeLayer === 'techStack' && (
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Technology Stack Specification</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary-lavender)', marginBottom: '8px' }}>Frontend Architecture</div>
                  <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>• React 18 with Context API state management</li>
                    <li>• Vite for sub-millisecond Hot Module Replacement (HMR)</li>
                    <li>• Lavender Design System with full Dark Mode support</li>
                    <li>• SVG Bezier Curve graphing engine for price trends</li>
                    <li>• Lucide modern SVG vector icons</li>
                  </ul>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary-lavender)', marginBottom: '8px' }}>Backend & Database</div>
                  <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>• Node.js v20 LTS Runtime Environment</li>
                    <li>• Express REST API with modular controllers & services</li>
                    <li>• Mongoose ODM connected to MongoDB (localhost:27017)</li>
                    <li>• Enterprise in-memory / JSON persistence fallback</li>
                    <li>• Asynchronous price alert notification simulator</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Formula & Algorithm */}
          {activeLayer === 'algorithm' && (
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px' }}>Proprietary Value & Trust Formulation</h4>
              
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.6
              }}>
                <div style={{ color: 'var(--primary-lavender)', fontWeight: 700 }}>Smart Value Score (SVS) Formula:</div>
                <div>SVS = (w_p * S_price) + (w_r * S_rating) + (w_t * S_trust) + (w_s * S_specs)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Where weights sum to 1.0 (Default: 35% Price, 25% Rating, 25% Trust, 15% Specs).
                </div>
              </div>

              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.6
              }}>
                <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>Review Trust Score (RTS) Formula:</div>
                <div>RTS = (Verified_Ratio * 0.7) + ((Average_Rating / 5) * 30) - (Anomaly_Penalty)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Penalizes high review velocities, sudden 5-star clustering, and repetitive review text.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
