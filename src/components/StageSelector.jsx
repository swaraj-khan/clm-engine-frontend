import React from 'react';

function StageSelector({ stages, selected, onChange }) {
  return (
    <div style={{ margin: '20px 0' }}>
      <label>
        Select bucket:
        <select
          className="select"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default StageSelector;