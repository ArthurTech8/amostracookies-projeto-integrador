# AGENTS.md — Instruções para agentes de IA

Este arquivo orienta assistentes e agentes de IA (Claude Code, GitHub Copilot, Cursor, Codex, Gemini, Windsurf e outros) que contribuem com o repositório **Doce Gestão**. As regras completas estão no [CONTRIBUTING.md](./CONTRIBUTING.md); este arquivo resume o essencial e acrescenta regras específicas para IA. Em caso de conflito, o CONTRIBUTING.md vale.

> Ferramentas que procuram outro nome de arquivo (ex.: `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules`) devem apenas apontar para este arquivo, sem duplicar o conteúdo.

## Contexto do projeto

- SaaS multiempresa de gestão para negócios do ramo alimentício: produtos e estoque, vendas, despesas e relatórios.
- **Tudo em TypeScript.** Backend em **NestJS** (`backend/`), frontend em **Vue 3 + Vite + Pinia + Vue Router** (`frontend/`), banco **PostgreSQL no alwaysdata** via **TypeORM**.
- Código em inglês; textos para o usuário, mensagens de erro e documentação em português do Brasil.

## Comandos

| Ação | Backend (`cd backend`) | Frontend (`cd frontend`) |
| --- | --- | --- |
| Instalar | `npm install` | `npm install` |
| Rodar em dev | `npm run start:dev` | `npm run dev` |
| Build | `npm run build` | `npm run build` |
| Lint | `npm run lint` | `npm run lint` |
| Testes | `npm test` | `npm run test` |
| Migrations | `npm run migration:generate -- src/database/migrations/<Nome>` e `npm run migration:run` | — |

Antes de dar uma tarefa por concluída, rode **lint, build e testes** da pasta que você alterou e corrija os erros.

## Regras obrigatórias

1. **Escopo**: altere só o necessário para a tarefa pedida. Não reformate arquivos inteiros, não renomeie coisas fora do escopo e não faça "melhorias" não solicitadas.
2. **Siga a estrutura existente** (seção 2 do CONTRIBUTING.md). Novo recurso no backend = novo módulo em `backend/src/modules/<recurso>/` com module, controller, service, entity e DTOs.
3. **Multiempresa**: toda consulta a dados de negócio filtra pelo `companyId` do usuário autenticado (vindo do token). Nunca aceite `companyId` do corpo da requisição. Código que ignora isso será recusado.
4. **Banco**: nunca use `synchronize: true`. Mudou entidade, gere migration. Dinheiro em `numeric(12,2)`, nunca `float`. Operações em várias tabelas dentro de transação.
5. **Validação**: toda entrada da API passa por DTO com `class-validator`.
6. **Frontend**: `<script setup lang="ts">`, sem Options API. Chamadas HTTP só em `services/`. Não use `localStorage` para dados de negócio. Não use `alert()`/`confirm()`.
7. **Tipos**: TypeScript estrito. Não use `any`, `@ts-ignore` ou `as unknown as` para silenciar erros.
8. **Dependências**: não adicione bibliotecas novas sem que a tarefa peça. Se for indispensável, explique o motivo no PR.
9. **Segurança**: nunca escreva senhas, tokens, strings de conexão ou dados reais do alwaysdata em código, testes, logs ou commits. Use variáveis de ambiente e atualize o `.env.example` com valores fictícios.
10. **Não versione** `node_modules/`, `dist/`, `.env`, `.vs/` nem arquivos gerados.
11. **Não invente**: não cite funções, endpoints, rotas ou pacotes que não existem no repositório. Se algo necessário não existir, crie-o de forma explícita ou pergunte.
12. **Testes**: ao criar regra de negócio no backend, crie ou atualize o teste do service. Não apague nem desative testes para fazer a suíte passar.

## Git

- Trabalhe em uma branch a partir de `develop` (`feat/...`, `fix/...`, `docs/...`). Nunca faça push em `main` ou `develop`.
- Commits no padrão Conventional Commits, descrição em português: `feat(products): adiciona filtro por categoria`.
- Nunca reescreva o histórico de branches de outras pessoas (`push --force`, rebase de branch alheia).
- Inclua no rodapé do commit uma linha de coautoria identificando a ferramenta, por exemplo:
  `Co-Authored-By: <nome da ferramenta de IA> <email ou noreply>`

## Pull Requests feitos com IA

- Informe na descrição que o PR foi feito com ajuda de IA e qual ferramenta.
- Descreva o que mudou, por que, e como testar.
- Uma pessoa do time sempre revisa e aprova. O agente nunca aprova nem faz merge do próprio PR.
- Quem abriu o PR é responsável pelo código, mesmo que gerado por IA: revise o diff antes de enviar.

## Quando parar e perguntar

Pare e peça orientação a uma pessoa do time quando a tarefa:

- exigir mudança de stack, de estrutura de pastas ou do modelo de dados de forma ampla;
- envolver o banco de produção, deploy ou credenciais;
- for ambígua a ponto de existirem duas implementações razoáveis com resultados diferentes;
- exigir apagar dados, tabelas, arquivos ou migrations já aplicadas.
