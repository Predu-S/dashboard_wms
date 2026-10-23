import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { api } from '../api'
import KpiCard from './KpiCard'
import OcupacaoChart from './OcupacaoChart'
import OcupacaoTabela from './OcupacaoTabela'
import FiltroBarra from './FiltroBarra'
import GraficosAnaliticos from './GraficosAnaliticos'
import MiniTelas from './MiniTelas'
import { agruparCampos } from './chartUtils'

export default function OcupacaoPage() {
  const [resumo, setResumo] = useState([])
  const [detalhado, setDetalhado] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [depositosSelecionados, setDepositosSelecionados] = useState([])
  const [situacaoFiltro, setSituacaoFiltro] = useState('todas')
  const [miniTela, setMiniTela] = useState('mapa')
  const [modalCriticosAberto, setModalCriticosAberto] = useState(false)

  useEffect(() => {
    Promise.all([api.ocupacaoResumo(), api.ocupacaoDetalhada()])
      .then(([resumoResp, detalhadoResp]) => {
        setResumo(resumoResp)
        setDetalhado(detalhadoResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const depositosDisponiveis = useMemo(
    () => [...new Set(resumo.map((d) => d.deposito))],
    [resumo]
  )

  const resumoFiltrado = useMemo(
    () => (depositosSelecionados.length === 0 ? resumo : resumo.filter((d) => depositosSelecionados.includes(d.deposito))),
    [resumo, depositosSelecionados]
  )

  const detalhadoPorDeposito = useMemo(
    () => (depositosSelecionados.length === 0 ? detalhado : detalhado.filter((d) => depositosSelecionados.includes(d.deposito))),
    [detalhado, depositosSelecionados]
  )

  const detalhadoFiltrado = useMemo(() => {
    if (situacaoFiltro === 'critico') return detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90)
    if (situacaoFiltro === 'normal') return detalhadoPorDeposito.filter((d) => d.percentualOcupacao < 90)
    return detalhadoPorDeposito
  }, [detalhadoPorDeposito, situacaoFiltro])

  const capacidadeTotal = resumoFiltrado.reduce((soma, d) => soma + d.capacidadeTotal, 0)
  const ocupadoTotal = resumoFiltrado.reduce((soma, d) => soma + d.quantidadeOcupada, 0)
  const ocupacaoGeral = capacidadeTotal > 0 ? Math.round((ocupadoTotal / capacidadeTotal) * 1000) / 10 : 0
  const enderecosCriticos = detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90).length
  const ocupacaoPorRuaBase = agruparCampos(detalhadoPorDeposito, (d) => `Dep. ${d.deposito} · Rua ${d.rua}`, (d) => ({ capacidade: d.capacidadeTotal, ocupado: d.quantidadeOcupada }))
  const ocupacaoPorRua = ocupacaoPorRuaBase.map((d) => ({ ...d, percentual: d.capacidade ? Math.round(d.ocupado / d.capacidade * 1000) / 10 : 0 })).sort((a, b) => b.percentual - a.percentual).slice(0, 10)
  const enderecosMaisOcupados = detalhadoPorDeposito.slice().sort((a, b) => b.percentualOcupacao - a.percentualOcupacao).slice(0, 8).map((d) => ({ label: `${d.deposito} · ${d.rua}/${d.predio}/${d.andar}/${d.apartamento}`, percentual: d.percentualOcupacao }))
  const faixasOcupacao = [
    { label: '0–49%', valor: detalhadoPorDeposito.filter((d) => d.percentualOcupacao < 50).length, cor: 'var(--chart-green-soft)' },
    { label: '50–74%', valor: detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 50 && d.percentualOcupacao < 75).length, cor: 'var(--chart-green)' },
    { label: '75–89%', valor: detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 75 && d.percentualOcupacao < 90).length, cor: 'var(--chart-warning)' },
    { label: '90% ou mais', valor: detalhadoPorDeposito.filter((d) => d.percentualOcupacao >= 90).length, cor: 'var(--chart-danger)' },
  ].filter((d) => d.valor > 0)
  const posicoesLivresPorDeposito = resumoFiltrado.map((d) => ({
    label: `Depósito ${d.deposito}`,
    livres: Math.max(0, d.capacidadeTotal - d.quantidadeOcupada),
  })).sort((a, b) => b.livres - a.livres)

  const listaEnderecosCriticos = detalhadoPorDeposito
    .filter((endereco) => endereco.percentualOcupacao >= 90)
    .sort((a, b) => b.percentualOcupacao - a.percentualOcupacao)

  return (
    <>
      <header className="conteudo__header">
        <h1>Dashboard de Ocupação — Armazém</h1>
        <span className="conteudo__data">
          {depositosSelecionados.length === 0 ? 'Consolidado • Todos os Depósitos' : depositosSelecionados.length === 1 ? `Depósito ${depositosSelecionados[0]}` : `${depositosSelecionados.length} depósitos selecionados`}
        </span>
      </header>

      {!carregando && !erro && (
        <FiltroBarra
          depositos={depositosDisponiveis}
          depositosSelecionados={depositosSelecionados}
          onSelecionarDeposito={setDepositosSelecionados}
          situacaoSelecionada={situacaoFiltro}
          onSelecionarSituacao={setSituacaoFiltro}
        />
      )}

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && (
        <>
          <section className="kpis">
            <KpiCard titulo="Ocupação Geral" valor={`${ocupacaoGeral}%`} subtitulo="No filtro atual" />
            <KpiCard titulo="Capacidade Total" valor={capacidadeTotal.toLocaleString('pt-BR')} subtitulo="posições" />
            <KpiCard titulo="Posições Ocupadas" valor={ocupadoTotal.toLocaleString('pt-BR')} />
            <KpiCard
              titulo="Endereços Críticos"
              valor={enderecosCriticos}
              subtitulo="≥ 90% • clique para ver os endereços"
              tom={enderecosCriticos > 0 ? 'alerta' : 'neutro'}
              onClick={enderecosCriticos > 0 ? () => setModalCriticosAberto(true) : undefined}
            />
          </section>

          <MiniTelas telas={[{ id: 'mapa', label: 'Visão do armazém' }, { id: 'criticos', label: 'Áreas críticas' }]} ativa={miniTela} onSelecionar={setMiniTela} />
          <section id={`painel-${miniTela}`} role="tabpanel" aria-labelledby={`aba-${miniTela}`}>
            {miniTela === 'mapa' ? (
              <section className="grid-principal">
                <OcupacaoChart dados={resumoFiltrado} />
                <OcupacaoTabela dados={detalhadoFiltrado} />
              </section>
            ) : (
              <GraficosAnaliticos graficos={[
                { titulo: 'Ocupação por rua', dados: ocupacaoPorRua, tipo: 'barra', formato: 'percentual', series: [{ chave: 'percentual', nome: 'Ocupação', corCondicional: { campo: 'percentual', limite: 90, acima: 'var(--chart-danger)', abaixo: 'var(--chart-green)' } }] },
                { titulo: 'Endereços com maior ocupação', dados: enderecosMaisOcupados, tipo: 'barra', horizontal: true, formato: 'percentual', series: [{ chave: 'percentual', nome: 'Ocupação', corCondicional: { campo: 'percentual', limite: 90, acima: 'var(--chart-danger)', abaixo: 'var(--chart-green)' } }] },
                { titulo: 'Distribuição dos endereços', dados: faixasOcupacao, tipo: 'pizza', series: [{ chave: 'valor', nome: 'Endereços' }] },
                { titulo: 'Posições livres por depósito', dados: posicoesLivresPorDeposito, tipo: 'barra', horizontal: true, series: [{ chave: 'livres', nome: 'Posições livres' }] },
              ]} />
            )}
          </section>
        </>
      )}

      {modalCriticosAberto && (
        <div className="modal-backdrop" onClick={() => setModalCriticosAberto(false)}>
          <section
            className="modal-reposicao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-enderecos-criticos-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal-reposicao__cabecalho">
              <div className="modal-reposicao__titulo-grupo">
                <span className="modal-reposicao__icone"><AlertTriangle size={19} /></span>
                <div>
                  <h2 id="modal-enderecos-criticos-titulo">Endereços críticos</h2>
                  <p>{listaEnderecosCriticos.length} {listaEnderecosCriticos.length === 1 ? 'endereço acima' : 'endereços acima'} de 90% de ocupação</p>
                </div>
              </div>
              <button className="modal-reposicao__fechar" type="button" onClick={() => setModalCriticosAberto(false)} aria-label="Fechar modal">
                <X size={19} />
              </button>
            </header>
            <div className="modal-reposicao__conteudo">
              <table>
                <thead>
                  <tr><th>Depósito</th><th>Endereço</th><th>Ocupação</th><th>Quantidade</th><th>Capacidade</th></tr>
                </thead>
                <tbody>
                  {listaEnderecosCriticos.map((endereco) => (
                    <tr key={`${endereco.deposito}-${endereco.rua}-${endereco.predio}-${endereco.andar}-${endereco.apartamento}`}>
                      <td>{endereco.deposito}</td>
                      <td className="modal-reposicao__produto">{`${endereco.rua}/${endereco.predio}/${endereco.andar}/${endereco.apartamento}`}</td>
                      <td><strong>{endereco.percentualOcupacao}%</strong></td>
                      <td>{Number(endereco.quantidadeOcupada).toLocaleString('pt-BR')}</td>
                      <td>{Number(endereco.capacidadeTotal).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="modal-reposicao__rodape">
              <span>Ocupação crítica: igual ou superior a 90% da capacidade.</span>
              <button type="button" className="modal-reposicao__botao" onClick={() => setModalCriticosAberto(false)}>Fechar</button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
