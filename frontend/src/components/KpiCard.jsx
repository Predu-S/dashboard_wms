export default function KpiCard({ titulo, valor, subtitulo, tom = 'neutro', ativo = false, onClick }) {
  const clicavel = typeof onClick === 'function'

  return (
    <div
      className={`kpi-card kpi-card--${tom} ${clicavel ? 'kpi-card--clicavel' : ''} ${ativo ? 'kpi-card--ativo' : ''}`}
      onClick={onClick}
      role={clicavel ? 'button' : undefined}
      tabIndex={clicavel ? 0 : undefined}
    >
      <span className="kpi-card__titulo">{titulo}</span>
      <span className="kpi-card__valor">{valor}</span>
      {subtitulo && <span className="kpi-card__subtitulo">{subtitulo}</span>}
    </div>
  )
}
