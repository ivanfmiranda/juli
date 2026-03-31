import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useFetchClient, useNotification } from '@strapi/helper-plugin';
import BlockLibrary from '../components/BlockLibrary';
import Canvas from '../components/Canvas';
import PropertyEditor from '../components/PropertyEditor';
import PreviewRenderer from '../components/PreviewRenderer';
import VersionHistory from '../components/VersionHistory';
import { BLOCK_SCHEMAS } from '../components/blockSchemas';

let blockCounter = 0;
function newBlockId() {
  return `block-${Date.now()}-${++blockCounter}`;
}

export default function PageBuilderPage() {
  const fetchClient = useFetchClient();
  const { get, put, post } = fetchClient;
  const toggleNotification = useNotification();

  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tenantId, setTenantId] = useState('');

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewViewport, setPreviewViewport] = useState('desktop');

  // Versioning state
  const [showHistory, setShowHistory] = useState(false);
  const [saveDescription, setSaveDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Load pages
  useEffect(() => {
    async function loadPages() {
      try {
        const params = tenantId
          ? `?filters[tenantKey][$eq]=${encodeURIComponent(tenantId)}&publicationState=preview`
          : '?publicationState=preview';
        const { data } = await get(`/content-manager/collection-types/api::page.page${params}`);
        setPages(data?.results || []);
      } catch (err) {
        console.error('Failed to load pages', err);
      }
    }
    loadPages();
  }, [get, tenantId]);

  // Load selected page layout
  useEffect(() => {
    if (!selectedPageId) {
      setBlocks([]);
      return;
    }
    async function loadLayout() {
      try {
        const { data } = await get(`/content-manager/collection-types/api::page.page/${selectedPageId}`);
        const layout = data?.layout;
        if (Array.isArray(layout)) {
          setBlocks(layout);
        } else {
          setBlocks([]);
        }
      } catch (err) {
        console.error('Failed to load page layout', err);
        setBlocks([]);
      }
    }
    loadLayout();
    setSelectedBlockId(null);
  }, [selectedPageId, get]);

  const handleDragStart = useCallback((event) => {
    setActiveDrag(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    // Dragging from library → add new block
    if (activeData?.fromLibrary) {
      const newBlock = {
        id: newBlockId(),
        type: activeData.type,
        props: {},
      };
      setBlocks(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Reordering within canvas
    if (active.id !== over.id) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id);
        const newIndex = prev.findIndex(b => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleRemoveBlock = useCallback((blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }, [selectedBlockId]);

  const handleUpdateBlockProps = useCallback((blockId, newProps) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: newProps } : b));
  }, []);

  const createVersion = async () => {
    try {
      // Get current max version for this page
      const { data: versionsData } = await get(
        `/content-manager/collection-types/api::layout-version.layout-version?filters[pageId][$eq]=${selectedPageId}&sort=version:desc&pageSize=1`
      );
      const existingVersions = versionsData?.results || [];
      const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

      await post('/content-manager/collection-types/api::layout-version.layout-version', {
        pageId: selectedPageId,
        version: nextVersion,
        layout: blocks,
        description: saveDescription || '',
        createdByName: '',
      });
    } catch (err) {
      console.error('Failed to create version', err);
    }
  };

  const handleSave = async () => {
    if (!selectedPageId) return;
    setSaving(true);
    try {
      await put(`/content-manager/collection-types/api::page.page/${selectedPageId}`, { layout: blocks });
      await createVersion();
      toggleNotification({ type: 'success', message: 'Layout salvo com sucesso!' });
      setSaveDescription('');
      setShowDescriptionInput(false);
    } catch (err) {
      console.error('Failed to save', err);
      toggleNotification({ type: 'warning', message: 'Erro ao salvar layout.' });
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!selectedPageId) return;
    setPublishing(true);
    try {
      await put(`/content-manager/collection-types/api::page.page/${selectedPageId}`, { layout: blocks });
      // Strapi v4 publish action
      await fetch(`/content-manager/collection-types/api::page.page/${selectedPageId}/actions/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      toggleNotification({ type: 'success', message: 'Página publicada com sucesso!' });
    } catch (err) {
      console.error('Failed to publish', err);
      toggleNotification({ type: 'warning', message: 'Erro ao publicar página.' });
    }
    setPublishing(false);
  };

  const handleRestoreVersion = (layout) => {
    if (Array.isArray(layout)) {
      setBlocks(layout);
      setSelectedBlockId(null);
      setShowHistory(false);
      toggleNotification({ type: 'success', message: 'Versao restaurada. Salve para confirmar.' });
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;
  const previewWidth = previewViewport === 'mobile' ? 375 : 1200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderBottom: '1px solid #eee',
        background: '#fff',
        flexWrap: 'wrap',
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Page Builder</h2>
        <input
          type="text"
          placeholder="Filtrar por Tenant ID..."
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, width: 180 }}
        />
        <select
          value={selectedPageId || ''}
          onChange={(e) => setSelectedPageId(e.target.value ? Number(e.target.value) : null)}
          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, minWidth: 200 }}
        >
          <option value="">Selecione uma pagina...</option>
          {pages.map(page => (
            <option key={page.id} value={page.id}>
              {page.title} ({page.slug}) -- {page.tenantKey || 'sem tenant'}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />

        {/* Description toggle */}
        {selectedPageId && (
          <button
            onClick={() => setShowDescriptionInput(!showDescriptionInput)}
            style={{
              padding: '8px 14px',
              background: showDescriptionInput ? '#e0e7ff' : '#f3f4f6',
              color: '#4f46e5',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
            title="Adicionar descricao da alteracao"
          >
            Nota
          </button>
        )}

        {/* History button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          disabled={!selectedPageId}
          style={{
            padding: '8px 14px',
            background: selectedPageId ? (showHistory ? '#fef3c7' : '#f3f4f6') : '#f3f4f6',
            color: selectedPageId ? '#92400e' : '#ccc',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            cursor: selectedPageId ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Historico
        </button>

        {/* Preview button */}
        <button
          onClick={() => setShowPreview(true)}
          disabled={!selectedPageId}
          style={{
            padding: '8px 14px',
            background: selectedPageId ? '#f3f4f6' : '#f3f4f6',
            color: selectedPageId ? '#7c3aed' : '#ccc',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            cursor: selectedPageId ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Preview
        </button>

        <button
          onClick={handleSave}
          disabled={!selectedPageId || saving}
          style={{
            padding: '8px 20px',
            background: selectedPageId ? '#4f46e5' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: selectedPageId ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </button>
        <button
          onClick={handlePublish}
          disabled={!selectedPageId || publishing}
          style={{
            padding: '8px 20px',
            background: selectedPageId ? '#059669' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: selectedPageId ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {publishing ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      {/* Save description input (collapsible) */}
      {showDescriptionInput && selectedPageId && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 20px',
          borderBottom: '1px solid #eee',
          background: '#f9fafb',
        }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#555', whiteSpace: 'nowrap' }}>
            Descricao da alteracao:
          </label>
          <input
            type="text"
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            placeholder="Ex: Adicionado banner promocional..."
            style={{ flex: 1, padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
          />
        </div>
      )}

      {/* Three-panel layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <BlockLibrary />
          <Canvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onRemove={handleRemoveBlock}
          />
          <DragOverlay>
            {activeDrag?.fromLibrary ? (
              <div style={{
                padding: '10px 14px',
                background: '#e0e7ff',
                border: '2px solid #4f46e5',
                borderRadius: 6,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                <span style={{ fontSize: 20 }}>{BLOCK_SCHEMAS[activeDrag.type]?.icon}</span>
                <span>{BLOCK_SCHEMAS[activeDrag.type]?.label}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <PropertyEditor block={selectedBlock} onUpdate={handleUpdateBlockProps} />
      </div>

      {/* Preview modal overlay */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Preview toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            background: '#1a1a2e',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Preview</h3>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setPreviewViewport('desktop')}
              style={{
                padding: '6px 14px',
                background: previewViewport === 'desktop' ? '#4f46e5' : 'transparent',
                color: '#fff',
                border: '1px solid #4f46e5',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Desktop (1200px)
            </button>
            <button
              onClick={() => setPreviewViewport('mobile')}
              style={{
                padding: '6px 14px',
                background: previewViewport === 'mobile' ? '#4f46e5' : 'transparent',
                color: '#fff',
                border: '1px solid #4f46e5',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Mobile (375px)
            </button>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                padding: '6px 14px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Fechar
            </button>
          </div>
          {/* Preview content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 32,
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <PreviewRenderer blocks={blocks} viewportWidth={previewWidth} />
          </div>
        </div>
      )}

      {/* Version history drawer */}
      {showHistory && selectedPageId && (
        <VersionHistory
          pageId={selectedPageId}
          fetchClient={fetchClient}
          onRestore={handleRestoreVersion}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
