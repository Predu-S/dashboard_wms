import { Filter } from 'lucide-react'

export default function FiltroBarra({
  depositos,
  depositoSelecionado,
  onSelecionarDeposito,
  situacaoSelecionada,
  onSelecionarSituacao,
}) {
  return (
    <div className="filtro-barra">
      <div className="filtro-barra__item">
        <Filter size={14} />
        <label htmlFor="filtro-deposito">Depósito</label>
        <select
          id="filtro-deposito"
          value={depositoSelecionado}
          onChange={(e) => onSelecionarDeposito(e.target.value)}
        >
          <option value="todos">Todos</option>
          {depositos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="filtro-barra__item">
        <label htmlFor="filtro-criticidade">Situação</label>
        <select
          id="filtro-criticidade"
          value={situacaoSelecionada}
          onChange={(e) => onSelecionarSituacao(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="critico">Críticos (≥ 90%)</option>
          <option value="normal">Normais</option>
        </select>
      </div>
    </div>
  )
}
