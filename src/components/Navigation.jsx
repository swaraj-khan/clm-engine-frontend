import React from 'react';
import { supabase } from '../supabaseClient';

function Navigation({ activeTab, onTabChange, userEmail }) {
  const tabs = [
    'Cohort Engine',
    'Workflow Orchestration Engine',
    'Multi-Channel Communication Layer',
    'Template Management System',
    'A/B Testing Engine',
    'Audit & Behavior Tracking Engine',
    'Admin Dashboard',
    'Event Listener & Real-time Reassignment Engine',
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-title">CLM Platform</div>
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="nav-user-section" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#eee' }}>{userEmail}</span>
          <button onClick={handleLogout} className="nav-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;