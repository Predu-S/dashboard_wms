import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import KpiCard from './KpiCard'

const ROTULOS_TIPO = {
  ENTRADA: 'Entradas',
  SAIDA: 'Saídas',
  TRANSF_DESTINO: 'Transf. Destino',
  TRANSF_ORIGEM: 'Transf. Origem',
}

export default function PendenciasPage() {
  const [pendencias, setPendencias] = useState([])
  const [resumo, setResumo] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')

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

          <section className="tabela-card" style={{ maxHeight: 480 }}>
            <div className="tabela-card__header">
              <h3>Detalhamento das Pendências</h3>
            </div>
            <div className="tabela-card__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Endereço</th>
                    <th>Depósito</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {pendenciasFiltradas.map((p, i) => (
                    <tr key={i}>
                      <td>{p.endereco}</td>
                      <td>{p.deposito}</td>
                      <td>{ROTULOS_TIPO[p.tipo] || p.tipo}</td>
                      <td>{p.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendenciasFiltradas.length === 0 && (
                <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>
                  Nenhuma pendência encontrada para esse filtro.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </>
  )
}
