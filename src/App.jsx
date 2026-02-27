import React, { useState } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'Cohort Engine':
        return <CohortEngine />;
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

  return (
    <div className="app">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;