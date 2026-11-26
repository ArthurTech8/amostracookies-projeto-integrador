# Backend Doce Gestão: primeiros passos

Guia para quem acabou de clonar o repositório e vai trabalhar no backend (API NestJS).
Siga os passos na ordem. As regras gerais do projeto estão no [CONTRIBUTING.md](../CONTRIBUTING.md).

> **Banco compartilhado:** todo o time usa **o mesmo banco PostgreSQL no alwaysdata**.
> O que você grava nele aparece para todo mundo. Leia as regras dos passos 4 e 6 antes de começar.

## 1. Pré-requisitos

- **Node.js 20.12 ou mais novo.** Confira com `node -v`.
- npm (vem com o Node) e git.

## 2. Instalar as dependências

```bash
cd backend
npm install
```

## 3. Configurar o `.env`

```bash
cp .env.example .env
```

Abra o `backend/.env` e preencha:

| Variável | O que colocar |
| --- | --- |
| `DATABASE_URL` | Peça ao Arthur **por mensagem privada**. Não coloque em commit, issue, PR nem no chat do time. |
| `DB_SSL` | Deixe `true`. |
| `JWT_SECRET` | Gere um valor só seu (mínimo de 32 caracteres) com o comando abaixo. |
| `JWT_EXPIRES_IN` | Duração do login. Pode deixar `8h`. |
| `PORT` / `CORS_ORIGIN` | Pode deixar os valores do exemplo. |
| `SUPER_ADMIN_USERNAME` | **Seu** usuário de super admin, em minúsculas (ex.: `maria`). |
| `SUPER_ADMIN_PASSWORD` | Uma senha só sua, com 8 a 72 caracteres. |
| `SUPER_ADMIN_NAME` | Seu nome. |

Para gerar o `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

O `.env` nunca é versionado (já está no `.gitignore`). Se ele aparecer no `git status`, não faça commit e avise o time.

## 4. Aplicar as migrations

```bash
npm run migration:run
```

Esse comando cria ou atualiza as tabelas no banco. Pode rodar quantas vezes quiser: quando não há migration pendente, ele não muda nada.

**Regras do banco compartilhado:**

- Rode só migrations que já estão na branch principal do time.
- **Nunca** rode no banco compartilhado uma migration que você acabou de criar na sua branch. Ela mudaria o banco de todo mundo antes da revisão.
- Antes de rodar uma migration nova, avise o time.

## 5. Criar o seu super admin (uma vez só)

```bash
npm run seed:super-admin
```

O script lê `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD` e `SUPER_ADMIN_NAME` do seu `.env`. Ele mostra uma destas mensagens:

- `Super admin "maria" criado.`: pronto, seu acesso foi criado.
- `Super admin "maria" já existe. Nada foi alterado.`: esse usuário já existia. O script **nunca** troca a senha de quem já existe. Se o usuário não for seu, escolha outro nome no `.env` e rode de novo.

Cada pessoa tem o próprio super admin. **Ninguém compartilha senha de super admin.**

## 6. Subir a API

```bash
npm run start:dev
```

- API: `http://localhost:3000/api`
- Documentação interativa (Swagger): `http://localhost:3000/api/docs`

Para entrar como super admin, chame `POST /api/auth/login` **sem** o campo `companySlug`:

```json
{ "username": "maria", "password": "sua-senha" }
```

Copie o `accessToken` da resposta, clique em **Authorize** no Swagger e cole o token. A partir daí você pode criar empresas em `POST /api/companies`.

**Dados de teste:** use o seu nome no começo do código das empresas que criar (ex.: `maria-teste`, `maria-padaria`). Assim os testes de cada pessoa não se misturam no banco compartilhado.

## 7. Antes de commitar

Rode tudo e corrija o que falhar:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

Os testes não usam o banco: dá para rodar sem `.env` preenchido.

## 8. Problemas comuns

| Sintoma | O que fazer |
| --- | --- |
| `Configuração de ambiente inválida` ao subir a API | A mensagem lista as variáveis com problema. Confira o `backend/.env`. |
| Erro de SSL ou de conexão com o banco | Confira `DATABASE_URL` (sem espaços nem aspas) e se `DB_SSL=true`. |
| `EADDRINUSE` na porta 3000 | Outra API já está rodando. Feche-a ou mude `PORT` no `.env`. |
| `process.loadEnvFile is not a function` | Seu Node é antigo. Atualize para 20.12 ou mais novo. |
| O seed diz que o usuário já existe | Veja o passo 5. |

## 9. Frontend (situação atual)

O frontend fica em `doce-gestao/`. Com a API rodando (passo 6), abra **outro terminal**:

```bash
cd doce-gestao
npm install
npm run dev
```

Acesse `http://localhost:5173` e entre com o **código da empresa**, o usuário e a senha de um admin ou colaborador. O super admin não entra pelo frontend: ele usa o Swagger para criar empresas.

O que já usa a API: login e **Produtos e estoque** (cadastro, edição, desativação e entrada de estoque). **Vendas** e **Despesas** ainda ficam no navegador. Até Vendas migrar, uma venda baixa o estoque só na tela, e ao recarregar a página volta o valor do banco.

A API de vendas já existe (`GET/POST /api/sales`, `GET/DELETE /api/sales/:id`, veja no Swagger), mas a tela de Vendas ainda não a usa.

Se a API não estiver em `http://localhost:3000/api`, crie `doce-gestao/.env` a partir de `doce-gestao/.env.example` e ajuste `VITE_API_URL`.

## Scripts disponíveis

| Script | Para que serve |
| --- | --- |
| `npm run start:dev` | Sobe a API em modo desenvolvimento (recarrega ao salvar). |
| `npm run build` | Compila para `dist/`. |
| `npm run lint` / `npm run format` | Verifica e formata o código. |
| `npm test` / `npm run test:e2e` | Testes unitários / testes e2e. |
| `npm run migration:run` | Aplica as migrations pendentes. |
| `npm run migration:revert` | Desfaz a última migration. **Não use no banco compartilhado sem combinar com o time.** |
| `npm run migration:generate -- src/database/migrations/<Nome>` | Gera uma migration a partir das entidades. |
| `npm run seed:super-admin` | Cria o seu super admin, se ele ainda não existir. |
