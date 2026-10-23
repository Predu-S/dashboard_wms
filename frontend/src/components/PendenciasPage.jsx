import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'
import TabelaDados from './TabelaDados'
import GraficosAnaliticos from './GraficosAnaliticos'
import MiniTelas from './MiniTelas'
import { agruparCampos, agruparSoma } from './chartUtils'

const ROTULOS_TIPO = {
  ENTRADA: 'Entradas',
  SAIDA: 'Saídas',
  TRANSF_DESTINO: 'Transf. Destino',
  TRANSF_ORIGEM: 'Transf. Origem',
}

const COLUNAS = [
  { chave: 'endereco', rotulo: 'Endereço' },
  { chave: 'deposito', rotulo: 'Depósito' },
  { chave: 'tipo', rotulo: 'Tipo', render: (item) => ROTULOS_TIPO[item.tipo] || item.tipo, valorCsv: (item) => ROTULOS_TIPO[item.tipo] || item.tipo },
  { chave: 'quantidade', rotulo: 'Quantidade' },
]

export default function PendenciasPage() {
  const [pendencias, setPendencias] = useState([])
  const [resumo, setResumo] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [miniTela, setMiniTela] = useState('geral')

  useEffect(() => {
    Promise.all([api.pendencias(), api.pendenciasResumo()])
      .then(([pendenciasResp, resumoResp]) => {
        setPendencias(pendenciasResp)
        setResumo(resumoResp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const pendenciasFiltradas = useMemo(
    () => (filtroTipo === 'todos' ? pendencias : pendencias.filter((p) => p.tipo === filtroTipo)),
    [pendencias, filtroTipo]
  )

  const totalPendencias = resumo.reduce((soma, r) => soma + r.quantidade, 0)
  const pendenciasPorTipo = resumo.map((r) => ({ label: ROTULOS_TIPO[r.tipo] || r.tipo, valor: r.quantidade }))
  const quantidadePorDeposito = agruparSoma(pendencias, (p) => `Depósito ${p.deposito}`, (p) => p.quantidade, 'label', 'unidades')
  const tiposPorDeposito = agruparCampos(pendencias, (p) => `Depósito ${p.deposito}`, (p) => ({ [p.tipo]: 1 }))
  const seriesPorTipo = Object.entries(ROTULOS_TIPO).map(([tipo, rotulo]) => ({ chave: tipo, nome: rotulo }))
  const enderecosComPendencias = agruparSoma(pendencias, (p) => `Dep. ${p.deposito} · ${p.endereco}`, (p) => p.quantidade, 'label', 'unidades').slice(0, 10)

  return (
    <>
      <header className="conteudo__header">
        <h1>Pendências — WMS</h1>
        <span className="conteudo__data">Entradas, saídas e transferências em aberto</span>
      </header>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className="erro">Não foi possível carregar a API ({erro}).</p>}

      {!carregando && !erro && (
        <>
          <section className="kpis">
            <KpiCard titulo="Total de Pendências" valor={totalPendencias} subtitulo="Todas em aberto" />
            {resumo.map((r) => (
              <KpiCard
                key={r.tipo}
                titulo={ROTULOS_TIPO[r.tipo] || r.tipo}
                valor={r.quantidade}
                ativo={filtroTipo === r.tipo}
                onClick={() => setFiltroTipo((atual) => (atual === r.tipo ? 'todos' : r.tipo))}
                subtitulo="clique para filtrar"
              />
            ))}
          </section>

          <MiniTelas telas={[{ id: 'geral', label: 'Visão geral' }, { id: 'localizacao', label: 'Por localização' }]} ativa={miniTela} onSelecionar={setMiniTela} />
          <section id={`painel-${miniTela}`} role="tabpanel" aria-labelledby={`aba-${miniTela}`}>
            {miniTela === 'geral' ? (
              <GraficosAnaliticos graficos={[
                { titulo: 'Pendências por tipo', dados: pendenciasPorTipo, tipo: 'pizza', series: [{ chave: 'valor', nome: 'Pendências' }] },
                { titulo: 'Unidades em aberto por depósito', dados: quantidadePorDeposito, tipo: 'barra', horizontal: true, series: [{ chave: 'unidades', nome: 'Unidades' }] },
              ]} />
            ) : (
              <GraficosAnaliticos graficos={[
                { titulo: 'Composição das pendências por depósito', dados: tiposPorDeposito, tipo: 'barra', empilhado: true, series: seriesPorTipo },
                { titulo: 'Endereços com mais unidades pendentes', dados: enderecosComPendencias, tipo: 'barra', horizontal: true, series: [{ chave: 'unidades', nome: 'Unidades' }] },
              ]} />
            )}
          </section>

          <TabelaDados
            titulo="Detalhamento das Pendências"
            colunas={COLUNAS}
            dados={pendenciasFiltradas}
            nomeArquivoCsv="pendencias"
            mensagemVazia="Nenhuma pendência encontrada para esse filtro."
          />
        </>
      )}
    </>
  )
}
