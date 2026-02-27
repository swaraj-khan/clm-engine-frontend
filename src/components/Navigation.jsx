import React from 'react';

function Navigation({ activeTab, onTabChange }) {
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
      </div>
    </nav>
  );
}

export default Navigation;