export default function Chip({ children, color = 'var(--gray-600)', bg = 'var(--gray-100)' }) {
  return (
    <span style={{
      fontSize: 10,
      color,
      background: bg,
      borderRadius: 99,
      padding: '3px 7px',
      fontWeight: 800,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
