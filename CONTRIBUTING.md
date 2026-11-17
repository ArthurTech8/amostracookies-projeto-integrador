# Regras do repositório — Doce Gestão

Este documento define como o repositório é organizado e como contribuir. Vale para todas as pessoas que contribuem, usando ou não ferramentas de IA. Quem usa IA deve ler também o [AGENTS.md](./AGENTS.md).

## 1. Sobre o projeto

O **Doce Gestão** é um SaaS de gestão para negócios do ramo alimentício (confeitarias, docerias, lanchonetes e similares). Ele cobre produtos e estoque, vendas, despesas e relatórios financeiros, e atende várias empresas na mesma instalação (multiempresa).

| Camada | Tecnologia |
| --- | --- |
| Linguagem | TypeScript em todo o projeto |
| Backend | NestJS (API REST) |
| Banco de dados | PostgreSQL hospedado no alwaysdata |
| ORM | TypeORM com migrations |
| Frontend | Vue 3 (Composition API, `<script setup>`) + Vite + Pinia + Vue Router |
| Ícones | lucide-vue-next |

> Mudanças de stack (trocar ORM, banco, framework, adicionar biblioteca grande) precisam ser discutidas em uma issue antes de abrir o PR.

## 2. Estrutura do repositório

```
doce-gestao/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/          # leitura e validação de variáveis de ambiente
│   │   ├── common/          # guards, interceptors, filtros, decorators, utilitários
│   │   ├── database/        # data source e migrations do TypeORM
│   │   └── modules/
│   │       ├── auth/        # login, JWT, refresh token
│   │       ├── companies/   # empresas (tenants)
│   │       ├── users/
│   │       ├── products/
│   │       ├── stock/       # movimentações de estoque
│   │       ├── sales/
│   │       ├── expenses/
│   │       └── reports/
│   ├── test/                # testes e2e
│   └── .env.example
├── frontend/                # aplicação Vue 3
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/          # rotas (uma por tela)
│   │   ├── views/           # telas (páginas)
│   │   ├── components/      # componentes reutilizáveis
│   │   ├── stores/          # stores Pinia
│   │   ├── services/        # chamadas HTTP à API (um arquivo por recurso)
│   │   ├── types/           # tipos compartilhados do frontend
│   │   └── utils/           # formatação, datas, moeda
│   └── .env.example
├── docs/                    # decisões, diagramas, modelo de dados
├── CONTRIBUTING.md
├── AGENTS.md
└── README.md
```

Cada módulo do backend segue o padrão do NestJS:

```
modules/products/
├── products.module.ts
├── products.controller.ts
├── products.service.ts
├── entities/product.entity.ts
├── dto/create-product.dto.ts
├── dto/update-product.dto.ts
└── products.service.spec.ts
```

## 3. Regras gerais de código

- **TypeScript estrito** (`"strict": true`) no backend e no frontend. Não use `any`; prefira `unknown` com verificação de tipo. `// @ts-ignore` não é aceito sem comentário explicando o motivo.
- **Idioma**: código (variáveis, funções, classes, arquivos) em **inglês**. Textos exibidos ao usuário, mensagens de erro da API e documentação em **português do Brasil**.
- **Nomes**: `camelCase` para variáveis e funções, `PascalCase` para classes, tipos, interfaces e componentes Vue, `kebab-case` para nomes de arquivo do backend (`create-product.dto.ts`) e `PascalCase.vue` para componentes.
- **Formatação**: ESLint + Prettier configurados em cada pasta. Rode `npm run lint` e `npm run format` antes de commitar. Aspas simples, sem ponto e vírgula no frontend, conforme a configuração do Prettier de cada pacote.
- **Valores monetários**: no banco, use `numeric(12,2)`; nunca `float`. Na API, trafegue como número com 2 casas ou em centavos (inteiro), conforme definido no módulo, e seja consistente.
- **Datas**: armazene em UTC (`timestamptz`). Datas sem hora (ex.: data da despesa) usam o tipo `date`. A conversão para o fuso do usuário acontece no frontend.
- **Segredos**: nunca commite `.env`, senhas, tokens ou dados de conexão do alwaysdata. Use `.env.example` com valores fictícios.
- **Não versione** `node_modules/`, `dist/`, `.vs/`, `.vscode/` pessoal, `.env` e arquivos de build. Mantenha o `.gitignore` atualizado.

## 4. Backend (NestJS)

