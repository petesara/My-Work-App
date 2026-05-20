const TEAL = '#2DCDB8'
const PINK = '#F0194A'

function LogoEN({ color }) {
  const w = color || 'white'
  return (
    <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
      <div>
        <span style={{ color: PINK }}>P</span>
        <span style={{ color: w }}>UBL</span>
        <span style={{ color: TEAL }}>I</span>
        <span style={{ color: w }}>C</span>
      </div>
      <div>
        <span style={{ color: TEAL }}>O</span>
        <span style={{ color: w }}>UT</span>
        <span style={{ color: PINK }}>R</span>
        <span style={{ color: w }}>EAC</span>
        <span style={{ color: TEAL }}>H</span>
      </div>
    </div>
  )
}

function LogoFR({ color }) {
  const w = color || 'white'
  return (
    <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
      <div>
        <span style={{ color: w }}>E</span>
        <span style={{ color: TEAL }}>N</span>
        <span style={{ color: w }}>G</span>
        <span style={{ color: PINK }}>A</span>
        <span style={{ color: w }}>GEM</span>
        <span style={{ color: TEAL }}>E</span>
        <span style={{ color: w }}>N</span>
        <span style={{ color: PINK }}>T</span>
      </div>
      <div>
        <span style={{ color: PINK }}>P</span>
        <span style={{ color: w }}>UBL</span>
        <span style={{ color: TEAL }}>I</span>
        <span style={{ color: w }}>C</span>
      </div>
    </div>
  )
}

export default function BrandLogo({ language, size = 'md', darkLetters = false }) {
  const color = darkLetters ? '#1E2769' : undefined
  const fontSize = size === 'lg' ? '2.8rem' : size === 'sm' ? '0.85rem' : '1.1rem'
  return (
    <div style={{ fontSize }}>
      {language === 'FR' ? <LogoFR color={color} /> : <LogoEN color={color} />}
    </div>
  )
}
