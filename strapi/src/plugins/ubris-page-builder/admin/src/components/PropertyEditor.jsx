import React from 'react';
import { BLOCK_SCHEMAS as DEFAULT_SCHEMAS } from './blockSchemas';

const FORM_FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'select'];

function FormFieldsEditor({ items = [], onChange }) {
  const addItem = () => onChange([...items, { label: '', type: 'text', required: false, placeholder: '' }]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index, key, value) => {
    const updated = items.map((item, i) => i === index ? { ...item, [key]: value } : item);
    onChange(updated);
  };

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: 10, padding: 10, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Label do campo"
              value={item.label || ''}
              onChange={(e) => updateItem(index, 'label', e.target.value)}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            />
            <select
              value={item.type || 'text'}
              onChange={(e) => updateItem(index, 'type', e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            >
              {FORM_FIELD_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Placeholder"
              value={item.placeholder || ''}
              onChange={(e) => updateItem(index, 'placeholder', e.target.value)}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={!!item.required}
                onChange={(e) => updateItem(index, 'required', e.target.checked)}
              />
              Obrigatório
            </label>
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        style={{ padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
      >
        + Adicionar campo
      </button>
    </div>
  );
}

function CarouselItemsEditor({ items = [], onChange }) {
  const addItem = () => onChange([...items, { imageUrl: '', link: '' }]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index, key, value) => {
    const updated = items.map((item, i) => i === index ? { ...item, [key]: value } : item);
    onChange(updated);
  };

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="URL da imagem"
            value={item.imageUrl || ''}
            onChange={(e) => updateItem(index, 'imageUrl', e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
          />
          <input
            type="text"
            placeholder="Link"
            value={item.link || ''}
            onChange={(e) => updateItem(index, 'link', e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
          />
          <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}>✕</button>
        </div>
      ))}
      <button
        onClick={addItem}
        style={{ padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
      >
        + Adicionar slide
      </button>
    </div>
  );
}

export default function PropertyEditor({ block, onUpdate, schemas = DEFAULT_SCHEMAS }) {
  if (!block) {
    return (
      <div style={{
        width: 280,
        minWidth: 280,
        borderLeft: '1px solid #eee',
        padding: 16,
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: 13,
      }}>
        Selecione um bloco para editar suas propriedades
      </div>
    );
  }

  const schema = schemas[block.type];
  if (!schema) return null;

  const updateProp = (key, value) => {
    onUpdate(block.id, { ...block.props, [key]: value });
  };

  return (
    <div style={{
      width: 280,
      minWidth: 280,
      borderLeft: '1px solid #eee',
      padding: 16,
      overflowY: 'auto',
      background: '#fafafa',
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {schema.icon} {schema.label}
      </h3>
      {schema.fields.map((field) => (
        <div key={field.key} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4 }}>
            {field.label}
          </label>
          {field.type === 'text' && (
            <input
              type="text"
              value={block.props[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(e) => updateProp(field.key, e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
            />
          )}
          {field.type === 'textarea' && (
            <textarea
              value={block.props[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(e) => updateProp(field.key, e.target.value)}
              rows={5}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
          )}
          {field.type === 'number' && (
            <input
              type="number"
              value={block.props[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(e) => updateProp(field.key, e.target.value ? Number(e.target.value) : '')}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
            />
          )}
          {field.type === 'color' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={block.props[field.key] || '#ffffff'}
                onChange={(e) => updateProp(field.key, e.target.value)}
                style={{ width: 36, height: 36, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: 0 }}
              />
              <input
                type="text"
                value={block.props[field.key] || ''}
                placeholder={field.placeholder}
                onChange={(e) => updateProp(field.key, e.target.value)}
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
              />
            </div>
          )}
          {field.type === 'select' && (
            <select
              value={block.props[field.key] || field.options?.[0] || ''}
              onChange={(e) => updateProp(field.key, e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
            >
              {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {field.type === 'boolean' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={!!block.props[field.key]}
                onChange={(e) => updateProp(field.key, e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              {block.props[field.key] ? 'Sim' : 'Não'}
            </label>
          )}
          {field.type === 'carousel-items' && (
            <CarouselItemsEditor
              items={block.props[field.key] || []}
              onChange={(items) => updateProp(field.key, items)}
            />
          )}
          {field.type === 'form-fields' && (
            <FormFieldsEditor
              items={block.props[field.key] || []}
              onChange={(items) => updateProp(field.key, items)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
