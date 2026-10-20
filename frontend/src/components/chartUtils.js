export function agruparSoma(registros, obterGrupo, obterValor, nomeGrupo = 'label', nomeValor = 'valor') {
  const grupos = new Map()
  registros.forEach((registro) => {
    const grupo = obterGrupo(registro) || 'Não informado'
    grupos.set(grupo, (grupos.get(grupo) || 0) + (Number(obterValor(registro)) || 0))
  })
  return [...grupos].map(([grupo, valor]) => ({ [nomeGrupo]: grupo, [nomeValor]: valor })).sort((a, b) => b[nomeValor] - a[nomeValor])
}

export function agruparPorMes(registros, obterData, series) {
  const grupos = new Map()
  registros.forEach((registro) => {
    const data = new Date(obterData(registro))
    if (Number.isNaN(data.getTime())) return
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    const item = grupos.get(chave) || { label: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(data), ordem: chave }
    series.forEach(({ chave: chaveSerie, obterValor }) => {
      item[chaveSerie] = (item[chaveSerie] || 0) + (Number(obterValor(registro)) || 0)
    })
    grupos.set(chave, item)
  })
  return [...grupos.values()].sort((a, b) => a.ordem.localeCompare(b.ordem))
}

export function agruparCampos(registros, obterGrupo, obterCampos, nomeGrupo = 'label') {
  const grupos = new Map()
  registros.forEach((registro) => {
    const grupo = obterGrupo(registro) || 'Não informado'
    const item = grupos.get(grupo) || { [nomeGrupo]: grupo }
    Object.entries(obterCampos(registro)).forEach(([chave, valor]) => { item[chave] = (item[chave] || 0) + (Number(valor) || 0) })
    grupos.set(grupo, item)
  })
  return [...grupos.values()]
}
