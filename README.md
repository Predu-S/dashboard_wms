# Dashboard de Depósito — Esqueleto do Projeto

Protótipo inicial da sua aplicação Web (backend .NET/C# + frontend React),
focado no módulo de ocupação de depósito/armazém.

## Estrutura

```
dashboard-deposito/
├── backend/DepositoApi/     → API .NET (ASP.NET Core Web API)
└── frontend/                → App React (Vite)
```

## Como rodar o backend (.NET)

Pré-requisito: .NET 8 SDK instalado (https://dotnet.microsoft.com/download).

```bash
cd backend/DepositoApi
dotnet restore
dotnet run
```

Por padrão a API já sobe usando **dados fictícios** (`OcupacaoServiceMock`),
então dá pra testar o frontend sem precisar do Firebird configurado ainda.
A API deve subir em algo como `http://localhost:5000` (confira a porta no
terminal ao rodar).

### Conectando no Firebird de verdade

1. Edite `appsettings.json` e ajuste a `ConnectionStrings:FirebirdDefault`
   com os dados reais do seu servidor Firebird.
2. Ajuste a query em `Services/OcupacaoService.cs` (marcada com `TODO`) para
   bater com o nome real da tabela/view de endereços do seu WMS — hoje ela
   assume uma tabela `WMS_ENDERECO` com os campos Depósito/Rua/Prédio/Andar/
   Apartamento + capacidade/quantidade ocupada. Ajuste para o seu schema real.
3. No `appsettings.json` (ou `appsettings.Development.json`), defina:
   ```json
   "UsarDadosFicticios": false
   ```
4. Rode `dotnet run` novamente.

## Como rodar o frontend (React)

Pré-requisito: Node.js 18+ instalado.

```bash
cd frontend
npm install
npm run dev
```

O app abre em `http://localhost:5173` e já tenta consumir a API em
`http://localhost:5000`. Se sua API subir em outra porta, crie um arquivo
`.env` dentro de `frontend/` com:

```
VITE_API_URL=http://localhost:5000
```

## O que já está pronto

- Endpoint `GET /api/estoque/ocupacao` — lista detalhada por endereço.
- Endpoint `GET /api/estoque/ocupacao/resumo` — agregado por Depósito (usado
  no gráfico de barras).
- Tela React com cards de KPI (ocupação geral, capacidade total, posições
  ocupadas, endereços críticos), gráfico de ocupação por depósito (Recharts)
  e tabela detalhada por endereço com barra de progresso.

## Próximos passos sugeridos

- Trocar a query mock pela real, ajustando ao seu schema Firebird.
- Adicionar autenticação (ex.: JWT) antes de expor a API publicamente.
- Pensar na camada multi-tenant (tabela de clientes + connection string
  dinâmica por cliente) quando for atender mais de uma empresa.
- Adicionar mais módulos (Vendas, Fiscal etc.) seguindo o mesmo padrão de
  Controller + Service + componente React.
