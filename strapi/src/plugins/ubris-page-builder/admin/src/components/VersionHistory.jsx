import React, { useState, useEffect } from 'react';

export default function VersionHistory({ pageId, fetchClient, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) return;
    setLoading(true);
    fetchClient
      .get(`/content-manager/collection-types/api::layout-version.layout-version?filters[pageId][$eq]=${pageId}&sort=version:desc&pageSize=50`)
      .then(({ data }) => {
        setVersions(data?.results || []);
      })
      .catch((err) => {
        console.error('Failed to load versions', err);
        setVersions([]);
      })
      .finally(() => setLoading(false));
  }, [pageId, fetchClient]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 380,
      background: '#fff',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #eee',
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
          Historico de Versoes
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '4px 8px' }}
        >
          ✕
        </button>
      </div>

      {/* Version list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13 }}>
            Carregando versoes...
          </div>
        )}
        {!loading && versions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13 }}>
            Nenhuma versao encontrada para esta pagina.
          </div>
        )}
        {versions.map((version) => (
          <div key={version.id} style={{
            padding: '14px 16px',
            marginBottom: 10,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: '#fafafa',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>
                  v{version.version}
                </span>
                {version.createdByName && (
                  <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                    por {version.createdByName}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#999' }}>
                {formatDate(version.createdAt)}
              </span>
            </div>
            {version.description && (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#555', lineHeight: 1.4 }}>
                {version.description}
              </p>
            )}
            <button
              onClick={() => onRestore(version.layout)}
              style={{
                padding: '6px 14px',
                background: '#fff',
                color: '#4f46e5',
                border: '1px solid #4f46e5',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Restaurar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
