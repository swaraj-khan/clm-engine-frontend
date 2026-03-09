import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { supabase } from '../supabaseClient';

// Node type definitions
const NODE_TYPES = {
  TRIGGER: 'trigger',
  DELAY: 'delay',
  CHANNEL: 'channel',
  CONDITION: 'condition',
  AB_SPLIT: 'ab_split',
  COHORT_MOVEMENT: 'cohort_movement',
  EXIT: 'exit',
};

// Node type labels and colors
const NODE_CONFIG = {
  [NODE_TYPES.TRIGGER]: { label: 'Trigger', color: '#10b981', icon: '⚡' },
  [NODE_TYPES.DELAY]: { label: 'Delay', color: '#f59e0b', icon: '⏱️' },
  [NODE_TYPES.CHANNEL]: { label: 'Channel', color: '#3b82f6', icon: '📱' },
  [NODE_TYPES.CONDITION]: { label: 'Condition', color: '#8b5cf6', icon: '🔀' },
  [NODE_TYPES.AB_SPLIT]: { label: 'A/B Split', color: '#ec4899', icon: '📊' },
  [NODE_TYPES.COHORT_MOVEMENT]: { label: 'Cohort Movement', color: '#14b8a6', icon: '👥' },
  [NODE_TYPES.EXIT]: { label: 'Exit', color: '#ef4444', icon: '🚪' },
};

// Available trigger events
const TRIGGER_EVENTS = [
  'USER_REGISTERED',
  'PROFILE_INCOMPLETE',
  'PROFILE_COMPLETE',
  'APPLICATION_SUBMITTED',
  'INTERVIEW_SCHEDULED',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'DEPLOYED',
  'DORMANT',
  'DROPPED_OFF',
];

// Available channels
const CHANNELS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'AI_VOICE_CALL', label: 'AI Voice Call' },
  { value: 'PUSH_NOTIFICATION', label: 'Push Notification' },
];

// Default stages
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
];

// Custom node component
function CustomNode({ data, type, selected }) {
  const config = NODE_CONFIG[type] || { label: type, color: '#666', icon: '●' };
  
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: `2px solid ${selected ? '#2563eb' : config.color}`,
        boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '160px',
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: config.color }} />
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{config.icon}</div>
      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '13px' }}>{config.label}</div>
      {data.label && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{data.label}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: config.color }} />
    </div>
  );
}

// Condition node with multiple outputs
function ConditionNode({ data, selected }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: `2px solid ${selected ? '#2563eb' : '#8b5cf6'}`,
        boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '160px',
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6' }} />
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔀</div>
      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '13px' }}>Condition</div>
      {data.label && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{data.label}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="true" style={{ background: '#10b981', left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ background: '#ef4444', left: '70%' }} />
    </div>
  );
}

// A/B Split node with multiple outputs
function ABSplitNode({ data, selected }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: `2px solid ${selected ? '#2563eb' : '#ec4899'}`,
        boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '160px',
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#ec4899' }} />
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>📊</div>
      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '13px' }}>A/B Split</div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>50% / 50%</div>
      <Handle type="source" position={Position.Bottom} id="a" style={{ background: '#3b82f6', left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#10b981', left: '70%' }} />
    </div>
  );
}

const nodeTypes = {
  [NODE_TYPES.TRIGGER]: CustomNode,
  [NODE_TYPES.DELAY]: CustomNode,
  [NODE_TYPES.CHANNEL]: CustomNode,
  [NODE_TYPES.CONDITION]: ConditionNode,
  [NODE_TYPES.AB_SPLIT]: ABSplitNode,
  [NODE_TYPES.COHORT_MOVEMENT]: CustomNode,
  [NODE_TYPES.EXIT]: CustomNode,
};

// Generate unique ID
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial node for new workflow
const createInitialNode = (type, position = { x: 250, y: 50 }) => {
  const config = NODE_CONFIG[type];
  return {
    id: generateId(),
    type,
    position,
    data: { label: config.label },
  };
};

