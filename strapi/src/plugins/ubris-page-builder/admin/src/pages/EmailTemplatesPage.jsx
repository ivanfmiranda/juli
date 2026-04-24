import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useFetchClient, useNotification } from '@strapi/helper-plugin';
import BlockLibrary from '../components/BlockLibrary';
import Canvas from '../components/Canvas';
import PropertyEditor from '../components/PropertyEditor';
import {
  EMAIL_BLOCK_SCHEMAS, EMAIL_BLOCK_TYPES, KNOWN_EMAIL_CODES, SAMPLE_VARIABLES,
} from '../components/emailBlockSchemas';

let blockCounter = 0;
function newBlockId() {
  return `eblock-${Date.now()}-${++blockCounter}`;
}

// Our Canvas stores blocks as { id, type: 'Heading', props: {...} }.
// The backend expects flat objects { type: 'heading', ...fields }.
function blocksToApi(uiBlocks) {
  return uiBlocks.map((b) => {
    const flat = { type: b.type.toLowerCase(), ...(b.props || {}) };
    if (flat.level !== undefined && flat.level !== '' && flat.level !== null) {
      flat.level = Number(flat.level);
    }
    if (flat.width !== undefined && flat.width !== '' && flat.width !== null) {
      flat.width = Number(flat.width);
    }
    return flat;
  });
}

function blocksFromApi(apiBlocks) {
  if (!Array.isArray(apiBlocks)) return [];
  return apiBlocks.map((b) => {
    const type = (b.type || '').charAt(0).toUpperCase() + (b.type || '').slice(1);
    const { type: _drop, ...rest } = b;
    return { id: newBlockId(), type, props: rest };
  });
}

function emptyDraft() {
  return {
    subject: '',
    header: { background: '#274060', title: '' },
    footer: { text: '' },
    blocks: [],
  };
}

