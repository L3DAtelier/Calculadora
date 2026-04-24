# Estrutura do projeto Calculadora

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Enderecos atuais

- Local: http://localhost:5173/
- Rede: http://192.168.0.87:5173/

## Entregue

- SPA em React com layout responsivo inspirado no visual do Bubble.
- Dashboard, produtos, materiais, embalagens, taxas/canais, estoque, orcamentos e configuracoes.
- Logica de precificacao com materiais, embalagem, mao de obra, energia, despesas fixas, margem, comissao, taxa de pagamento e tarifa fixa por faixa.
- Popup pesquisavel para campos com muitos itens, com criacao rapida e reaproveitamento de cadastros existentes.
- Persistencia local e camada preparada para banco remoto Supabase/Postgres.
- Backup JSON para exportacao e importacao dos dados.
- Relatorio PDF do orcamento em andamento.
- PWA com manifest e service worker.
- Pasta publica para fotos reais dos produtos em `public/uploads/produtos`.

## Arquivos-chave

- `src/App.tsx`
- `src/styles.css`
- `src/main.tsx`
- `src/lib/storage.ts`
- `supabase-schema.sql`
- `public/uploads/produtos/LEIA-ME.txt`
- `public/pwa-192x192.svg`
- `public/pwa-512x512.svg`
- `package.json`
- `Readme.txt`

## Banco remoto

- GitHub nao hospeda banco de dados Postgres.
- O codigo foi preparado para uso com Supabase gratuito.
- Para ativar:

```bash
criar .env na raiz do projeto
preencher VITE_SUPABASE_URL
preencher VITE_SUPABASE_ANON_KEY
executar supabase-schema.sql
```

- Depois disso, use a tela `Configuracoes > Banco remoto` para login por e-mail e sincronizacao.

## Fotos de produtos

- Coloque as imagens reais em `public/uploads/produtos`.
- Informe no cadastro do produto um caminho como:

```text
/uploads/produtos/nome-da-foto.jpg
```

- O upload rapido do app tambem permite salvar a imagem na base atual do navegador.

## GitHub

- Repositorio local iniciado em `main`.
- Remoto configurado para `https://github.com/L3DAtelier/Calculadora.git`.
- Publicacao sugerida:

```bash
git add .
git commit -m "feat: calculadora de precos com backup, pdf, pwa e fotos"
git push -u origin main
```
