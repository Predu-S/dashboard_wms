export default function MiniTelas({ telas, ativa, onSelecionar, rotulo = 'Visões do módulo' }) {
  return (
    <div className="abas mini-telas" role="tablist" aria-label={rotulo}>
      {telas.map((tela) => (
        <button
          key={tela.id}
          id={`aba-${tela.id}`}
          type="button"
          role="tab"
          aria-selected={ativa === tela.id}
          aria-controls={`painel-${tela.id}`}
          tabIndex={ativa === tela.id ? 0 : -1}
          className={ativa === tela.id ? 'aba ativa' : 'aba'}
          onClick={() => onSelecionar(tela.id)}
        >
          {tela.label}
        </button>
      ))}
    </div>
  )
}
