import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import Chip from '../components/Chip'
import ProductThumb from '../components/ProductThumb'
import {
  formatPrice, verificationLabel, commercialScoreLabel,
  productBadges, productDescription, availableStoresFor,
} from './RecomendacionesUtils'

export default function ProductPreviewModal({
  preview,
  productRating,
  productReviewSending,
  onClose,
  onRatingChange,
  onSubmitRating,
  onOpenProduct,
}) {
  const { authToken } = useAuth()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (preview && scrollRef.current) scrollRef.current.scrollTop = 0
  }, [preview])

  if (!preview) return null

  const { rec, product } = preview
  const badges = productBadges(product)

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.42)',
        zIndex: 45, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        ref={scrollRef}
        style={{
          width: 'min(430px, 100%)', maxHeight: '86vh', overflowY: 'auto',
          background: 'white', borderRadius: 18, border: '1px solid var(--gray-200)',
          boxShadow: '0 24px 80px rgba(15,23,42,0.22)', padding: 16,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Vista previa del producto
            </div>
            <div style={{ fontSize: 19, color: 'var(--gray-900)', fontWeight: 900, lineHeight: 1.15, marginTop: 4 }}>
              {product.commercial_name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none', background: 'var(--gray-100)', borderRadius: 10,
              width: 34, height: 34, cursor: 'pointer', fontSize: 18,
              color: 'var(--gray-600)', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          marginTop: 14, borderRadius: 16, minHeight: 148,
          background: 'linear-gradient(135deg, var(--green-light), #F8FAFC)',
          border: '1px solid var(--gray-200)', display: 'grid',
          placeItems: 'center', padding: 18, textAlign: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <ProductThumb product={product} icon={rec?.icon ?? '💊'} size={94} label={product.commercial_name} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 800 }}>
              {product.image_url ? 'Imagen capturada desde la tienda' : 'Imagen real pendiente de capturar por scraper'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 11, background: 'var(--gray-50)' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 850, textTransform: 'uppercase', letterSpacing: 0.6 }}>Precio</div>
            <div style={{ fontSize: 17, color: 'var(--green-dark)', fontWeight: 950, marginTop: 3 }}>
              {formatPrice(product.price)}
            </div>
          </div>
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 11, background: 'var(--gray-50)' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 850, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tienda</div>
            <div style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 900, marginTop: 4 }}>{product.pharmacy}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          <Chip color="var(--green-dark)" bg="var(--green-light)">{verificationLabel(product)}</Chip>
          {commercialScoreLabel(product) && (
            <Chip color="#1D4ED8" bg="#DBEAFE">{commercialScoreLabel(product)}</Chip>
          )}
          {product.review_count > 0 ? (
            <Chip color="#92400E" bg="var(--amber-light)">
              {Number(product.avg_rating ?? 0).toFixed(1)} ★ · {product.review_count} reseña{product.review_count !== 1 ? 's' : ''}
            </Chip>
          ) : (
            <Chip>Sin reseñas aún</Chip>
          )}
          {badges.map(([label, color, bg]) => (
            <Chip key={label} color={color} bg={bg}>{label}</Chip>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 900, marginBottom: 7 }}>Descripción breve</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {productDescription(rec, product).map(item => (
              <div key={item} style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.4, background: 'var(--gray-50)', borderRadius: 9, padding: '8px 10px' }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 900, marginBottom: 7 }}>Tiendas disponibles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableStoresFor(rec, product).map(store => (
              <div key={`${store.pharmacy}-${store.url || store.commercial_name}`} style={{
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                alignItems: 'center', border: '1px solid var(--gray-200)',
                borderRadius: 11, padding: '9px 10px',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-800)', fontWeight: 850 }}>{store.pharmacy}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {store.commercial_name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => onOpenProduct(store, event)}
                  style={{
                    border: 'none', borderRadius: 9, background: 'var(--green-light)',
                    color: 'var(--green-dark)', padding: '8px 10px',
                    fontSize: 11, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {formatPrice(store.price)}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 15, borderTop: '1px solid var(--gray-200)', paddingTop: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-800)', fontWeight: 900 }}>Califica este producto</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4, marginTop: 3 }}>
            Esta calificación ayuda al reranker por producto. No modifica tu recomendación actual.
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => onRatingChange(value)}
                aria-label={`${value} estrella${value !== 1 ? 's' : ''}`}
                aria-pressed={productRating === value}
                style={{
                  flex: 1,
                  border: `1px solid ${productRating >= value ? '#F59E0B' : 'var(--gray-200)'}`,
                  borderRadius: 10,
                  background: productRating >= value ? '#FFF7E8' : 'white',
                  color: productRating >= value ? '#D97706' : 'var(--gray-300)',
                  height: 42, fontSize: 21, cursor: 'pointer',
                }}
              >
                ★
              </button>
            ))}
          </div>
          {!authToken && (
            <div style={{ fontSize: 11, color: '#78350F', background: 'var(--amber-light)', borderRadius: 9, padding: '8px 10px', lineHeight: 1.35, marginTop: 10 }}>
              Para guardar la calificación necesitas iniciar sesión.
            </div>
          )}
          <button
            className="btn-primary"
            type="button"
            onClick={onSubmitRating}
            disabled={productReviewSending || !productRating || !authToken}
            style={{ marginTop: 12 }}
          >
            {productReviewSending ? 'Guardando...' : 'Guardar calificación'}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={(event) => onOpenProduct(product, event)}
            style={{ width: '100%', marginTop: 10 }}
          >
            Ver en tienda →
          </button>
        </div>
      </div>
    </div>
  )
}
