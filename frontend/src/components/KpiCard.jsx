export default function KpiCard({ titulo, valor, subtitulo, tom = 'neutro' }) {
  return (
    <div className={`kpi-card kpi-card--${tom}`}>
      <span className="kpi-card__titulo">{titulo}</span>
      <span className="kpi-card__valor">{valor}</span>
      {subtitulo && <span className="kpi-card__subtitulo">{subtitulo}</span>}
    </div>
  )
}
