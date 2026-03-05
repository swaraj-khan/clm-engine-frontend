import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navigation from './components/Navigation';
import Welcome from './components/Welcome';
import CohortEngine from './components/CohortEngine';
import WorkflowOrchestrationEngine from './components/WorkflowOrchestrationEngine';
import MultiChannelCommunicationLayer from './components/MultiChannelCommunicationLayer';
import TemplateManagementSystem from './components/TemplateManagementSystem';
import ABTestingEngine from './components/ABTestingEngine';
import AuditBehaviorTrackingEngine from './components/AuditBehaviorTrackingEngine';
import AdminDashboard from './components/AdminDashboard';
import EventListenerReassignmentEngine from './components/EventListenerReassignmentEngine';
import Login from './components/Login';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderActiveComponent = () => {
    if (!activeTab) return <Welcome />;
    switch (activeTab) {
      case 'Cohort Engine':
        return <CohortEngine userId={session.user?.id} />;
      case 'Workflow Orchestration Engine':
        return <WorkflowOrchestrationEngine />;
      case 'Multi-Channel Communication Layer':
        return <MultiChannelCommunicationLayer />;
      case 'Template Management System':
        return <TemplateManagementSystem />;
      case 'A/B Testing Engine':
        return <ABTestingEngine />;
      case 'Audit & Behavior Tracking Engine':
        return <AuditBehaviorTrackingEngine />;
      case 'Admin Dashboard':
        return <AdminDashboard />;
      case 'Event Listener & Real-time Reassignment Engine':
        return <EventListenerReassignmentEngine />;
      default:
        return <Welcome />;
    }
  };

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} userEmail={session.user?.email} />
      <main className="main-content">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;