- Toda entrada da API passa por **DTO** com `class-validator` e `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`).
- **Controllers** só recebem a requisição, chamam o service e devolvem a resposta. Regra de negócio fica no **service**.
- **Multiempresa**: toda entidade de negócio tem `companyId`. Toda consulta deve filtrar pela empresa do usuário autenticado, obtida do token. Nunca aceite `companyId` vindo do corpo da requisição.
- **Autenticação**: JWT com guard global; rotas públicas marcadas explicitamente com um decorator `@Public()`. Senhas com bcrypt ou argon2.
- **Banco**: alterações de esquema somente por **migration** do TypeORM (`synchronize: false` em todos os ambientes). Uma migration por mudança, com nome descritivo.
- **Operações que mexem em várias tabelas** (ex.: registrar venda e baixar estoque) rodam dentro de **transação**.
- **Erros**: use as exceções do NestJS (`NotFoundException`, `BadRequestException` etc.) com mensagem em português.
- **Rotas REST** no plural e em inglês: `GET /products`, `POST /sales`, `PATCH /products/:id`, `DELETE /expenses/:id`. Prefixo global `/api`.
- Documente os endpoints com `@nestjs/swagger` (disponível em `/api/docs` em desenvolvimento).

## 5. Frontend (Vue 3)

- Use **Composition API** com `<script setup lang="ts">`. Não use Options API.
- Cada tela é uma **view** com rota própria no Vue Router. Componentes reutilizáveis ficam em `components/`.
- O acesso à API fica em `services/` (cliente HTTP único, com base URL vinda de `VITE_API_URL` e o token anexado). Componentes não chamam `fetch`/`axios` diretamente.
- **Stores Pinia** guardam o estado da tela e chamam os services. Não use `localStorage` para dados de negócio; ele serve só para preferências e para o token de sessão.
- Tipos de props e emits declarados com `defineProps<...>()` e `defineEmits<...>()`.
- Não use `alert()` nem `confirm()` do navegador; use os componentes de aviso e confirmação do projeto.
- Formatação de moeda e data sempre pelos utilitários em `utils/format.ts` (padrão pt-BR, BRL).

## 6. Branches

- `main`: código estável, sempre funcionando. Ninguém faz push direto.
- `develop`: integração das funcionalidades prontas.
- Branches de trabalho saem de `develop`, com prefixo pelo tipo:
  - `feat/<descricao-curta>` — nova funcionalidade (ex.: `feat/cadastro-produtos-api`)
  - `fix/<descricao-curta>` — correção
  - `docs/`, `refactor/`, `test/`, `chore/` — demais tipos
- Mantenha a branch atualizada com `develop` (rebase ou merge) antes de pedir revisão.

## 7. Commits

Seguimos o padrão **Conventional Commits**, com a descrição em português:

```
<tipo>(<escopo>): <descrição no imperativo, minúscula, sem ponto final>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`.
Escopos comuns: `backend`, `frontend`, `auth`, `products`, `sales`, `expenses`, `reports`, `db`.

Exemplos:

```
feat(products): adiciona endpoint de cadastro de produto
fix(sales): devolve estoque ao excluir venda
docs: atualiza instruções de instalação
```

- Commits pequenos e com um propósito só.
- Commits feitos com ajuda de IA seguem a mesma regra (veja o AGENTS.md sobre a linha de coautoria).

## 8. Pull Requests

- Todo código entra por PR para `develop`. De `develop` para `main` só em entregas (releases).
- O PR precisa de **pelo menos 1 aprovação** de outra pessoa do time.
- Antes de abrir o PR, confira:
  - [ ] `npm run lint` sem erros
  - [ ] `npm run build` funcionando (backend e/ou frontend)
  - [ ] Testes passando (`npm test`)
  - [ ] Migration criada, se o esquema do banco mudou
  - [ ] `.env.example` atualizado, se surgiu variável nova
  - [ ] Nada de segredos, `node_modules` ou arquivos de build no diff
- Descrição do PR: o que muda, por que, como testar, e prints se mexer em tela.
- Indique no PR se ele foi feito com ajuda de IA e qual ferramenta.

## 9. Testes

- Backend: testes unitários com Jest para os services (`*.spec.ts`) e testes e2e para os fluxos principais (login, venda com baixa de estoque).
- Frontend: Vitest para stores e utilitários; componentes críticos com Vue Test Utils.
- Toda correção de bug deve vir com um teste que falharia antes da correção, quando possível.

## 10. Como rodar localmente

```bash
# backend
cd backend
cp .env.example .env      # preencha com seu banco local ou de desenvolvimento
npm install
npm run migration:run
npm run start:dev         # http://localhost:3000/api

# frontend
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev               # http://localhost:5173
```

Use um banco de desenvolvimento próprio. O banco de produção do alwaysdata só é acessado pelo deploy.
