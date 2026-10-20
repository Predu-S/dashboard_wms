import { Calendar, Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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

export default function FiltroData({ atalho, onSelecionarAtalho, dataInicio, dataFim, onSelecionarDataInicio, onSelecionarDataFim, className = '' }) {
  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false)
  const [modalPersonalizadoAberto, setModalPersonalizadoAberto] = useState(false)
  const [dataInicioPendente, setDataInicioPendente] = useState(dataInicio || '')
  const [dataFimPendente, setDataFimPendente] = useState(dataFim || '')
  const seletorPeriodoRef = useRef(null)

  useEffect(() => {
    if (!menuPeriodoAberto && !modalPersonalizadoAberto) return undefined
    const aoClicarFora = (event) => {
      if (!seletorPeriodoRef.current?.contains(event.target)) setMenuPeriodoAberto(false)
    }
    const aoPressionarTecla = (event) => {
      if (event.key === 'Escape') {
        setMenuPeriodoAberto(false)
        setModalPersonalizadoAberto(false)
      }
    }
    document.addEventListener('pointerdown', aoClicarFora)
    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      document.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [menuPeriodoAberto])

  const periodoSelecionado = ATALHOS.find((item) => item.valor === atalho)?.rotulo ?? 'Todo o período'
  const fecharModalPersonalizado = () => setModalPersonalizadoAberto(false)

  function escolherPeriodo(valor) {
    setMenuPeriodoAberto(false)
    if (valor === 'personalizado') {
      setDataInicioPendente(dataInicio || '')
      setDataFimPendente(dataFim || '')
      setModalPersonalizadoAberto(true)
      return
    }
    setModalPersonalizadoAberto(false)
    onSelecionarAtalho(valor)
  }

  return (
    <>
      <div className={`filtro-barra ${className}`.trim()}>
        <div className="filtro-barra__item" ref={seletorPeriodoRef}>
          <label htmlFor="filtro-periodo">Período</label>
          <button
            id="filtro-periodo"
            className="filtro-periodo__gatilho"
            type="button"
            title={`Período: ${periodoSelecionado}`}
            aria-label={`Selecionar período. Atual: ${periodoSelecionado}`}
            aria-haspopup="listbox"
            aria-expanded={menuPeriodoAberto}
            onClick={() => setMenuPeriodoAberto((aberto) => !aberto)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setMenuPeriodoAberto(true) }
            }}
          >
            <Calendar size={17} aria-hidden="true" />
          </button>
          {menuPeriodoAberto && (
            <div className="filtro-periodo__menu busca-painel" role="listbox" aria-label="Selecionar período">
              {ATALHOS.map((item) => (
                <button
                  key={item.valor}
                  className="busca-painel__item filtro-periodo__opcao"
                  type="button"
                  role="option"
                  aria-selected={atalho === item.valor}
                  onClick={() => escolherPeriodo(item.valor)}
                >
                  <span className="busca-painel__rotulo">{item.rotulo}</span>
                  {atalho === item.valor && <Check size={15} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalPersonalizadoAberto && (
        <div className="modal-backdrop modal-periodo__backdrop" onClick={fecharModalPersonalizado}>
          <section
            className="modal-periodo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-periodo-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-periodo__cabecalho">
              <div>
                <h2 id="modal-periodo-titulo">Período personalizado</h2>
                <p>Escolha as datas de início e fim para filtrar o dashboard.</p>
              </div>
              <button className="modal-reposicao__fechar" type="button" onClick={fecharModalPersonalizado} aria-label="Fechar">
                <X size={17} />
              </button>
            </header>
            <div className="modal-periodo__campos">
              <label htmlFor="filtro-data-inicio">Data inicial
                <input id="filtro-data-inicio" type="date" value={dataInicioPendente} max={dataFimPendente || undefined} onChange={(event) => setDataInicioPendente(event.target.value)} />
              </label>
              <label htmlFor="filtro-data-fim">Data final
                <input id="filtro-data-fim" type="date" value={dataFimPendente} min={dataInicioPendente || undefined} onChange={(event) => setDataFimPendente(event.target.value)} />
              </label>
            </div>
            <footer className="modal-periodo__rodape">
              <button className="modal-periodo__cancelar" type="button" onClick={fecharModalPersonalizado}>Cancelar</button>
              <button
                className="modal-reposicao__botao"
                type="button"
                disabled={!dataInicioPendente || !dataFimPendente || dataInicioPendente > dataFimPendente}
                onClick={() => {
                  onSelecionarDataInicio(dataInicioPendente)
                  onSelecionarDataFim(dataFimPendente)
                  onSelecionarAtalho('personalizado')
                  fecharModalPersonalizado()
                }}
              >Aplicar período</button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

