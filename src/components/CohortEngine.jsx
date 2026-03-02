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
  const [viewMode, setViewMode] = useState('list'); 
  const [cohorts, setCohorts] = useState([]); 
  const [editingIndex, setEditingIndex] = useState(null);
  const [waterfallResults, setWaterfallResults] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  const pageSize = 50;

  useEffect(() => {
    setPage(0);
    if (viewMode === 'view_data') fetchUsers(stage, 0);
  }, [stage, viewMode]);

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

  const handleSaveCohort = (data) => {
    if (editingIndex !== null) {
      const updated = [...cohorts];
      updated[editingIndex] = { ...data, id: cohorts[editingIndex].id };
      setCohorts(updated);
    } else {
      setCohorts([...cohorts, { ...data, id: Date.now() }]);
    }
    setViewMode('list');
    setEditingIndex(null);
  };

  const handleDeleteCohort = (index) => {
    if (window.confirm('Are you sure you want to delete this cohort?')) {
      const updated = [...cohorts];
      updated.splice(index, 1);
      setCohorts(updated);
    }
  };

  const handleEditCohort = (index) => {
    setEditingIndex(index);
    setViewMode('build');
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex) return;
    
    const newCohorts = [...cohorts];
    const [moved] = newCohorts.splice(dragIndex, 1);
    newCohorts.splice(dropIndex, 0, moved);
    setCohorts(newCohorts);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    setWaterfallResults(null);
    const results = [];
    const seenIds = new Set();

    try {
      for (const cohort of cohorts) {
        const res = await fetch('/cohorts/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cohort.rule),
        });

        if (!res.ok) {
          console.error(`Failed to fetch preview for cohort: ${cohort.name}`);
          continue;
        }

        const data = await res.json();
        
        let rawUsers = [];
        if (Array.isArray(data)) rawUsers = data; else if (data && Array.isArray(data.users)) rawUsers = data.users; else if (data && Array.isArray(data.sample)) rawUsers = data.sample;
        
        const allocatedUsers = rawUsers.filter(u => !seenIds.has(u._id));
        allocatedUsers.forEach(u => seenIds.add(u._id));

        results.push({
          name: cohort.name,
          users: allocatedUsers,
          totalRaw: rawUsers.length
        });
      }
      setWaterfallResults(results);
    } catch (err) {
      console.error('Failed to run cohorts', err);
      alert('Error executing cohorts. Check console.');
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="engine-container">
      <h2>Cohort Engine</h2>

      {viewMode === 'list' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button onClick={() => { setEditingIndex(null); setViewMode('build'); }}>+ Create New Cohort</button>
            <button onClick={handleRunAll} disabled={cohorts.length === 0 || runningAll}>
              {runningAll ? 'Running...' : 'Run All (Waterfall)'}
            </button>
            <button onClick={() => setViewMode('view_data')}>Raw Data Explorer</button>
          </div>

          {cohorts.length === 0 ? (
            <p>No cohorts defined. Create one to get started.</p>
          ) : (
            <div className="cohort-list">
              <h3>Priority List (Drag to reorder)</h3>
              <div style={{ border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
                {cohorts.map((c, idx) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #eee',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'move',
                    }}
                  >
                    <strong style={{ marginRight: 12, color: '#555' }}>#{idx + 1}</strong>
                    <span style={{ flex: 1, fontWeight: 'bold' }}>{c.name}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleEditCohort(idx)}>Edit</button>
                      <button onClick={() => handleDeleteCohort(idx)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {waterfallResults && (
            <div style={{ marginTop: 30 }}>
              <h3>Waterfall Execution Results</h3>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Users are assigned to the first cohort they match.
              </p>
              {waterfallResults.map((res, idx) => (
                <div key={idx} style={{ marginBottom: 20, border: '1px solid #e0e0e0', padding: 10, borderRadius: 6 }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    #{idx + 1} {res.name} 
                    <span style={{ fontWeight: 'normal', marginLeft: 10 }}>
                      ({res.users.length} users allocated)
                    </span>
                  </h4>
                  {res.users.length > 0 ? (
                    <UserTable users={res.users} stage="CUSTOM" />
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#888' }}>No new users matched (or all matched were taken by higher priority cohorts).</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'view_data' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setViewMode('list')}>← Back to Cohorts</button>
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

      {viewMode === 'build' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setViewMode('list')}>← Back</button>
          </div>
          <RuleBuilder 
            onSave={handleSaveCohort} 
            onCancel={() => setViewMode('list')}
            initialData={editingIndex !== null ? cohorts[editingIndex] : null}
          />
        </div>
      )}
    </div>
  );
}

export default CohortEngine;