// Sidebar component for dragging nodes
function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{
      width: '200px',
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      padding: '16px',
      height: 'calc(100vh - 140px)',
      overflowY: 'auto',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
        Node Types
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(NODE_CONFIG).map(([type, config]) => (
          <div
            key={type}
            onDragStart={(event) => onDragStart(event, type)}
            draggable
            style={{
              padding: '10px 12px',
              backgroundColor: 'white',
              border: `1px solid ${config.color}`,
              borderRadius: '6px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#374151',
              transition: 'all 0.2s',
            }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

// Node configuration panel
function NodeConfigPanel({ selectedNode, updateNodeData, onClose, cohorts }) {
  if (!selectedNode) return null;

  const nodeConfig = NODE_CONFIG[selectedNode.type] || { label: selectedNode.type };

  const handleChange = (field, value) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  return (
    <div style={{
      width: '300px',
      backgroundColor: 'white',
      borderLeft: '1px solid #e5e7eb',
      padding: '16px',
      height: 'calc(100vh - 140px)',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
          Configure {nodeConfig.label}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0',
          }}
        >
          ×
        </button>
      </div>

      {/* Trigger Node Config */}
      {selectedNode.type === NODE_TYPES.TRIGGER && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Trigger Event
            </label>
            <select
              value={selectedNode.data.event || ''}
              onChange={(e) => handleChange('event', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option value="">Select event...</option>
              {TRIGGER_EVENTS.map((event) => (
                <option key={event} value={event}>{event.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Label
            </label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., User enters profile incomplete"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}

      {/* Delay Node Config */}
      {selectedNode.type === NODE_TYPES.DELAY && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Duration
            </label>
            <input
              type="number"
              value={selectedNode.data.duration || 24}
              onChange={(e) => handleChange('duration', parseInt(e.target.value))}
              min="1"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Unit
            </label>
            <select
              value={selectedNode.data.unit || 'hours'}
              onChange={(e) => handleChange('unit', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Label
            </label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., Wait 24 hours"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}

      {/* Channel Node Config */}
      {selectedNode.type === NODE_TYPES.CHANNEL && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Channel
            </label>
            <select
              value={selectedNode.data.channel || ''}
              onChange={(e) => handleChange('channel', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option value="">Select channel...</option>
              {CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value}>{ch.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Message Template (optional)
            </label>
            <textarea
              value={selectedNode.data.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Enter message or leave empty for default template"
              rows={4}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Label
            </label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., Send welcome email"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}

      {/* Condition Node Config */}
      {selectedNode.type === NODE_TYPES.CONDITION && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Field to Check
            </label>
            <select
              value={selectedNode.data.field || ''}
              onChange={(e) => handleChange('field', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option value="">Select field...</option>
              <option value="status">Status</option>
              <option value="stage">Stage</option>
              <option value="profileComplete">Profile Complete</option>
              <option value="hasApplied">Has Applied</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Operator
            </label>
            <select
              value={selectedNode.data.operator || 'eq'}
              onChange={(e) => handleChange('operator', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option value="eq">Equals</option>
              <option value="neq">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="gt">Greater Than</option>
              <option value="lt">Less Than</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Value
            </label>
            <input
              type="text"
              value={selectedNode.data.value || ''}
              onChange={(e) => handleChange('value', e.target.value)}
              placeholder="Value to compare"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Label
            </label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., If profile complete"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}

      {/* A/B Split Node Config */}
      {selectedNode.type === NODE_TYPES.AB_SPLIT && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Split Percentage (A)
            </label>
            <input
              type="number"
              value={selectedNode.data.percentageA || 50}
              onChange={(e) => handleChange('percentageA', parseInt(e.target.value))}
              min="1"
              max="99"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            B will receive: {100 - (selectedNode.data.percentageA || 50)}%
          </div>
        </div>
      )}

      {/* Cohort Movement Node Config - Now fetches from Supabase */}
      {selectedNode.type === NODE_TYPES.COHORT_MOVEMENT && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Target Cohort / Stage
            </label>
            {cohorts && cohorts.length > 0 ? (
              <select
                value={selectedNode.data.targetCohort || ''}
                onChange={(e) => handleChange('targetCohort', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="">Select cohort...</option>
                <optgroup label="Custom Cohorts">
                  {cohorts.filter(c => c.name).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Stages">
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>
                  ))}
                </optgroup>
              </select>
            ) : (
              <select
                value={selectedNode.data.targetCohort || ''}
                onChange={(e) => handleChange('targetCohort', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="">Select stage...</option>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Label
            </label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., Move to Interview Scheduled"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}

      {/* Exit Node Config */}
      {selectedNode.type === NODE_TYPES.EXIT && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Exit Reason (optional)
            </label>
            <input
              type="text"
              value={selectedNode.data.reason || ''}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="e.g., User dropped off"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Workflow list item component
function WorkflowListItem({ workflow, onEdit, onDelete, onActivate, onDeactivate }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: 'white',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{workflow.name}</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>
            {workflow.description || 'No description'}
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: getStatusColor(workflow.status) + '20',
              color: getStatusColor(workflow.status),
            }}>
              {workflow.status?.toUpperCase() || 'DRAFT'}
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              v{workflow.version || 1}
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {workflow.nodes?.length || 0} nodes
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(workflow)}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#333',
            }}
          >
            Edit
          </button>
          {workflow.status === 'active' ? (
            <button
              onClick={() => onDeactivate(workflow._id)}
              style={{
                padding: '6px 12px',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => onActivate(workflow._id)}
              disabled={workflow.status === 'paused'}
              style={{
                padding: '6px 12px',
                border: '1px solid #10b981',
                borderRadius: '4px',
                backgroundColor: '#d1fae5',
                color: '#047857',
                cursor: workflow.status === 'paused' ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: workflow.status === 'paused' ? 0.5 : 1,
              }}
            >
              Activate
            </button>
          )}
          <button
            onClick={() => onDelete(workflow._id)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Main WorkflowOrchestrationEngine component
function WorkflowOrchestrationEngine() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'build'
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [cohorts, setCohorts] = useState([]);
  
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Fetch workflows from backend
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/workflows');
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cohorts from Supabase
  const fetchCohorts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cohort_rules')
        .select('id, name, rule_definition')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setCohorts(data || []);
    } catch (err) {
      console.error('Error fetching cohorts from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    fetchCohorts();
  }, [fetchWorkflows, fetchCohorts]);

  // Handle new workflow creation
  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setWorkflowName('');
    setWorkflowDescription('');
    setNodes([createInitialNode(NODE_TYPES.TRIGGER)]);
    setEdges([]);
    setViewMode('build');
  };

  // Handle workflow selection for editing
  const handleEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    
    // Convert stored nodes/edges to ReactFlow format
    const flowNodes = (workflow.nodes || []).map(node => ({
      id: node.id,
      type: node.type,
      position: node.position || { x: 250, y: 100 },
      data: node.data || { label: node.label },
    }));
    
    const flowEdges = (workflow.edges || []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.source_handle,
      targetHandle: edge.target_handle,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
    
    setNodes(flowNodes.length > 0 ? flowNodes : [createInitialNode(NODE_TYPES.TRIGGER)]);
    setEdges(flowEdges);
    setViewMode('build');
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = async (workflowId) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete workflow');
      }
      
      // Refresh list
      await fetchWorkflows();
      alert('Workflow deleted successfully');
    } catch (err) {
      console.error('Error deleting workflow:', err);
      alert('Error deleting workflow: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle workflow activation
  const handleActivateWorkflow = async (workflowId) => {
    setLoading(true);
    try {
      const res = await fetch(`/workflows/${workflowId}/activate`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to activate workflow');
      }
      
      // Refresh list
      await fetchWorkflows();
      alert('Workflow activated successfully');
    } catch (err) {
      console.error('Error activating workflow:', err);
      alert('Error activating workflow: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle workflow deactivation
  const handleDeactivateWorkflow = async (workflowId) => {
    setLoading(true);
    try {
      const res = await fetch(`/workflows/${workflowId}/deactivate`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to deactivate workflow');
      }
      
      // Refresh list
      await fetchWorkflows();
      alert('Workflow deactivated successfully');
    } catch (err) {
      console.error('Error deactivating workflow:', err);
      alert('Error deactivating workflow: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle workflow save
  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    setLoading(true);
    try {
      // Convert ReactFlow nodes/edges to stored format
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          source_handle: edge.sourceHandle,
          target_handle: edge.targetHandle,
        })),
      };

      let res;
      if (selectedWorkflow && selectedWorkflow._id) {
        // Update existing workflow
        res = await fetch(`/workflows/${selectedWorkflow._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowData),
        });
      } else {
        // Create new workflow
        res = await fetch('/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowData),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save workflow');
      }

      const data = await res.json();
      alert('Workflow saved successfully');
      
      // Go back to list view and refresh
      await fetchWorkflows();
      setViewMode('list');
    } catch (err) {
      console.error('Error saving workflow:', err);
      alert('Error saving workflow: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ReactFlow event handlers
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 30,
      };

      const newNode = createInitialNode(type, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Render list view
  if (viewMode === 'list') {
    return (
      <div className="engine-container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Workflow Orchestration Engine</h2>
          <button
            onClick={handleCreateNew}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            + Create New Workflow
          </button>
        </div>

        {loading ? (
          <p>Loading workflows...</p>
        ) : workflows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No workflows yet. Create your first workflow to get started!</p>
          </div>
        ) : (
          <div>
            {workflows.map((workflow) => (
              <WorkflowListItem
                key={workflow._id}
                workflow={workflow}
                onEdit={handleEditWorkflow}
                onDelete={handleDeleteWorkflow}
                onActivate={handleActivateWorkflow}
                onDeactivate={handleDeactivateWorkflow}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render build view
  return (
    <div className="engine-container" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#333',
            }}
          >
            ← Back
          </button>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name"
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '250px',
            }}
          />
          <input
            type="text"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Description (optional)"
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '300px',
            }}
          />
        </div>
        <button
          onClick={handleSaveWorkflow}
          disabled={loading}
          style={{
            padding: '8px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Saving...' : 'Save Workflow'}
        </button>
      </div>

      {/* Workflow Builder */}
      <div style={{ flex: 1, display: 'flex' }}>
        <Sidebar />
        
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            style={{ backgroundColor: '#f9fafb' }}
          >
            <Controls />
            <MiniMap />
            <Background />
          </ReactFlow>

          {selectedNode && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '100%',
              zIndex: 10,
            }}>
              <NodeConfigPanel
                selectedNode={selectedNode}
                updateNodeData={updateNodeData}
                onClose={() => setSelectedNode(null)}
                cohorts={cohorts}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowOrchestrationEngine;

