import React from 'react';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function getAspectPadding(ratio) {
  switch (ratio) {
    case '4:3': return '75%';
    case '1:1': return '100%';
    default: return '56.25%'; // 16:9
  }
}

function BannerPreview({ props }) {
  return (
    <div style={{
      position: 'relative',
      padding: '48px 32px',
      background: props.bgColor || '#f3f4f6',
      backgroundImage: props.imageUrl ? `url(${props.imageUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: 8,
      overflow: 'hidden',
      minHeight: 200,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      {props.imageUrl && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {props.title && (
          <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: props.imageUrl ? '#fff' : '#1a1a2e' }}>
            {props.title}
          </h2>
        )}
        {props.subtitle && (
          <p style={{ margin: '0 0 16px', fontSize: 16, color: props.imageUrl ? '#e5e7eb' : '#555' }}>
            {props.subtitle}
          </p>
        )}
        {props.ctaLabel && (
          <a
            href={props.ctaUrl || '#'}
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#4f46e5',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {props.ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}

function TextBlockPreview({ props }) {
  return (
    <div style={{
      padding: '16px 24px',
      textAlign: props.alignment || 'left',
      fontSize: 15,
      lineHeight: 1.7,
      color: '#333',
      whiteSpace: 'pre-wrap',
    }}>
      {props.content || 'Texto vazio...'}
    </div>
  );
}

function ProductGridPreview({ props }) {
  const cols = parseInt(props.columns, 10) || 3;
  const maxItems = parseInt(props.maxItems, 10) || 4;
  const placeholders = Array.from({ length: maxItems });

  return (
    <div style={{ padding: '16px 0' }}>
      {props.title && (
        <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: '#1a1a2e' }}>{props.title}</h3>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {placeholders.map((_, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, textAlign: 'center', background: '#fafafa' }}>
            <div style={{ width: '100%', height: 120, background: '#e5e7eb', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
              Produto {i + 1}
            </div>
            <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Produto exemplo</div>
            <div style={{ fontSize: 14, color: '#4f46e5', fontWeight: 600, marginTop: 4 }}>R$ --,--</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarouselPreview({ props }) {
  const items = props.items || [];
  if (items.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', background: '#f3f4f6', borderRadius: 8, color: '#999', fontSize: 14 }}>
        Carrossel vazio - adicione slides
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', overflowX: 'auto', gap: 12, scrollSnapType: 'x mandatory' }}>
        {items.map((item, i) => (
          <div key={i} style={{ minWidth: '80%', scrollSnapAlign: 'start', flexShrink: 0 }}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={`Slide ${i + 1}`} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 200, background: '#e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14 }}>
                Slide {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: '#999' }}>
        {items.length} slide{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function HtmlBlockPreview({ props }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <div
        style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fefefe', fontSize: 14, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: props.html || '<p style="color:#999">HTML vazio</p>' }}
      />
    </div>
  );
}

function SpacerPreview({ props }) {
  const h = parseInt(props.height, 10) || 40;
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ borderTop: '1px dashed #ccc', width: '80%', position: 'relative' }}>
        <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 8px', fontSize: 11, color: '#999' }}>
          {h}px
        </span>
      </div>
    </div>
  );
}

function VideoPreview({ props }) {
  const youtubeId = getYouTubeId(props.videoUrl);
  const vimeoId = getVimeoId(props.videoUrl);
  const padding = getAspectPadding(props.aspectRatio);

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ position: 'relative', paddingBottom: padding, height: 0, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            title="YouTube video"
          />
        ) : vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            title="Vimeo video"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14, background: '#1a1a2e' }}>
            <span style={{ fontSize: 40, marginRight: 12 }}>&#9654;</span>
            {props.videoUrl ? 'Video preview' : 'Insira uma URL de video'}
          </div>
        )}
      </div>
      {props.caption && (
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
          {props.caption}
        </p>
      )}
    </div>
  );
}

function FormPreview({ props }) {
  const formFields = props.fields || [];

  return (
    <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }}>
      {props.title && (
        <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600, color: '#1a1a2e' }}>{props.title}</h3>
      )}
      {formFields.length === 0 && (
        <p style={{ color: '#999', fontSize: 13 }}>Adicione campos ao formulario</p>
      )}
      {formFields.map((field, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 4 }}>
            {field.label || `Campo ${i + 1}`}
            {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              placeholder={field.placeholder || ''}
              disabled
              rows={3}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', background: '#fff', resize: 'none' }}
            />
          ) : field.type === 'select' ? (
            <select
              disabled
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}
            >
              <option>{field.placeholder || 'Selecione...'}</option>
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              placeholder={field.placeholder || ''}
              disabled
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}
            />
          )}
        </div>
      ))}
      <button
        disabled
        style={{
          padding: '10px 24px',
          background: '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'default',
          marginTop: 8,
        }}
      >
        {props.submitLabel || 'Enviar'}
      </button>
    </div>
  );
}

function MapPreview({ props }) {
  const lat = props.lat || '-23.5505';
  const lng = props.lng || '-46.6333';
  const zoom = props.zoom || 15;
  const height = props.height || 400;

  const hasCoords = props.lat && props.lng;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${parseFloat(lng) + 0.01},${parseFloat(lat) + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div style={{ padding: '16px 0' }}>
      {props.address && (
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
          <strong>Endereco:</strong> {props.address}
        </p>
      )}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', height }}>
        {hasCoords ? (
          <iframe
            src={osmUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Map"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14 }}>
            Insira latitude e longitude para ver o mapa
          </div>
        )}
      </div>
    </div>
  );
}

const BLOCK_RENDERERS = {
  Banner: BannerPreview,
  TextBlock: TextBlockPreview,
  ProductGrid: ProductGridPreview,
  CarouselBlock: CarouselPreview,
  HtmlBlock: HtmlBlockPreview,
  SpacerBlock: SpacerPreview,
  VideoBlock: VideoPreview,
  FormBlock: FormPreview,
  MapBlock: MapPreview,
};

export default function PreviewRenderer({ blocks, viewportWidth }) {
  return (
    <div style={{
      width: viewportWidth,
      maxWidth: '100%',
      margin: '0 auto',
      background: '#fff',
      minHeight: 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 0 0 1px #e5e7eb',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {blocks.length === 0 && (
        <div style={{ padding: 64, textAlign: 'center', color: '#999', fontSize: 14 }}>
          Nenhum bloco adicionado
        </div>
      )}
      {blocks.map((block) => {
        const Renderer = BLOCK_RENDERERS[block.type];
        if (!Renderer) {
          return (
            <div key={block.id} style={{ padding: 16, margin: 8, background: '#fef3c7', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
              Bloco desconhecido: {block.type}
            </div>
          );
        }
        return (
          <div key={block.id} style={{ padding: '0 24px' }}>
            <Renderer props={block.props || {}} />
          </div>
        );
      })}
    </div>
  );
}
