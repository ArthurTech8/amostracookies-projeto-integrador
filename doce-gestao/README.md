# Doce Gestão

Sistema web de gestão de confeitaria desenvolvido com **Vue 3 + TypeScript + Vite + Pinia**.

## Requisitos
- Node.js LTS (recomendado Node 20 ou superior)
- Visual Studio Code
- Internet na primeira instalação das dependências

## Como executar
1. Extraia o ZIP em uma pasta.
2. Abra a pasta `doce-gestao` no VS Code.
3. Abra o terminal integrado: **Terminal > Novo Terminal**.
4. Instale as dependências:

   ```bash
   npm install
   ```

5. Inicie o projeto:

   ```bash
   npm run dev
   ```

6. Abra no navegador o endereço mostrado pelo Vite (normalmente `http://localhost:5173`).

## Gerar versão de produção
```bash
npm run build
```
Os arquivos finais serão gerados na pasta `dist`.

## Funcionalidades
- Dashboard com filtros diário, semanal e mensal.
- Cadastro, edição, pesquisa e exclusão de produtos.
- Custo, preço, margem bruta e alerta de estoque mínimo.
- Entrada manual de estoque.
- Cadastro e histórico de despesas fixas e variáveis.
- Registro de vendas com carrinho, desconto e forma de pagamento.
- Baixa automática do estoque ao registrar uma venda.
- Exclusão de venda com devolução das unidades ao estoque.
- Relatórios financeiros, vendas por produto, despesas e estoque.
- Exportação de relatório em CSV.
- Dados persistidos no LocalStorage do navegador.

## Dados iniciais
O sistema já inicia com:
- Cupcake tradicional: custo de R$ 4,50 e preço de venda de R$ 8,00.
- Internet: R$ 120,00.
- Energia elétrica: R$ 230,00.
- Água: R$ 90,00.

O estoque inicial do cupcake é **zero**, pois a quantidade disponível não foi informada. Acesse **Produtos e estoque > Entrada de estoque** para informar a quantidade real antes de registrar vendas.

## Observações importantes
- Esta versão é frontend, sem servidor ou banco de dados. Os dados ficam no navegador e no perfil de usuário utilizado.
- Para não perder os dados, evite limpar os dados do site/navegador. Não há sincronização entre computadores.
- O lucro líquido é estimado com base no custo cadastrado de cada produto vendido e nas despesas lançadas no período. Impostos, taxas de cartão, pró-labore e outros custos devem ser cadastrados como despesas quando aplicáveis.
- As despesas iniciais são cadastradas com a data da primeira abertura do sistema. Para relatórios de meses anteriores, ajuste as datas dos lançamentos conforme necessário.

## Login e permissões por empresa

Defina `VITE_TENANT_BASE_DOMAIN=exemplo.test` para que o endereço
`amostra-cookies.exemplo.test` use `amostra-cookies` como código da empresa.
Sem um subdomínio reconhecido, informe o código manualmente. Se o frontend
e a API usarem origens diferentes, inclua a origem do frontend no
`CORS_ORIGIN` do backend.

Use um banco de desenvolvimento com as migrations aplicadas. Entre como
administrador da empresa para acessar **Equipe e acessos**. Funcionários
podem pedir acesso a módulos bloqueados. A aprovação concede operação
no módulo. A gerência também pode conceder somente visualização.

O painel registra vendas e despesas por autor e mostra novos registros de
cadastro e estoque após a migration. Registros antigos do navegador não
são importados automaticamente porque não possuem vínculo verificável com
uma empresa.
