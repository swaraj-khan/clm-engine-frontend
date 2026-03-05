import React, { useState, useEffect } from 'react';
import StageSelector from './StageSelector';
import UserTable from './UserTable';
import RuleBuilder from './RuleBuilder';
import { supabase } from '../supabaseClient';

const USER_STAGES = [
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

const RA_STAGES = [
  'JOB_POSTED',
  'CANDIDATE_SUBMITTED',
  'COMPLIANCE_PENDING',
];

function CohortEngine({ userId }) { 
  const [stage, setStage] = useState(USER_STAGES[0]);
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('list'); 
  const [cohorts, setCohorts] = useState([]); 
  const [editingIndex, setEditingIndex] = useState(null);
  const [waterfallResults, setWaterfallResults] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  const [mainTab, setMainTab] = useState('user'); 
  const [raStage, setRaStage] = useState('JOB_POSTED');

  const pageSize = 50;

  useEffect(() => {
    setPage(0);
    if (viewMode === 'view_data') {
      if (mainTab === 'user') {
        fetchUsers(stage, 0);
      } else if (mainTab === 'ra') {
        fetchRAData(raStage, 0);
      }
    }
  }, [stage, viewMode, mainTab, raStage]); 

  useEffect(() => {
    const fetchCohortsFromSupabase = async () => {
      if (!userId) return; 
      setLoading(true); 
      try {
        const { data, error } = await supabase
          .from('cohort_rules')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }); 
        if (error) throw error;
        setCohorts(data.map(c => ({ id: c.id, name: c.name, rule: c.rule_definition })));
      } catch (error) {
        console.error('Error fetching cohorts:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCohortsFromSupabase();
  }, [userId]); 

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

  const fetchRAData = async (raStage, newPage = 0) => {
    setLoading(true);
    try {
      const skipValue = newPage * pageSize;
      let url;
      
      if (raStage === 'JOB_POSTED') {
        url = `/ra/job-posted?limit=${pageSize}&skip=${skipValue}`;
      } else if (raStage === 'CANDIDATE_SUBMITTED') {
        url = `/ra/candidate-submitted?limit=${pageSize}&skip=${skipValue}`;
      } else if (raStage === 'COMPLIANCE_PENDING') {
        url = `/ra/compliance-pending?limit=${pageSize}&skip=${skipValue}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      let received = [];
      let total = 0;
      
      if (raStage === 'JOB_POSTED') {
        received = data.ras || [];
        total = data.count || 0;
      } else if (raStage === 'CANDIDATE_SUBMITTED') {
        received = data.submissions || [];
        total = data.count || 0;
      } else if (raStage === 'COMPLIANCE_PENDING') {
        received = data.ras || [];
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

  const handleSaveCohort = async (data) => {
    if (!userId) {
      alert('User not logged in. Cannot save cohort.');
      return;
    }
    setLoading(true);
    try {
      if (editingIndex !== null) {
        const cohortToUpdate = cohorts[editingIndex];
        const { error } = await supabase
          .from('cohort_rules')
          .update({ name: data.name, rule_definition: data.rule, updated_at: new Date().toISOString() })
          .eq('id', cohortToUpdate.id);
        if (error) throw error;

        const updated = [...cohorts];
        updated[editingIndex] = { ...data, id: cohortToUpdate.id };
        setCohorts(updated);
      } else {
        const { data: newCohortData, error } = await supabase
          .from('cohort_rules')
          .insert({ user_id: userId, name: data.name, rule_definition: data.rule })
          .select(); 
        if (error) throw error;

        if (newCohortData && newCohortData.length > 0) {
          setCohorts([...cohorts, {
            id: newCohortData[0].id,
            name: newCohortData[0].name,
            rule: newCohortData[0].rule_definition
          }]);
        }
      }
      setViewMode('list');
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving cohort:', error.message);
      alert('Failed to save cohort: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCohort = async (index) => {
    if (!userId) {
      alert('User not logged in. Cannot delete cohort.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this cohort?')) {
      setLoading(true);
      try {
        const cohortToDelete = cohorts[index];
        const { error } = await supabase
          .from('cohort_rules')
          .delete()
          .eq('id', cohortToDelete.id);
        if (error) throw error;

        const updated = [...cohorts];
        updated.splice(index, 1);
        setCohorts(updated);
      } catch (error) {
        console.error('Error deleting cohort:', error.message);
        alert('Failed to delete cohort: ' + error.message);
      } finally {
        setLoading(false);
      }
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

  const renderRATable = () => {
    if (!users.length) {
      return <p>No data found.</p>;
    }

    if (raStage === 'JOB_POSTED') {
      return (
        <div>
          {users.map((ra) => (
            <div key={ra._id} style={{ border: '1px solid #ccc', borderRadius: 4, marginBottom: 16, padding: 12 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>{ra.fullName || 'N/A'}</h4>
              <p style={{ margin: '0 0 4px 0', color: '#666' }}>Company: {ra.company?.name || '-'}</p>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>Email: {ra.email || '-'}</p>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Jobs Posted: {ra.postedJobsCount || 0}</p>
              {ra.jobs && ra.jobs.length > 0 && (
                <table className="table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Status</th>
                      <th>Country</th>
                      <th>Positions</th>
                      <th>Positions Filled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ra.jobs.map((job) => (
                      <tr key={job._id}>
                        <td>{job.title || '-'}</td>
                        <td>{job.status || '-'}</td>
                        <td>{job.country?.name || '-'}</td>
                        <td>{job.positions || '-'}</td>
                        <td>{job.positionFilled || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (raStage === 'CANDIDATE_SUBMITTED') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>RA Name</th>
              <th>Company</th>
              <th>Job Title</th>
              <th>Candidate Name</th>
              <th>Candidate Phone</th>
              <th>Application Status</th>
              <th>Applied At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.raName || '-'}</td>
                <td>{sub.raCompany || '-'}</td>
                <td>{sub.jobTitle || '-'}</td>
                <td>{sub.userName || '-'}</td>
                <td>{sub.userPhone || '-'}</td>
                <td>{sub.applicationStatus || '-'}</td>
                <td>{sub.appliedAt ? new Date(sub.appliedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (raStage === 'COMPLIANCE_PENDING') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>RA Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registration Number</th>
              <th>Missing Policies</th>
            </tr>
          </thead>
          <tbody>
            {users.map((ra) => (
              <tr key={ra._id}>
                <td>{ra.fullName || '-'}</td>
                <td>{ra.company?.name || '-'}</td>
                <td>{ra.email || '-'}</td>
                <td>{ra.phoneNumber || '-'}</td>
                <td>{ra.registrationNumber || '-'}</td>
                <td>{ra.missingPolicies?.join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return <p>No data found.</p>;
  };

  const renderPartnerTable = () => {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
        <p>Partner functionality coming soon...</p>
      </div>
    );
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

          {/* Main Tab Selector: User, RA, Partner */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, borderBottom: '2px solid #ddd', paddingBottom: 10 }}>
            <button
              onClick={() => { setMainTab('user'); setStage(USER_STAGES[0]); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: mainTab === 'user' ? '#007bff' : '#f0f0f0',
                color: mainTab === 'user' ? '#fff' : '#333',
                fontWeight: mainTab === 'user' ? 'bold' : 'normal',
              }}
            >
              User
            </button>
            <button
              onClick={() => { setMainTab('ra'); setRaStage(RA_STAGES[0]); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: mainTab === 'ra' ? '#007bff' : '#f0f0f0',
                color: mainTab === 'ra' ? '#fff' : '#333',
                fontWeight: mainTab === 'ra' ? 'bold' : 'normal',
              }}
            >
              RA
            </button>
            <button
              onClick={() => { setMainTab('partner'); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: mainTab === 'partner' ? '#007bff' : '#f0f0f0',
                color: mainTab === 'partner' ? '#fff' : '#333',
                fontWeight: mainTab === 'partner' ? 'bold' : 'normal',
              }}
            >
              Partner
            </button>
          </div>

          {/* User Tab Content */}
          {mainTab === 'user' && (
            <div>
              <StageSelector
                stages={USER_STAGES}
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

          {/* RA Tab Content */}
          {mainTab === 'ra' && (
            <div>
              <div style={{ margin: '20px 0' }}>
                <label>
                  Select RA Stage:
                  <select
                    className="select"
                    value={raStage}
                    onChange={(e) => setRaStage(e.target.value)}
                  >
                    {RA_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>{count} records</p>
              {loading ? <p>Loading...</p> : renderRATable()}
              <div style={{ marginTop: '20px' }}>
                <button
                  disabled={page === 0 || loading}
                  onClick={() => fetchRAData(raStage, page - 1)}
                >
                  Previous
                </button>
                <span style={{ margin: '0 10px' }}>
                  Page {page + 1} of {Math.max(1, Math.ceil(count / pageSize))}
                </span>
                <button
                  disabled={loading || (page + 1) * pageSize >= count}
                  onClick={() => fetchRAData(raStage, page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Partner Tab Content */}
          {mainTab === 'partner' && (
            <div>
              {renderPartnerTable()}
            </div>
          )}
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
