import { Calendar } from 'lucide-react'

const ATALHOS = [
  { valor: 'todos', rotulo: 'Todo o período' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7dias', rotulo: 'Últimos 7 dias' },
  { valor: '30dias', rotulo: 'Últimos 30 dias' },
  { valor: 'mes_atual', rotulo: 'Este mês' },
  { valor: 'mes_passado', rotulo: 'Mês passado' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
]

function paraISO(data) {
  return data.toISOString().slice(0, 10)
}

/// Calcula { dataInicio, dataFim } (strings yyyy-MM-dd ou null) a partir do atalho escolhido.
export function calcularPeriodo(atalho, dataInicioCustom, dataFimCustom) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  switch (atalho) {
    case 'hoje':
      return { dataInicio: paraISO(hoje), dataFim: paraISO(hoje) }
    case '7dias': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 6)
      return { dataInicio: paraISO(inicio), dataFim: paraISO(hoje) }
    }
    case '30dias': {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 29)
      return { dataInicio: paraISO(inicio), dataFim: paraISO(hoje) }
    }
    case 'mes_atual': {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return { dataInicio: paraISO(inicio), dataFim: paraISO(hoje) }
    }
    case 'mes_passado': {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      return { dataInicio: paraISO(inicio), dataFim: paraISO(fim) }
    }
    case 'personalizado':
      return { dataInicio: dataInicioCustom || null, dataFim: dataFimCustom || null }
    case 'todos':
    default:
      return { dataInicio: null, dataFim: null }
  }
}

export default function FiltroData({ atalho, onSelecionarAtalho, dataInicio, dataFim, onSelecionarDataInicio, onSelecionarDataFim }) {
  return (
    <div className="filtro-barra">
      <div className="filtro-barra__item">
        <Calendar size={14} />
        <label htmlFor="filtro-periodo">Período</label>
        <select id="filtro-periodo" value={atalho} onChange={(e) => onSelecionarAtalho(e.target.value)}>
          {ATALHOS.map((a) => (
            <option key={a.valor} value={a.valor}>{a.rotulo}</option>
          ))}
        </select>
      </div>

      {atalho === 'personalizado' && (
        <>
          <div className="filtro-barra__item">
            <label htmlFor="filtro-data-inicio">De</label>
            <input
              id="filtro-data-inicio"
              type="date"
              value={dataInicio || ''}
              onChange={(e) => onSelecionarDataInicio(e.target.value)}
            />
          </div>
          <div className="filtro-barra__item">
            <label htmlFor="filtro-data-fim">Até</label>
            <input
              id="filtro-data-fim"
              type="date"
              value={dataFim || ''}
              onChange={(e) => onSelecionarDataFim(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  )
}
