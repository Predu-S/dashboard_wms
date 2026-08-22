# Depósito BI 📦

Dashboard de ocupação de armazém/depósito — protótipo de um produto de BI
white-label, com backend em **.NET/C#** e frontend em **React**.

![status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)

## ✨ Funcionalidades

- KPIs de ocupação (geral, capacidade total, posições ocupadas, endereços críticos)
- Gráfico de ocupação por Depósito
- Tabela detalhada por endereço (Depósito / Rua / Prédio / Andar / Apartamento)
- Filtro por Depósito
- Integração com Firebird via view SQL (ou dados fictícios para demo)

## 🛠️ Stack

| Camada    | Tecnologia                        |
|-----------|------------------------------------|
| Backend   | ASP.NET Core Web API (.NET 8)      |
| Banco     | Firebird (via `FirebirdSql.Data.FirebirdClient` + Dapper) |
| Frontend  | React + Vite + Recharts            |

## 🚀 Rodando localmente

```bash
# Backend
cd backend/DepositoApi
dotnet restore
dotnet run

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

Por padrão a API sobe com **dados fictícios** (`UsarDadosFicticios: true` no
`appsettings.json`), então dá pra testar sem precisar do Firebird configurado.

Para conectar num Firebird real, ajuste `ConnectionStrings:FirebirdDefault`
no `appsettings.json` e mude `UsarDadosFicticios` para `false`.

## 📄 Licença

Projeto privado / uso interno.
