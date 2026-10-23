import { Check, ChevronDown, Filter } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function FiltroDropdown({ id, label, valor, opcoes, onSelecionar, icone: Icone, multiplo = false }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const selecionada = multiplo ? null : opcoes.find((opcao) => opcao.valor === valor) || opcoes[0]
  const rotuloAtual = multiplo
    ? valor.length === 0
      ? opcoes[0]?.rotulo
      : valor.length === 1
        ? opcoes.find((opcao) => opcao.valor === valor[0])?.rotulo
        : `${valor.length} depósitos selecionados`
    : selecionada?.rotulo

  function estaSelecionada(opcao) {
    return multiplo
      ? opcao.valor === 'todos' ? valor.length === 0 : valor.includes(opcao.valor)
      : valor === opcao.valor
  }

  function selecionar(opcao) {
    if (multiplo) {
      if (opcao.valor === 'todos') {
        onSelecionar([])
        setAberto(false)
      } else {
        const atualizada = valor.includes(opcao.valor)
          ? valor.filter((item) => item !== opcao.valor)
          : [...valor, opcao.valor]
        onSelecionar(atualizada.length > 2 ? [] : atualizada)
      }
      return
    }
    onSelecionar(opcao.valor)
    setAberto(false)
  }

  useEffect(() => {
    if (!aberto) return undefined
    const fecharFora = (event) => {
      if (!ref.current?.contains(event.target)) setAberto(false)
    }
    const fecharEscape = (event) => {
      if (event.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', fecharFora)
    document.addEventListener('keydown', fecharEscape)
    return () => {
      document.removeEventListener('pointerdown', fecharFora)
      document.removeEventListener('keydown', fecharEscape)
    }
  }, [aberto])

  return (
    <div className={`filtro-barra__item filtro-dropdown${aberto ? ' filtro-dropdown--aberto' : ''}`} ref={ref}>
      {Icone && <Icone size={14} aria-hidden="true" />}
      <label id={`${id}-rotulo`}>{label}</label>
      <button
        id={`${id}-controle`}
        className="filtro-periodo__gatilho filtro-dropdown__gatilho"
        type="button"
        aria-labelledby={`${id}-rotulo ${id}-valor`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((estado) => !estado)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setAberto(true) }
        }}
      >
        <span id={`${id}-valor`}>{rotuloAtual}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {aberto && (
        <div className="filtro-periodo__menu busca-painel filtro-dropdown__menu" role="listbox" aria-labelledby={`${id}-rotulo`}>
          {opcoes.map((opcao) => (
            <button
              key={opcao.valor}
              className="busca-painel__item filtro-periodo__opcao"
              type="button"
              role="option"
              aria-selected={estaSelecionada(opcao)}
              onClick={() => selecionar(opcao)}
            >
              <span className="busca-painel__rotulo">{opcao.rotulo}</span>
              {estaSelecionada(opcao) && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FiltroBarra({
  depositos,
  depositosSelecionados,
  onSelecionarDeposito,
  situacaoSelecionada,
  onSelecionarSituacao,
}) {
  const opcoesDeposito = [
    { valor: 'todos', rotulo: 'Todos os depósitos' },
    ...depositos.map((deposito) => ({ valor: deposito, rotulo: `Depósito ${deposito}` })),
  ]
  const opcoesSituacao = [
    { valor: 'todas', rotulo: 'Todas' },
    { valor: 'critico', rotulo: 'Críticos (≥ 90%)' },
    { valor: 'normal', rotulo: 'Normais' },
  ]

  return (
    <div className="filtro-barra">
      <FiltroDropdown
        id="filtro-deposito"
        label="Depósito"
        valor={depositosSelecionados}
        opcoes={opcoesDeposito}
        onSelecionar={onSelecionarDeposito}
        icone={Filter}
        multiplo
      />
      <FiltroDropdown
        id="filtro-criticidade"
        label="Situação"
        valor={situacaoSelecionada}
        opcoes={opcoesSituacao}
        onSelecionar={onSelecionarSituacao}
      />
    </div>
  )
}
