import { createContext, useContext, useMemo, useState } from 'react'
import { calcularPeriodo } from '../components/FiltroData'

const PeriodoContext = createContext(null)

export function PeriodoProvider({ children }) {
  const [atalho, setAtalho] = useState('hoje')
  const [dataInicioCustom, setDataInicioCustom] = useState('')
  const [dataFimCustom, setDataFimCustom] = useState('')

  const periodo = useMemo(
    () => calcularPeriodo(atalho, dataInicioCustom, dataFimCustom),
    [atalho, dataInicioCustom, dataFimCustom]
  )

  const valor = {
    atalho,
    setAtalho,
    dataInicioCustom,
    setDataInicioCustom,
    dataFimCustom,
    setDataFimCustom,
    periodo,
  }

  return <PeriodoContext.Provider value={valor}>{children}</PeriodoContext.Provider>
}

export function usePeriodo() {
  const contexto = useContext(PeriodoContext)
  if (!contexto) {
    throw new Error('usePeriodo precisa ser usado dentro de um PeriodoProvider')
  }
  return contexto
}
