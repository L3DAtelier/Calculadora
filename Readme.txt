Calculadora de Precos - L3D Atelier
Data da atualizacao: 24/04/2026

1. Objetivo
- Projeto React responsivo para desktop e celular.
- Cadastro de produtos, materiais, embalagens e marketplaces.
- Controle simples de estoque.
- Calculo de preco final com margem, energia, mao de obra, despesas fixas e taxas de plataforma.
- Orcamentos com persistencia local no navegador e opcao de sincronizacao remota.
- Exportacao e importacao de backup em JSON.
- Geracao de relatorio PDF do orcamento.
- Preparacao para PWA.
- Cadastro de fotos reais dos produtos.

2. Arquitetura atual
- Front-end: React 18 + TypeScript + Vite.
- Persistencia hibrida: localStorage + opcao de banco remoto Supabase/Postgres.
- Estilo: CSS proprio inspirado no layout apresentado do Bubble.
- Referencia funcional: espelho do site antigo apenas para entender regras de negocio.

3. Experiencia dos campos
- Campos com muitos itens relacionados agora usam popup pesquisavel.
- O popup lista os itens ja cadastrados e permite filtrar por nome.
- Quando o item nao existe, o proprio popup oferece a criacao rapida e ja seleciona o novo registro.
- Campos textuais recorrentes usam sugestoes automaticas por meio de listas anteriores do sistema.

4. Regras de calculo implementadas
- Custo de materiais por peca com base na quantidade de cada insumo.
- Custo de embalagem principal somado ao custo das embalagens recomendadas do produto.
- Mao de obra por hora + custo extra de acabamento/design.
- Energia por kWh consumido na variante.
- Rateio de despesas fixas mensais por hora produtiva.
- Preco final calculado considerando:
  custo base / (1 - comissao - taxa pagamento - despesa variavel - margem)
- Tarifa fixa por item com suporte a:
  teto de aplicacao,
  quantidade minima,
  comissao opcional sobre a tarifa,
  regras por faixa de preco.

5. Modulos entregues
- Dashboard
- Produtos
- Materiais
- Embalagens
- Taxas e canais
- Estoque
- Orcamentos
- Configuracoes globais
- Painel de sincronizacao com banco remoto
- Popup inteligente para selecao/criacao de itens
- Backup JSON
- Relatorio PDF
- PWA
- Fotos de produto com pasta publica dedicada

6. Banco remoto opcional
- Camada de persistencia remota: src/lib/storage.ts
- Script SQL inicial: supabase-schema.sql
- Modelo recomendado: Supabase com autenticacao por e-mail e RLS.
- Observacao importante: GitHub nao hospeda banco Postgres; o repositorio guarda apenas o codigo. O banco precisa ficar em um servico externo gratuito/gerenciado.

7. Analise de impacto desta versao
- Afeta os arquivos:
  index.html
  vite.config.ts
  tsconfig.node.json
  src/main.tsx
  src/App.tsx
  src/styles.css
  src/lib/storage.ts
  public/uploads/produtos/LEIA-ME.txt
  public/pwa-192x192.svg
  public/pwa-512x512.svg
  supabase-schema.sql
  Readme.txt
- Variaveis principais afetadas:
  configuracoes globais,
  listas de materiais,
  embalagens,
  marketplaces,
  produtos,
  orcamentos.
- Risco principal:
  modo de armazenamento,
  sessao autenticada da nuvem.
- Risco principal:
  sem configurar o Supabase, o sistema continua em modo local; a protecao remota depende da criacao do projeto e das credenciais locais.

8. Como executar
- Instalar dependencias:
  npm install
- Rodar em desenvolvimento:
  npm run dev
- Gerar build:
  npm run build
- Configurar banco remoto opcional:
  1. criar um arquivo .env na raiz do projeto
  2. preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
  3. executar o SQL de supabase-schema.sql no painel do Supabase
  4. usar a tela Configuracoes > Banco remoto para login e sincronizacao
- Fotos reais dos produtos:
  1. copiar as imagens para public/uploads/produtos
  2. informar o caminho no produto, por exemplo:
     /uploads/produtos/minha-foto.jpg
- Backup e restauracao:
  1. usar Configuracoes > Backup e restauracao
  2. exportar um JSON completo ou importar um arquivo salvo
- PDF:
  1. montar o orcamento
  2. usar o botao Gerar PDF no rodape do orcamento

9. Proximos passos recomendados
- Evoluir de JSON unico para tabelas relacionais de produtos, materiais, estoque e pedidos.
- Melhorar o upload de fotos com armazenamento automatico em bucket remoto.
- Criar testes automatizados para utilitarios de calculo e fluxo de orcamento.
- Adicionar tela de instalacao orientada do PWA e modo offline mais completo.
