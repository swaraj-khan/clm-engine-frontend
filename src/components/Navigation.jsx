import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Navigation({ activeTab, onTabChange, userEmail }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
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
        <div className="nav-tabs-wrapper">
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
        <div className="nav-user-section">
          <div className="user-dropdown">
            <button 
              className="user-dropdown-toggle" 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              User ▼
            </button>
            {showUserDropdown && (
              <div className="user-dropdown-menu">
                <div className="user-email">{userEmail}</div>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
