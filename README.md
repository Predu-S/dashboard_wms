# Depósito BI

Dashboard de BI para operações de depósito, com interface React e API ASP.NET Core. Este repositório contém um modo de demonstração com dados inteiramente fictícios, adequado para apresentação em portfólio.

## Demonstração pública

A publicação usa dois serviços: interface no Netlify e API no Render. A API de demonstração deve permanecer com `UsarDadosFicticios=true`; não configure caminhos, credenciais nem conexão com um banco Firebird real.

### API no Render

Crie um Web Service Docker apontando para `backend/DepositoApi/Dockerfile`, com o diretório `backend/DepositoApi` como contexto. Configure as variáveis:

| Variável | Valor |
| --- | --- |
| `UsarDadosFicticios` | `true` |
| `Demo__Enabled` | `true` (também habilitado por padrão em `appsettings.json`) |
| `Demo__Username` | `demo` |
| `Demo__Password` | `demo` |
| `Jwt__SecretKey` | segredo aleatório com pelo menos 32 bytes, gerado e guardado pelo provedor |
| `Cors__AllowedOrigins__0` | `https://projectdemo-dashboard.netlify.app` |

O serviço oferece `GET /health` para verificação de disponibilidade. O modo de demonstração só aceita o login configurado quando os dados fictícios estão ativos. As credenciais `demo` são públicas por definição e só devem ser usadas com dados fictícios.

### Interface no Netlify

O `netlify.toml` já configura o build, a publicação de `frontend/dist`, o fallback para rotas do React e cabeçalhos básicos de segurança. No painel do Netlify, defina estas variáveis antes do deploy:

| Variável | Valor |
| --- | --- |
| `VITE_API_URL` | URL HTTPS pública da API no Render, sem barra no final |
| `VITE_DEMO_MODE` | `true` |
| `VITE_DEMO_USERNAME` | mesmo valor de `Demo__Username` na API |
| `VITE_DEMO_PASSWORD` | mesmo valor de `Demo__Password` na API |

As variáveis `VITE_*` são incluídas no JavaScript público do site. Não coloque nelas chaves privadas, tokens ou credenciais de bancos de dados. Depois de definir as variáveis, faça um novo deploy para que o Vite as incorpore ao build.

## Desenvolvimento local

O backend usa `appsettings.Development.json` para habilitar a demonstração local (`demo` / `demo`) e permitir as origens locais do Vite. A chave JWT é obrigatória e deve ser configurada como segredo de usuário do .NET, sem gravá-la nos arquivos do projeto:

```bash
cd backend/DepositoApi
dotnet user-secrets init
dotnet user-secrets set "Jwt:SecretKey" "gere-um-segredo-local-com-pelo-menos-32-bytes"
dotnet run
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Para testar o site de produção localmente, copie `frontend/.env.example` para `frontend/.env.local`, ajuste `VITE_API_URL` e execute `npm run build` e `npm run preview`.

## Segurança e licença

- Segredos e configurações locais ficam fora dos arquivos versionados; o `.gitignore` e o `.dockerignore` excluem configurações locais e artefatos de compilação.
- O modo fictício não usa tenants nem connection strings por padrão. Configurações Firebird reais só devem ser fornecidas fora do repositório, após uma revisão própria de segurança e acesso.
- Este projeto ainda não declara uma licença de código aberto. Até que uma licença seja adicionada, não presuma que o código pode ser reutilizado por terceiros.

Se uma chave ou senha que já existiu no projeto tiver sido publicada ou enviada a um repositório remoto, revogue-a/rotacione-a no serviço correspondente. Remover o valor do arquivo atual não remove versões anteriores do histórico.

