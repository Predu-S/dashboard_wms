export default function EmBreve({ titulo }) {
  return (
    <>
      <header className="conteudo__header">
        <h1>{titulo}</h1>
        <span className="conteudo__data">Em desenvolvimento</span>
      </header>
      <p style={{ color: 'var(--text-muted)' }}>Esse módulo ainda está sendo construído.</p>
    </>
  )
}
