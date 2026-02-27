import React, { useState, useEffect } from 'react';
import StageSelector from './components/StageSelector';
import UserTable from './components/UserTable';

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

function App() {
  const [stage, setStage] = useState(STAGES[0]);
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    setPage(0);
    fetchUsers(stage, 0);
  }, [stage]);

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

  return (
    <div className="container">
      <h1>CLM Dashboard</h1>
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
          Page {page + 1} of {Math.ceil(count / pageSize)}
        </span>
        <button
          disabled={loading || (page + 1) * pageSize >= count}
          onClick={() => fetchUsers(stage, page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;