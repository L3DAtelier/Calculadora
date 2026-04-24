export type Section =
  | "dashboard"
  | "produtos"
  | "materiais"
  | "embalagens"
  | "marketplaces"
  | "estoque"
  | "orcamentos"
  | "configuracoes";

export type Material = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedor: string;
};

export type Packaging = {
  id: string;
  nome: string;
  tipo: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
};

export type MarketplaceRule = {
  id: string;
  faixaDe: number;
  faixaAte: number | null;
  comissaoPct: number;
  tarifaFixa: number;
  tetoTarifa: number;
  cobrarComissaoSobreTarifa: boolean;
  quantidadeMinima: number;
};

export type Marketplace = {
  id: string;
  nome: string;
  tipo: string;
  comissaoPct: number;
  taxaPagamentoPct: number;
  despesaVariavelPct: number;
  tarifaFixa: number;
  tetoTarifa: number;
  cobrarComissaoSobreTarifa: boolean;
  quantidadeMinima: number;
  regras: MarketplaceRule[];
};

export type ProductMaterialUsage = {
  id: string;
  materialId: string;
  quantidade: number;
};

export type ProductPackagingOption = {
  id: string;
  packagingId: string;
  quantidade: number;
};

export type ProductVariant = {
  id: string;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  profundidadeMm: number;
  multiplicadorMaterial: number;
  horasProducao: number;
  consumoEnergiaKwh: number;
  custoExtra: number;
  margemSugeridaPct: number;
};

export type Product = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  destaque: string;
  ativo: boolean;
  imagemUrl: string;
  imagemNomeArquivo: string;
  materiais: ProductMaterialUsage[];
  embalagens: ProductPackagingOption[];
  variantes: ProductVariant[];
};

export type Settings = {
  nomeAtelier: string;
  custoHoraMaoDeObra: number;
  custoEnergiaKwh: number;
  despesasFixasMensais: number;
  horasProdutivasMensais: number;
  margemPadraoPct: number;
  custoDesignHora: number;
};

export type QuoteItem = {
  id: string;
  productId: string;
  variantId: string;
  marketplaceId: string;
  packagingId: string | null;
  quantidade: number;
  margemOverridePct: number | null;
  observacoes: string;
};

export type SavedQuote = {
  id: string;
  cliente: string;
  criadoEm: string;
  observacoes: string;
  itens: QuoteItem[];
};

export type AppState = {
  materiais: Material[];
  embalagens: Packaging[];
  marketplaces: Marketplace[];
  produtos: Product[];
  orcamentos: SavedQuote[];
  configuracoes: Settings;
};

export type PriceBreakdown = {
  custoMateriais: number;
  custoEmbalagem: number;
  custoMaoDeObra: number;
  custoEnergia: number;
  custoDespesasFixas: number;
  custoBase: number;
  margemPct: number;
  comissaoPct: number;
  taxaPagamentoPct: number;
  despesaVariavelPct: number;
  valorComissao: number;
  valorTaxaPagamento: number;
  valorDespesaVariavel: number;
  valorLucro: number;
  tarifaFixaAplicada: number;
  precoFinal: number;
  marketplaceNome: string;
  faixaAplicada: string;
};

export type PickerOption = {
  id: string;
  label: string;
  subtitle?: string;
};

export type BackupPayload = {
  version: string;
  exportedAt: string;
  source: string;
  data: AppState;
};
