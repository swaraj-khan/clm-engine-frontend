import React, { useState, useEffect } from 'react';

// Simple recursive rule/group builder
const FIELD_OPTIONS = [
  { value: 'userType', label: 'User Type' },
  { value: 'age', label: 'Age' },
  { value: 'targetCountry', label: 'Country' },
  { value: 'targetJobRole', label: 'Role' },
  { value: 'applicationStatus', label: 'Application Status' },
  { value: 'daysInactive', label: 'Days Since Profile Update or Application' },
  // attendance and profileSubmitted removed per request

];

const OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'does not equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'in', label: 'in' },
];

// these will be replaced with dynamic values fetched from server
let VALUE_OPTIONS = {
  userType: [],
  targetCountry: [],
  targetJobRole: [],
  applicationStatus: [],
};


const NUMERIC_FIELDS = ['age', 'daysInactive'];

function newRule() {
  return { type: 'rule', field: 'userType', operator: 'eq', value: '' };
}

function newGroup() {
  return { type: 'group', operator: 'AND', children: [] };
}

function RuleEditor({ node, onChange, onRemove }) {
  if (node.type === 'rule') {
    return (
      <>
      <div className="rule-row" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <select
          value={node.field}
          onChange={(e) => onChange({ ...node, field: e.target.value, value: '' })}
          className="select"
          style={{ minWidth: 160 }}
        >
          {FIELD_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          value={node.operator}
          onChange={(e) => onChange({ ...node, operator: e.target.value })}
          className="select"
          style={{ width: 160 }}
        >
          {OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>

        {/* Value input: select for known enums, number for numeric, text otherwise */}
        {VALUE_OPTIONS[node.field] ? (
          <select
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            className="select"
            style={{ minWidth: 180 }}
          >
            <option value="">(select)</option>
            {VALUE_OPTIONS[node.field].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ) : NUMERIC_FIELDS.includes(node.field) ? (
          <input
            type="number"
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            placeholder="number"
            style={{ width: 120 }}
          />
        ) : (
          <input
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            placeholder="value"
            style={{ minWidth: 180 }}
          />
        )}

        <button onClick={onRemove} style={{ marginLeft: 8 }}>Remove</button>
      </div>
      {node.field === 'daysInactive' && (
        <div style={{}}>
        </div>
      )}      </>    );
  }

  // group
  return (
    <div className="group" style={{ border: '1px solid #e0e0e0', padding: 12, borderRadius: 6, marginBottom: 12 }}>
      <div className="group-header" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ marginRight: 4 }}>Operator:</label>
        <select
          value={node.operator}
          onChange={(e) => onChange({ ...node, operator: e.target.value })}
          className="select"
          style={{ width: 100 }}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
        <button onClick={onRemove} style={{ marginLeft: 'auto' }}>Remove Group</button>
      </div>
      <div className="group-children">
        {node.children.map((child, idx) => (
          <RuleNode
            key={idx}
            node={child}
            onChange={(updated) => {
              const copy = { ...node, children: node.children.slice() };
              copy.children[idx] = updated;
              onChange(copy);
            }}
            onRemove={() => {
              const copy = { ...node, children: node.children.slice() };
              copy.children.splice(idx, 1);
              onChange(copy);
            }}
          />
        ))}

        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            onClick={() => onChange({ ...node, children: [...node.children, newRule()] })}
          >
            + Add Rule
          </button>
          <button
            onClick={() => onChange({ ...node, children: [...node.children, newGroup()] })}
          >
            + Add Group
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleNode({ node, onChange, onRemove }) {
  return (
    <div className="rule-node">
      <RuleEditor node={node} onChange={onChange} onRemove={onRemove} />
    </div>
  );
}

export default function RuleBuilder({ onSave }) {
  const [root, setRoot] = useState(newGroup());
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [options, setOptions] = useState(null);

  useEffect(() => {
    // load metadata once
    fetch('/cohorts/options')
      .then((r) => r.json())
      .then((data) => {
        VALUE_OPTIONS = {
          userType: data.userTypes || [],
          targetCountry: data.countries || [],
          targetJobRole: data.jobRoles || [],
          applicationStatus: data.applicationStatuses || [],
          profileSubmitted: ['true', 'false'],
        };
        setOptions(data);
      })
      .catch((e) => console.error('failed to load cohort options', e));
  }, []);

  const handleSave = () => {
    onSave && onSave(root);
    console.log('Cohort rule JSON:', JSON.stringify(root, null, 2));
  };

  const handleReset = () => {
    setRoot(newGroup());
    setExecResult(null);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setExecResult(null);
    try {
      const res = await fetch('/cohorts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(root),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      const data = await res.json();
      setExecResult({ ok: true, data });
    } catch (err) {
      setExecResult({ ok: false, error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div>
      <h3>Cohort Rule Builder</h3>
      <p>Create attribute, status, time, numeric and event-based rules. Use AND/OR and nested groups.</p>

      <div className="rule-builder">
        <RuleNode node={root} onChange={setRoot} onRemove={() => setRoot(newGroup())} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={handleSave}>Save Cohort</button>
        <button onClick={handleExecute} disabled={executing}>
          {executing ? 'Executing...' : 'Execute (Preview)'}
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Result:</strong>
        <div style={{ marginTop: 8 }}>
          {execResult ? (
            execResult.ok ? (
              <pre style={{ background: '#fafafa', padding: 12, borderRadius: 6 }}>{JSON.stringify(execResult.data, null, 2)}</pre>
            ) : (
              <pre style={{ background: '#ffecec', padding: 12, borderRadius: 6, color: '#900' }}>{execResult.error}</pre>
            )
          ) : (
            <em>No preview executed yet.</em>
          )}
        </div>
      </div>

      <pre style={{ marginTop: 12, background: '#fafafa', padding: 12, borderRadius: 6 }}>
        {JSON.stringify(root, null, 2)}
      </pre>
    </div>
  );
}
