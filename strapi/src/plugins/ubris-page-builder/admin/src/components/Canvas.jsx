import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BLOCK_SCHEMAS } from './blockSchemas';

function SortableBlock({ block, isSelected, onSelect, onRemove }) {
  const schema = BLOCK_SCHEMAS[block.type] || { label: block.type, icon: '❓' };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    padding: '12px 16px',
    marginBottom: 8,
    background: isSelected ? '#eef2ff' : '#fff',
    border: isSelected ? '2px solid #4f46e5' : '1px solid #ddd',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    minHeight: 48,
  };

  const title = block.props?.title || block.props?.content?.substring(0, 40) || schema.label;

  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelect(block.id)}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', fontSize: 16, color: '#999', padding: '0 4px' }} title="Arrastar">
        ⠿
      </div>
      <span style={{ fontSize: 18 }}>{schema.icon}</span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{schema.label}</div>
        {title !== schema.label && (
          <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, padding: '4px 8px' }}
        title="Remover bloco"
      >
        ✕
      </button>
    </div>
  );
}

export default function Canvas({ blocks, selectedBlockId, onSelect, onRemove }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-droppable' });

  return (
    <div style={{
      flex: 1,
      padding: 24,
      overflowY: 'auto',
      background: isOver ? '#f0f4ff' : '#f5f5f5',
      transition: 'background 200ms',
      minHeight: 400,
    }}>
      <div ref={setNodeRef} style={{ maxWidth: 700, margin: '0 auto', minHeight: 200 }}>
        {blocks.length === 0 && (
          <div style={{
            border: '2px dashed #ccc',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            color: '#999',
            fontSize: 14,
          }}>
            Arraste blocos do painel esquerdo para começar a montar sua página
          </div>
        )}
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map(block => (
            <SortableBlock
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
