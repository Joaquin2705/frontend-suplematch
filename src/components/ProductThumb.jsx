import { useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'

export default function ProductThumb({ product, icon = '💊', size = 52, label = 'Imagen del producto' }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = product?.image_url
  const showImage = imageUrl && !failed
  const radius = Math.max(12, Math.round(size * 0.28))

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: showImage ? 'white' : 'var(--green-light)',
      border: '1px solid var(--gray-200)',
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: size > 80 ? 'var(--shadow-soft)' : 'none',
    }}>
      {showImage ? (
        <LazyLoadImage
          src={imageUrl}
          alt={label}
          effect="blur"
          onError={() => setFailed(true)}
          width={size}
          height={size}
          style={{ objectFit: 'contain', display: 'block', background: 'white', width: '100%', height: '100%' }}
        />
      ) : (
        <span style={{ fontSize: Math.max(20, Math.round(size * 0.42)) }}>{icon}</span>
      )}
    </div>
  )
}