export default function EmailTemplatesPage() {
  const { get, put, post, del } = useFetchClient();
  const toggleNotification = useNotification();

  const [tenantId, setTenantId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [draft, setDraft] = useState(emptyDraft());
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const apiPrefix = '/ubris-page-builder/email-templates';

  // Load list of templates for the current tenant
  useEffect(() => {
    if (!tenantId) {
      setTemplates([]);
      return;
    }
    (async () => {
      try {
        const { data } = await get(`${apiPrefix}?tenantId=${encodeURIComponent(tenantId)}`);
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load templates', err);
        setTemplates([]);
      }
    })();
  }, [tenantId, get]);

  // Load the selected template
  useEffect(() => {
    if (!tenantId || !selectedCode) {
      setDraft(emptyDraft());
      setSelectedBlockId(null);
      return;
    }
    (async () => {
      try {
        const { data } = await get(
          `${apiPrefix}/${encodeURIComponent(selectedCode)}?tenantId=${encodeURIComponent(tenantId)}`
        );
        if (data) {
          setDraft({
            subject: data.subject || '',
            header: data.header || { background: '#274060', title: '' },
            footer: data.footer || { text: '' },
            blocks: blocksFromApi(data.blocks),
          });
          setSelectedBlockId(null);
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          // No override yet — start from empty draft for that code
          setDraft(emptyDraft());
          return;
        }
        console.error('Failed to load template', err);
      }
    })();
  }, [tenantId, selectedCode, get]);

  const effectiveCode = useMemo(
    () => (customCode.trim() || selectedCode),
    [customCode, selectedCode]
  );

  const canEdit = tenantId && effectiveCode;

  const handleDragStart = useCallback((event) => {
    setActiveDrag(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;

    if (activeData?.fromLibrary) {
      const newBlock = { id: newBlockId(), type: activeData.type, props: {} };
      setDraft((d) => ({ ...d, blocks: [...d.blocks, newBlock] }));
      setSelectedBlockId(newBlock.id);
      return;
    }

    if (active.id !== over.id) {
      setDraft((d) => {
        const oldIndex = d.blocks.findIndex((b) => b.id === active.id);
        const newIndex = d.blocks.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return d;
        return { ...d, blocks: arrayMove(d.blocks, oldIndex, newIndex) };
      });
    }
  }, []);

  const handleRemoveBlock = useCallback((blockId) => {
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== blockId) }));
    setSelectedBlockId((current) => (current === blockId ? null : current));
  }, []);

  const handleUpdateBlockProps = useCallback((blockId, newProps) => {
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, props: newProps } : b)),
    }));
  }, []);

  const selectedBlock = draft.blocks.find((b) => b.id === selectedBlockId) || null;

  const buildApiPayload = () => ({
    subject: draft.subject || null,
    header: draft.header && (draft.header.background || draft.header.title)
      ? {
          background: draft.header.background || '#274060',
          title: draft.header.title || '',
        }
      : null,
    footer: draft.footer && draft.footer.text ? { text: draft.footer.text } : null,
    blocks: blocksToApi(draft.blocks),
  });

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = buildApiPayload();
      await put(
        `${apiPrefix}/${encodeURIComponent(effectiveCode)}?tenantId=${encodeURIComponent(tenantId)}`,
        payload
      );
      toggleNotification({ type: 'success', message: `Template "${effectiveCode}" salvo!` });
      setCustomCode('');
      setSelectedCode(effectiveCode);
      // Refresh list
      const { data } = await get(`${apiPrefix}?tenantId=${encodeURIComponent(tenantId)}`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Save failed', err);
      toggleNotification({ type: 'warning', message: `Erro ao salvar: ${err.message || err}` });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!canEdit || !selectedCode) return;
    if (!window.confirm(`Remover override para "${selectedCode}"? O tenant volta ao template padrão.`)) return;
    try {
      await del(`${apiPrefix}/${encodeURIComponent(selectedCode)}?tenantId=${encodeURIComponent(tenantId)}`);
      toggleNotification({ type: 'success', message: 'Override removido!' });
      setSelectedCode('');
      setDraft(emptyDraft());
      const { data } = await get(`${apiPrefix}?tenantId=${encodeURIComponent(tenantId)}`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Delete failed', err);
      toggleNotification({ type: 'warning', message: `Erro ao remover: ${err.message || err}` });
    }
  };

  const handlePreview = async () => {
    if (!canEdit) return;
    try {
      const payload = buildApiPayload();
      const { data } = await post(
        `${apiPrefix}/preview-inline?tenantId=${encodeURIComponent(tenantId)}`,
        { content: payload, variables: SAMPLE_VARIABLES }
      );
      setPreviewHtml(typeof data === 'string' ? data : String(data));
      setShowPreview(true);
    } catch (err) {
      console.error('Preview failed', err);
      toggleNotification({ type: 'warning', message: `Erro no preview: ${err.message || err}` });
    }
  };

  const btn = (bg, active = true) => ({
    padding: '8px 16px',
    background: active ? bg : '#ccc',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: active ? 'pointer' : 'not-allowed',
    fontSize: 13,
    fontWeight: 600,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #eee', background: '#fff', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Email Templates</h2>
        <input
          type="text"
          placeholder="Tenant ID..."
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value.trim())}
          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, width: 180 }}
        />
        <select
          value={selectedCode}
          onChange={(e) => { setSelectedCode(e.target.value); setCustomCode(''); }}
          disabled={!tenantId}
          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, minWidth: 240 }}
        >
          <option value="">Selecione um template…</option>
          {KNOWN_EMAIL_CODES.map((code) => {
            const exists = templates.some((t) => t.code === code);
            return (
              <option key={code} value={code}>
                {code}{exists ? ' ✓' : ''}
              </option>
            );
          })}
        </select>
        <span style={{ color: '#999', fontSize: 12 }}>ou novo:</span>
        <input
          type="text"
          placeholder="código customizado"
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          disabled={!tenantId}
          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, width: 180 }}
        />
        <div style={{ flex: 1 }} />
        <button onClick={handlePreview} disabled={!canEdit} style={btn('#7c3aed', canEdit)}>Preview</button>
        <button onClick={handleSave} disabled={!canEdit || saving} style={btn('#4f46e5', canEdit && !saving)}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
        {selectedCode && templates.some((t) => t.code === selectedCode) && (
          <button onClick={handleDelete} style={btn('#ef4444', true)}>Remover override</button>
        )}
      </div>

      {/* Subject / header / footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, padding: '10px 20px', borderBottom: '1px solid #eee', background: '#f9fafb' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Assunto</label>
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            placeholder="Ex.: Bem-vindo(a), {{customerName}}!"
            disabled={!canEdit}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Header — título</label>
          <input
            type="text"
            value={draft.header?.title || ''}
            onChange={(e) => setDraft((d) => ({ ...d, header: { ...d.header, title: e.target.value } }))}
            disabled={!canEdit}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Header — cor</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="color"
              value={draft.header?.background || '#274060'}
              onChange={(e) => setDraft((d) => ({ ...d, header: { ...d.header, background: e.target.value } }))}
              disabled={!canEdit}
              style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 4, padding: 0 }}
            />
            <input
              type="text"
              value={draft.header?.background || ''}
              onChange={(e) => setDraft((d) => ({ ...d, header: { ...d.header, background: e.target.value } }))}
              disabled={!canEdit}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Footer — texto</label>
          <input
            type="text"
            value={draft.footer?.text || ''}
            onChange={(e) => setDraft((d) => ({ ...d, footer: { text: e.target.value } }))}
            disabled={!canEdit}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <BlockLibrary schemas={EMAIL_BLOCK_SCHEMAS} blockTypes={EMAIL_BLOCK_TYPES} title="Blocos de Email" />
          <Canvas
            blocks={draft.blocks}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onRemove={handleRemoveBlock}
            schemas={EMAIL_BLOCK_SCHEMAS}
            emptyLabel={canEdit ? 'Arraste blocos do painel esquerdo para montar o email' : 'Informe Tenant ID e selecione um template para começar'}
          />
          <DragOverlay>
            {activeDrag?.fromLibrary ? (
              <div style={{ padding: '10px 14px', background: '#e0e7ff', border: '2px solid #4f46e5', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <span style={{ fontSize: 20 }}>{EMAIL_BLOCK_SCHEMAS[activeDrag.type]?.icon}</span>
                <span>{EMAIL_BLOCK_SCHEMAS[activeDrag.type]?.label}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <PropertyEditor block={selectedBlock} onUpdate={handleUpdateBlockProps} schemas={EMAIL_BLOCK_SCHEMAS} />
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', background: '#1a1a2e', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Preview — {effectiveCode}</h3>
            <span style={{ color: '#aaa', fontSize: 12 }}>(valores de exemplo aplicados)</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowPreview(false)} style={{ padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Fechar</button>
          </div>
          <iframe
            title="email-preview"
            srcDoc={previewHtml}
            style={{ flex: 1, width: '100%', maxWidth: 780, border: 'none', background: '#fff' }}
          />
        </div>
      )}
    </div>
  );
}
