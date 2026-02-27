import React from 'react';

function UserTable({ users, stage }) {
  if (!users.length) {
    return <p>No users found.</p>;
  }

  if (stage === 'APPLIED_ALL') {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Job Title</th>
            <th>Company</th>
            <th>Application Status</th>
            <th>Applied At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.userId}</td>
              <td>{u.jobSnapshot?.title || '-'}</td>
              <td>{u.jobSnapshot?.company?.name || '-'}</td>
              <td>{u.applicationStatus || '-'}</td>
              <td>{u.appliedAt ? new Date(u.appliedAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>User Type</th>
          <th>Target Country</th>
          <th>Target Job Role</th>
          <th>Profile Complete</th>
          <th>Last Activity</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u._id}>
            <td>{u.fullName || '-'}</td>
            <td>{u.phoneNumber || '-'}</td>
            <td>{u.userType || '-'}</td>
            <td>{u.targetCountry?.name || '-'}</td>
            <td>{u.targetJobRole?.name || '-'}</td>
            <td>{u.isProfileCompleted ? 'Yes' : 'No'}</td>
            <td>{u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;