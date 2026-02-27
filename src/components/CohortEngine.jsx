import React, { useState, useEffect } from 'react';
import StageSelector from './StageSelector';
import UserTable from './UserTable';
import RuleBuilder from './RuleBuilder';

const STAGES = [
  'REGISTERED',
  'PROFILE_INCOMPLETE',
  'PROFILE_COMPLETE',
  'ASSESSMENT_PENDING',
  'INTERVIEW_SCHEDULED',
  'OFFER_RECEIVED',
  'DEPLOYED',
  'DORMANT',
  'DROPPED_OFF',
  'APPLIED_ALL',
];

function CohortEngine() {
  const [stage, setStage] = useState(STAGES[0]);
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [subTab, setSubTab] = useState(null); // null | 'view' | 'build'
  const pageSize = 50;

  useEffect(() => {
    // when stage changes reset pagination
    setPage(0);
    if (subTab === 'view') fetchUsers(stage, 0);
  }, [stage, subTab]);

  const fetchUsers = async (selectedStage, newPage = 0) => {
    setLoading(true);
    try {
      const skipValue = newPage * pageSize;
      let url;
      if (selectedStage === 'APPLIED_ALL') {
        url = `/users/applied-all?limit=${pageSize}&skip=${skipValue}`;
      } else {
        url = `/users?status=${selectedStage}&limit=${pageSize}&skip=${skipValue}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      let received = [];
      let total = 0;
      if (selectedStage === 'APPLIED_ALL') {
        received = data.applications || [];
        total = data.count || 0;
      } else {
        received = data.users || [];
        total = data.count || 0;
      }
      setUsers(received);
      setCount(total);
      setPage(newPage);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenView = () => {
    setSubTab('view');
    fetchUsers(stage, 0);
  };

  const handleOpenBuild = () => {
    setSubTab('build');
  };

  const handleBack = () => {
    setSubTab(null);
  };

  return (
    <div className="engine-container">
      <h2>Cohort Engine</h2>

      {subTab === null && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleOpenView}>View Data</button>
          <button onClick={handleOpenBuild}>Build Cohorts</button>
        </div>
      )}

      {subTab === 'view' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={handleBack}>← Back</button>
          </div>

          <StageSelector
            stages={STAGES}
            selected={stage}
            onChange={setStage}
          />
          <p>{count} users{stage === 'APPLIED_ALL' ? ' (applied)' : ''}</p>
          {loading ? <p>Loading...</p> : <UserTable users={users} stage={stage} />}
          <div style={{ marginTop: '20px' }}>
            <button
              disabled={page === 0 || loading}
              onClick={() => fetchUsers(stage, page - 1)}
            >
              Previous
            </button>
            <span style={{ margin: '0 10px' }}>
              Page {page + 1} of {Math.max(1, Math.ceil(count / pageSize))}
            </span>
            <button
              disabled={loading || (page + 1) * pageSize >= count}
              onClick={() => fetchUsers(stage, page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {subTab === 'build' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={handleBack}>← Back</button>
          </div>
          <RuleBuilder onSave={(ruleJson) => console.log('Saved cohort rule:', ruleJson)} />
        </div>
      )}
    </div>
  );
}

export default CohortEngine;