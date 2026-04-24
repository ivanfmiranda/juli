import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BLOCK_SCHEMAS as DEFAULT_SCHEMAS, BLOCK_TYPES as DEFAULT_TYPES } from './blockSchemas';

function DraggableBlock({ type, schemas }) {
  const schema = schemas[type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${type}`,
    data: { type, fromLibrary: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 14px',
        marginBottom: 8,
        background: isDragging ? '#e0e7ff' : '#fff',
        border: '1px solid #ddd',
        borderRadius: 6,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 20 }}>{schema.icon}</span>
      <span>{schema.label}</span>
    </div>
  );
}

export default function BlockLibrary({ schemas = DEFAULT_SCHEMAS, blockTypes = DEFAULT_TYPES, title = 'Blocos' }) {
  return (
    <div style={{
      width: 220,
      minWidth: 220,
      borderRight: '1px solid #eee',
      padding: 16,
      overflowY: 'auto',
      background: '#fafafa',
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </h3>
      {blockTypes.map(type => (
        <DraggableBlock key={type} type={type} schemas={schemas} />
      ))}
    </div>
  );
}
