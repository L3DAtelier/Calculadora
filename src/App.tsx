import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import {
  BadgeDollarSign,
  Box,
  Boxes,
  Calculator,
  CheckCircle2,
  ChevronsUpDown,
  Cloud,
  CloudOff,
  ClipboardList,
  Cog,
  Database,
  Download,
  DollarSign,
  Factory,
  LogIn,
  LogOut,
  PackagePlus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getCloudSessionInfo,
  getSavedStorageMode,
  isCloudConfigured,
  loadLocalSnapshot,
  pullCloudSnapshot,
  pushCloudSnapshot,
  saveLocalSnapshot,
  saveStorageMode,
  signInCloud,
  signOutCloud,
  subscribeToCloudAuth,
  type CloudSessionInfo,
  type StorageMode,
} from "./lib/storage";

type Section =
  | "dashboard"
  | "produtos"
  | "materiais"
  | "embalagens"
  | "marketplaces"
  | "estoque"
  | "orcamentos"
  | "configuracoes";

type Material = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedor: string;
};

type Packaging = {
  id: string;
  nome: string;
  tipo: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
};

type MarketplaceRule = {
  id: string;
  faixaDe: number;
  faixaAte: number | null;
  comissaoPct: number;
  tarifaFixa: number;
  tetoTarifa: number;
  cobrarComissaoSobreTarifa: boolean;
  quantidadeMinima: number;
};

type Marketplace = {
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

type ProductMaterialUsage = {
  id: string;
  materialId: string;
  quantidade: number;
};

type ProductPackagingOption = {
  id: string;
  packagingId: string;
  quantidade: number;
};

type ProductVariant = {
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

type Product = {
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

type Settings = {
  nomeAtelier: string;
  custoHoraMaoDeObra: number;
  custoEnergiaKwh: number;
  despesasFixasMensais: number;
  horasProdutivasMensais: number;
  margemPadraoPct: number;
  custoDesignHora: number;
};

type QuoteItem = {
  id: string;
  productId: string;
  variantId: string;
  marketplaceId: string;
  packagingId: string | null;
  quantidade: number;
  margemOverridePct: number | null;
  observacoes: string;
};

type SavedQuote = {
  id: string;
  cliente: string;
  criadoEm: string;
  observacoes: string;
  itens: QuoteItem[];
};

type AppState = {
  materiais: Material[];
  embalagens: Packaging[];
  marketplaces: Marketplace[];
  produtos: Product[];
  orcamentos: SavedQuote[];
  configuracoes: Settings;
};

type PriceBreakdown = {
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

type PickerOption = {
  id: string;
  label: string;
  subtitle?: string;
};

type BackupPayload = {
  version: string;
  exportedAt: string;
  source: string;
  data: AppState;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const navigationItems: Array<{
  id: Section;
  label: string;
  icon: typeof Calculator;
}> = [
  { id: "dashboard", label: "Dashboard", icon: Factory },
  { id: "produtos", label: "Produtos", icon: PackagePlus },
  { id: "materiais", label: "Materiais", icon: Boxes },
  { id: "embalagens", label: "Embalagens", icon: Box },
  { id: "marketplaces", label: "Taxas e canais", icon: Store },
  { id: "estoque", label: "Estoque", icon: ClipboardList },
  { id: "orcamentos", label: "Orcamentos", icon: BadgeDollarSign },
  { id: "configuracoes", label: "Configuracoes", icon: Cog },
];

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function asNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function uniqueSuggestions(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].sort(
    (left, right) => left.localeCompare(right, "pt-BR"),
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro nao identificado.";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}

function createDefaultAppState(): AppState {
  return {
    configuracoes: {
      nomeAtelier: "L3D Atelier",
      custoHoraMaoDeObra: 18,
      custoEnergiaKwh: 1.1,
      despesasFixasMensais: 1450,
      horasProdutivasMensais: 120,
      margemPadraoPct: 45,
      custoDesignHora: 14,
    },
    materiais: [
      {
        id: uid("mat"),
        nome: "Filamento PLA Branco",
        categoria: "Filamento",
        unidade: "g",
        custoUnitario: 0.16,
        estoqueAtual: 7200,
        estoqueMinimo: 1500,
        fornecedor: "Fornecedor PLA Premium",
      },
      {
        id: uid("mat"),
        nome: "Filamento PLA Rosa",
        categoria: "Filamento",
        unidade: "g",
        custoUnitario: 0.18,
        estoqueAtual: 4200,
        estoqueMinimo: 1200,
        fornecedor: "Fornecedor PLA Premium",
      },
      {
        id: uid("mat"),
        nome: "Filamento PLA Preto",
        categoria: "Filamento",
        unidade: "g",
        custoUnitario: 0.17,
        estoqueAtual: 5800,
        estoqueMinimo: 1500,
        fornecedor: "Fornecedor PLA Premium",
      },
      {
        id: uid("mat"),
        nome: "Kit LED RGB",
        categoria: "Eletronica",
        unidade: "un",
        custoUnitario: 11.9,
        estoqueAtual: 46,
        estoqueMinimo: 10,
        fornecedor: "Led Store",
      },
      {
        id: uid("mat"),
        nome: "Cola instantanea",
        categoria: "Acabamento",
        unidade: "ml",
        custoUnitario: 0.12,
        estoqueAtual: 980,
        estoqueMinimo: 200,
        fornecedor: "Casa do Artesao",
      },
    ],
    embalagens: [
      {
        id: uid("emb"),
        nome: "Caixa kraft media",
        tipo: "Envio",
        custoUnitario: 4.5,
        estoqueAtual: 85,
        estoqueMinimo: 15,
      },
      {
        id: uid("emb"),
        nome: "Caixa premium com visor",
        tipo: "Presente",
        custoUnitario: 8.9,
        estoqueAtual: 34,
        estoqueMinimo: 10,
      },
      {
        id: uid("emb"),
        nome: "Envelope bolha reforcado",
        tipo: "Protecao",
        custoUnitario: 2.4,
        estoqueAtual: 120,
        estoqueMinimo: 20,
      },
    ],
    marketplaces: [
      {
        id: uid("mk"),
        nome: "Venda direta",
        tipo: "WhatsApp / Instagram",
        comissaoPct: 0,
        taxaPagamentoPct: 2.99,
        despesaVariavelPct: 0,
        tarifaFixa: 0,
        tetoTarifa: 0,
        cobrarComissaoSobreTarifa: false,
        quantidadeMinima: 1,
        regras: [],
      },
      {
        id: uid("mk"),
        nome: "Shopee",
        tipo: "Marketplace",
        comissaoPct: 14,
        taxaPagamentoPct: 2,
        despesaVariavelPct: 1.5,
        tarifaFixa: 4,
        tetoTarifa: 79,
        cobrarComissaoSobreTarifa: false,
        quantidadeMinima: 1,
        regras: [],
      },
      {
        id: uid("mk"),
        nome: "Mercado Livre",
        tipo: "Marketplace",
        comissaoPct: 16.5,
        taxaPagamentoPct: 0,
        despesaVariavelPct: 1,
        tarifaFixa: 6.25,
        tetoTarifa: 79,
        cobrarComissaoSobreTarifa: false,
        quantidadeMinima: 1,
        regras: [],
      },
      {
        id: uid("mk"),
        nome: "Elo7",
        tipo: "Marketplace",
        comissaoPct: 18,
        taxaPagamentoPct: 0,
        despesaVariavelPct: 0.5,
        tarifaFixa: 0,
        tetoTarifa: 0,
        cobrarComissaoSobreTarifa: false,
        quantidadeMinima: 1,
        regras: [
          {
            id: uid("tier"),
            faixaDe: 0,
            faixaAte: 100,
            comissaoPct: 18,
            tarifaFixa: 3.5,
            tetoTarifa: 100,
            cobrarComissaoSobreTarifa: false,
            quantidadeMinima: 1,
          },
          {
            id: uid("tier"),
            faixaDe: 100.01,
            faixaAte: null,
            comissaoPct: 16.5,
            tarifaFixa: 0,
            tetoTarifa: 0,
            cobrarComissaoSobreTarifa: false,
            quantidadeMinima: 1,
          },
        ],
      },
    ],
    produtos: [],
    orcamentos: [],
  };
}

function getDefaultProductImage(productName: string): {
  imagemUrl: string;
  imagemNomeArquivo: string;
} {
  switch (productName) {
    case "Letra inicial porta maternidade":
      return {
        imagemUrl: "/uploads/produtos/Aurora.jpeg",
        imagemNomeArquivo: "Aurora.jpeg",
      };
    case "Nome em letra caixa com LED RGB":
      return {
        imagemUrl: "/uploads/produtos/Aurora RGB.png",
        imagemNomeArquivo: "Aurora RGB.png",
      };
    case "Escultura personalizada 3D":
      return {
        imagemUrl: "/uploads/produtos/O Viajante F.jpg",
        imagemNomeArquivo: "O Viajante F.jpg",
      };
    default:
      return {
        imagemUrl: "",
        imagemNomeArquivo: "",
      };
  }
}

function withDefaultProducts(base: AppState): AppState {
  if (base.produtos.length > 0) {
    return {
      ...base,
      produtos: base.produtos.map((product) => {
        const fallbackImage = getDefaultProductImage(product.nome);
        return {
          ...product,
          imagemUrl: product.imagemUrl || fallbackImage.imagemUrl,
          imagemNomeArquivo:
            product.imagemNomeArquivo || fallbackImage.imagemNomeArquivo,
        };
      }),
    };
  }

  const byName = (name: string) =>
    base.materiais.find((material) => material.nome === name)?.id ?? "";
  const packagingByName = (name: string) =>
    base.embalagens.find((packaging) => packaging.nome === name)?.id ?? "";

  return {
    ...base,
    produtos: [
      {
        id: uid("prd"),
        nome: "Letra inicial porta maternidade",
        categoria: "Porta maternidade",
        descricao:
          "Letra caixa decorada com nuvens, estrelas e balao, produzida em impressao 3D para porta maternidade.",
        destaque: "Mais vendido",
        ativo: true,
        ...getDefaultProductImage("Letra inicial porta maternidade"),
        materiais: [
          { id: uid("use"), materialId: byName("Filamento PLA Branco"), quantidade: 320 },
          { id: uid("use"), materialId: byName("Filamento PLA Rosa"), quantidade: 130 },
          { id: uid("use"), materialId: byName("Cola instantanea"), quantidade: 18 },
        ],
        embalagens: [
          { id: uid("pke"), packagingId: packagingByName("Caixa premium com visor"), quantidade: 1 },
          { id: uid("pke"), packagingId: packagingByName("Caixa kraft media"), quantidade: 1 },
        ],
        variantes: [
          {
            id: uid("var"),
            nome: "190 mm",
            larguraMm: 190,
            alturaMm: 250,
            profundidadeMm: 30,
            multiplicadorMaterial: 1,
            horasProducao: 5.8,
            consumoEnergiaKwh: 0.92,
            custoExtra: 10,
            margemSugeridaPct: 52,
          },
          {
            id: uid("var"),
            nome: "220 mm",
            larguraMm: 220,
            alturaMm: 280,
            profundidadeMm: 30,
            multiplicadorMaterial: 1.17,
            horasProducao: 6.7,
            consumoEnergiaKwh: 1.1,
            custoExtra: 12,
            margemSugeridaPct: 54,
          },
          {
            id: uid("var"),
            nome: "225 mm",
            larguraMm: 225,
            alturaMm: 290,
            profundidadeMm: 30,
            multiplicadorMaterial: 1.24,
            horasProducao: 7.4,
            consumoEnergiaKwh: 1.22,
            custoExtra: 14,
            margemSugeridaPct: 55,
          },
        ],
      },
      {
        id: uid("prd"),
        nome: "Nome em letra caixa com LED RGB",
        categoria: "Luminoso",
        descricao:
          "Nome personalizado em letra caixa com fundo preto, tampo branco e iluminacao RGB interna.",
        destaque: "Alto ticket",
        ativo: true,
        ...getDefaultProductImage("Nome em letra caixa com LED RGB"),
        materiais: [
          { id: uid("use"), materialId: byName("Filamento PLA Preto"), quantidade: 410 },
          { id: uid("use"), materialId: byName("Filamento PLA Branco"), quantidade: 280 },
          { id: uid("use"), materialId: byName("Kit LED RGB"), quantidade: 1 },
          { id: uid("use"), materialId: byName("Cola instantanea"), quantidade: 25 },
        ],
        embalagens: [
          { id: uid("pke"), packagingId: packagingByName("Caixa premium com visor"), quantidade: 1 },
          { id: uid("pke"), packagingId: packagingByName("Envelope bolha reforcado"), quantidade: 1 },
        ],
        variantes: [
          {
            id: uid("var"),
            nome: "190 mm",
            larguraMm: 190,
            alturaMm: 120,
            profundidadeMm: 45,
            multiplicadorMaterial: 1,
            horasProducao: 7.2,
            consumoEnergiaKwh: 1.54,
            custoExtra: 18,
            margemSugeridaPct: 58,
          },
          {
            id: uid("var"),
            nome: "220 mm",
            larguraMm: 220,
            alturaMm: 140,
            profundidadeMm: 45,
            multiplicadorMaterial: 1.2,
            horasProducao: 8.6,
            consumoEnergiaKwh: 1.82,
            custoExtra: 21,
            margemSugeridaPct: 60,
          },
          {
            id: uid("var"),
            nome: "225 mm",
            larguraMm: 225,
            alturaMm: 150,
            profundidadeMm: 45,
            multiplicadorMaterial: 1.28,
            horasProducao: 9.1,
            consumoEnergiaKwh: 1.96,
            custoExtra: 22,
            margemSugeridaPct: 60,
          },
        ],
      },
      {
        id: uid("prd"),
        nome: "Escultura personalizada 3D",
        categoria: "Esculturas",
        descricao:
          "Escultura ou busto personalizado com acabamento manual e composicao por partes.",
        destaque: "Sob encomenda",
        ativo: true,
        ...getDefaultProductImage("Escultura personalizada 3D"),
        materiais: [
          { id: uid("use"), materialId: byName("Filamento PLA Branco"), quantidade: 520 },
          { id: uid("use"), materialId: byName("Cola instantanea"), quantidade: 30 },
        ],
        embalagens: [
          { id: uid("pke"), packagingId: packagingByName("Caixa kraft media"), quantidade: 1 },
          { id: uid("pke"), packagingId: packagingByName("Envelope bolha reforcado"), quantidade: 2 },
        ],
        variantes: [
          {
            id: uid("var"),
            nome: "190 mm",
            larguraMm: 120,
            alturaMm: 190,
            profundidadeMm: 90,
            multiplicadorMaterial: 1,
            horasProducao: 8.4,
            consumoEnergiaKwh: 1.68,
            custoExtra: 28,
            margemSugeridaPct: 62,
          },
          {
            id: uid("var"),
            nome: "220 mm",
            larguraMm: 140,
            alturaMm: 220,
            profundidadeMm: 110,
            multiplicadorMaterial: 1.23,
            horasProducao: 10.2,
            consumoEnergiaKwh: 2.12,
            custoExtra: 34,
            margemSugeridaPct: 64,
          },
          {
            id: uid("var"),
            nome: "225 mm",
            larguraMm: 145,
            alturaMm: 225,
            profundidadeMm: 115,
            multiplicadorMaterial: 1.3,
            horasProducao: 10.8,
            consumoEnergiaKwh: 2.2,
            custoExtra: 36,
            margemSugeridaPct: 64,
          },
        ],
      },
    ],
  };
}

function resolveRateForPrice(
  marketplace: Marketplace,
  price: number,
): {
  regra: MarketplaceRule | null;
  comissaoPct: number;
  tarifaFixa: number;
  tetoTarifa: number;
  cobrarComissaoSobreTarifa: boolean;
  quantidadeMinima: number;
} {
  const regra =
    marketplace.regras.find((item) => {
      const inRange = price >= item.faixaDe;
      const withinMax = item.faixaAte === null || price <= item.faixaAte;
      return inRange && withinMax;
    }) ?? null;

  return {
    regra,
    comissaoPct: regra?.comissaoPct ?? marketplace.comissaoPct,
    tarifaFixa: regra?.tarifaFixa ?? marketplace.tarifaFixa,
    tetoTarifa: regra?.tetoTarifa ?? marketplace.tetoTarifa,
    cobrarComissaoSobreTarifa:
      regra?.cobrarComissaoSobreTarifa ?? marketplace.cobrarComissaoSobreTarifa,
    quantidadeMinima: Math.max(
      1,
      regra?.quantidadeMinima ?? marketplace.quantidadeMinima,
    ),
  };
}

// Calcula o preco final por peca com base nos custos, taxas do canal e margem desejada.
function calculatePrice({
  product,
  variant,
  packaging,
  marketplace,
  materiais,
  embalagens,
  settings,
  marginOverridePct,
}: {
  product: Product;
  variant: ProductVariant;
  packaging: Packaging | null;
  marketplace: Marketplace;
  materiais: Material[];
  embalagens: Packaging[];
  settings: Settings;
  marginOverridePct: number | null;
}): PriceBreakdown {
  const custoMateriais = product.materiais.reduce((total, usage) => {
    const material = materiais.find((item) => item.id === usage.materialId);
    if (!material) {
      return total;
    }
    return total + usage.quantidade * variant.multiplicadorMaterial * material.custoUnitario;
  }, 0);

  const custoEmbalagemBase = product.embalagens.reduce((total, option) => {
    const item = embalagens.find((pack) => pack.id === option.packagingId);
    if (!item) {
      return total;
    }
    return total + item.custoUnitario * option.quantidade;
  }, 0);

  const custoEmbalagem = packaging ? custoEmbalagemBase + packaging.custoUnitario : custoEmbalagemBase;
  const custoMaoDeObra =
    variant.horasProducao * settings.custoHoraMaoDeObra +
    variant.custoExtra +
    settings.custoDesignHora * 0.35;
  const custoEnergia = variant.consumoEnergiaKwh * settings.custoEnergiaKwh;
  const custoDespesasFixas =
    (settings.despesasFixasMensais / Math.max(settings.horasProdutivasMensais, 1)) *
    variant.horasProducao;
  const custoBase =
    custoMateriais +
    custoEmbalagem +
    custoMaoDeObra +
    custoEnergia +
    custoDespesasFixas;

  const margemPct = (marginOverridePct ?? variant.margemSugeridaPct ?? settings.margemPadraoPct) / 100;
  const taxaPagamentoPct = marketplace.taxaPagamentoPct / 100;
  const despesaVariavelPct = marketplace.despesaVariavelPct / 100;

  let precoAtual = custoBase / Math.max(1 - (marketplace.comissaoPct / 100 + taxaPagamentoPct + despesaVariavelPct + margemPct), 0.01);
  let tarifaFixaAplicada = 0;
  let comissaoPct = marketplace.comissaoPct / 100;
  let faixaAplicada = "Taxa base";

  for (let index = 0; index < 6; index += 1) {
    const resolved = resolveRateForPrice(marketplace, precoAtual);
    comissaoPct = resolved.comissaoPct / 100;
    faixaAplicada = resolved.regra
      ? `${formatMoney(resolved.regra.faixaDe)} ate ${
          resolved.regra.faixaAte === null ? "acima" : formatMoney(resolved.regra.faixaAte)
        }`
      : "Taxa base";

    const denominadorBase = Math.max(
      1 - (comissaoPct + taxaPagamentoPct + despesaVariavelPct + margemPct),
      0.01,
    );

    let novaTarifa = 0;
    const tarifaPorUnidade = resolved.tarifaFixa / resolved.quantidadeMinima;
    const tarifaElegivel =
      tarifaPorUnidade > 0 &&
      (resolved.tetoTarifa <= 0 || precoAtual <= resolved.tetoTarifa);

    if (tarifaElegivel) {
      const denominadorTarifa = resolved.cobrarComissaoSobreTarifa
        ? denominadorBase
        : Math.max(1 - (taxaPagamentoPct + despesaVariavelPct + margemPct), 0.01);
      novaTarifa = tarifaPorUnidade / denominadorTarifa;
    }

    const novoPreco = custoBase / denominadorBase + novaTarifa;

    if (tarifaElegivel && resolved.tetoTarifa > 0 && novoPreco > resolved.tetoTarifa) {
      precoAtual = resolved.tetoTarifa + 0.01;
      tarifaFixaAplicada = 0;
      continue;
    }

    tarifaFixaAplicada = tarifaElegivel ? tarifaPorUnidade : 0;

    if (Math.abs(novoPreco - precoAtual) < 0.02) {
      precoAtual = novoPreco;
      break;
    }

    precoAtual = novoPreco;
  }

  const baseComissao = tarifaFixaAplicada > 0 && !marketplace.cobrarComissaoSobreTarifa
    ? Math.max(precoAtual - tarifaFixaAplicada, 0)
    : precoAtual;
  const valorComissao = baseComissao * comissaoPct;
  const valorTaxaPagamento = precoAtual * taxaPagamentoPct;
  const valorDespesaVariavel = precoAtual * despesaVariavelPct;
  const valorLucro = precoAtual * margemPct;

  return {
    custoMateriais,
    custoEmbalagem,
    custoMaoDeObra,
    custoEnergia,
    custoDespesasFixas,
    custoBase,
    margemPct,
    comissaoPct,
    taxaPagamentoPct,
    despesaVariavelPct,
    valorComissao,
    valorTaxaPagamento,
    valorDespesaVariavel,
    valorLucro,
    tarifaFixaAplicada,
    precoFinal: precoAtual,
    marketplaceNome: marketplace.nome,
    faixaAplicada,
  };
}

function App(): JSX.Element {
  const cloudConfigured = isCloudConfigured();
  const [appState, setAppState] = useState<AppState>(() =>
    withDefaultProducts(loadLocalSnapshot(createDefaultAppState())),
  );
  const [section, setSection] = useState<Section>("dashboard");
  const [productSearch, setProductSearch] = useState("");
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [storageMode, setStorageMode] = useState<StorageMode>(() => getSavedStorageMode());
  const [cloudInfo, setCloudInfo] = useState<CloudSessionInfo>({
    configured: cloudConfigured,
    email: null,
    userId: null,
  });
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudStatus, setCloudStatus] = useState(
    cloudConfigured
      ? "Banco remoto disponivel. Entre com seu e-mail para sincronizar."
      : "Banco remoto ainda nao configurado. Use o arquivo .env local para ativar o Supabase.",
  );
  const [cloudHydrated, setCloudHydrated] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [backupStatus, setBackupStatus] = useState(
    "Exporte uma copia em JSON ou importe um backup para recuperar os dados do sistema.",
  );
  const [currentQuote, setCurrentQuote] = useState<SavedQuote>({
    id: uid("orc"),
    cliente: "",
    criadoEm: new Date().toISOString(),
    observacoes: "",
    itens: [],
  });
  const [quoteDraft, setQuoteDraft] = useState<QuoteItem>({
    id: uid("item"),
    productId: "",
    variantId: "",
    marketplaceId: "",
    packagingId: null,
    quantidade: 1,
    margemOverridePct: null,
    observacoes: "",
  });

  useEffect(() => {
    saveLocalSnapshot(appState);
  }, [appState]);

  useEffect(() => {
    saveStorageMode(storageMode);
  }, [storageMode]);

  useEffect(() => {
    let active = true;

    getCloudSessionInfo()
      .then((info) => {
        if (active) {
          setCloudInfo(info);
        }
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToCloudAuth((info) => {
      setCloudInfo(info);

      if (!info.userId) {
        setCloudHydrated(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (storageMode !== "cloud") {
      setCloudHydrated(false);
      return;
    }

    if (!cloudConfigured) {
      setCloudStatus("Supabase ainda nao configurado. Preencha .env local antes de usar a nuvem.");
      return;
    }

    if (!cloudInfo.userId) {
      setCloudStatus("Entre com seu e-mail para carregar e gravar os dados na nuvem.");
      return;
    }

    let cancelled = false;

    async function hydrateFromCloud(): Promise<void> {
      setCloudBusy(true);
      setCloudStatus("Carregando dados da nuvem...");

      try {
        const snapshot = await pullCloudSnapshot<AppState>();
        if (cancelled) {
          return;
        }

        if (snapshot) {
          const hydratedState = withDefaultProducts(snapshot);
          setAppState(hydratedState);
          setSelectedProductId((current) => current || hydratedState.produtos[0]?.id || "");
          setCloudStatus("Dados carregados da nuvem com sucesso.");
        } else {
          setCloudStatus("Nenhum registro remoto encontrado. O primeiro salvamento criara sua base.");
        }

        setCloudHydrated(true);
      } catch (error) {
        if (!cancelled) {
          setCloudStatus(`Falha ao carregar a nuvem: ${getErrorMessage(error)}`);
        }
      } finally {
        if (!cancelled) {
          setCloudBusy(false);
        }
      }
    }

    hydrateFromCloud().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [cloudConfigured, cloudInfo.userId, storageMode]);

  useEffect(() => {
    if (storageMode !== "cloud" || !cloudInfo.userId || !cloudHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCloudBusy(true);
      pushCloudSnapshot(appState)
        .then(() => {
          setCloudStatus(
            `Dados sincronizados com a nuvem${cloudInfo.email ? ` para ${cloudInfo.email}` : ""}.`,
          );
        })
        .catch((error) => {
          setCloudStatus(`Falha ao salvar na nuvem: ${getErrorMessage(error)}`);
        })
        .finally(() => {
          setCloudBusy(false);
        });
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appState, cloudHydrated, cloudInfo.email, cloudInfo.userId, storageMode]);

  useEffect(() => {
    if (!selectedProductId && appState.produtos[0]) {
      setSelectedProductId(appState.produtos[0].id);
    }
  }, [appState.produtos, selectedProductId]);

  useEffect(() => {
    const firstProduct = appState.produtos[0];
    const firstVariant = firstProduct?.variantes[0];
    const firstMarketplace = appState.marketplaces[0];
    const firstPackaging = firstProduct?.embalagens[0];
    if (!quoteDraft.productId && firstProduct && firstVariant && firstMarketplace) {
      setQuoteDraft((previous) => ({
        ...previous,
        productId: firstProduct.id,
        variantId: firstVariant.id,
        marketplaceId: firstMarketplace.id,
        packagingId: firstPackaging?.packagingId ?? null,
      }));
    }
  }, [appState.marketplaces, appState.produtos, quoteDraft.productId]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) {
      return appState.produtos;
    }
    return appState.produtos.filter((product) => {
      const haystack = `${product.nome} ${product.categoria} ${product.descricao}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [appState.produtos, productSearch]);

  const selectedProduct = useMemo(
    () => appState.produtos.find((product) => product.id === selectedProductId) ?? null,
    [appState.produtos, selectedProductId],
  );

  const quickQuotePreview = useMemo(() => {
    const product = appState.produtos.find((item) => item.id === quoteDraft.productId);
    const variant = product?.variantes.find((item) => item.id === quoteDraft.variantId);
    const marketplace = appState.marketplaces.find((item) => item.id === quoteDraft.marketplaceId);
    const packaging = quoteDraft.packagingId
      ? appState.embalagens.find((item) => item.id === quoteDraft.packagingId) ?? null
      : null;

    if (!product || !variant || !marketplace) {
      return null;
    }

    return calculatePrice({
      product,
      variant,
      packaging,
      marketplace,
      materiais: appState.materiais,
      embalagens: appState.embalagens,
      settings: appState.configuracoes,
      marginOverridePct: quoteDraft.margemOverridePct,
    });
  }, [appState, quoteDraft]);

  const dashboardStats = useMemo(() => {
    const produtosAtivos = appState.produtos.filter((product) => product.ativo).length;
    const totalMateriais = appState.materiais.length;
    const itensBaixoEstoque =
      appState.materiais.filter((item) => item.estoqueAtual <= item.estoqueMinimo).length +
      appState.embalagens.filter((item) => item.estoqueAtual <= item.estoqueMinimo).length;

    const precosCalculados = appState.produtos.flatMap((product) =>
      product.variantes.flatMap((variant) => {
        const marketplace = appState.marketplaces[0];
        if (!marketplace) {
          return [];
        }
        return [
          calculatePrice({
            product,
            variant,
            packaging: null,
            marketplace,
            materiais: appState.materiais,
            embalagens: appState.embalagens,
            settings: appState.configuracoes,
            marginOverridePct: null,
          }).precoFinal,
        ];
      }),
    );

    const precoMedio =
      precosCalculados.length > 0
        ? precosCalculados.reduce((sum, value) => sum + value, 0) / precosCalculados.length
        : 0;

    return {
      produtosAtivos,
      totalMateriais,
      itensBaixoEstoque,
      precoMedio,
    };
  }, [appState]);

  const productCategorySuggestions = useMemo(
    () => uniqueSuggestions(appState.produtos.map((item) => item.categoria)),
    [appState.produtos],
  );
  const productHighlightSuggestions = useMemo(
    () => uniqueSuggestions(appState.produtos.map((item) => item.destaque)),
    [appState.produtos],
  );
  const materialCategorySuggestions = useMemo(
    () => uniqueSuggestions(appState.materiais.map((item) => item.categoria)),
    [appState.materiais],
  );
  const materialSupplierSuggestions = useMemo(
    () => uniqueSuggestions(appState.materiais.map((item) => item.fornecedor)),
    [appState.materiais],
  );
  const packagingTypeSuggestions = useMemo(
    () => uniqueSuggestions(appState.embalagens.map((item) => item.tipo)),
    [appState.embalagens],
  );
  const marketplaceTypeSuggestions = useMemo(
    () => uniqueSuggestions(appState.marketplaces.map((item) => item.tipo)),
    [appState.marketplaces],
  );
  const productPickerOptions = useMemo(
    () =>
      appState.produtos.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: item.categoria,
      })),
    [appState.produtos],
  );
  const materialPickerOptions = useMemo(
    () =>
      appState.materiais.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: `${item.categoria} | ${item.unidade}`,
      })),
    [appState.materiais],
  );
  const packagingPickerOptions = useMemo(
    () =>
      appState.embalagens.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: `${item.tipo} | ${formatMoney(item.custoUnitario)}`,
      })),
    [appState.embalagens],
  );
  const marketplacePickerOptions = useMemo(
    () =>
      appState.marketplaces.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: `${item.tipo} | comissao ${formatPercent(item.comissaoPct)}`,
      })),
    [appState.marketplaces],
  );

  function updateState(updater: (previous: AppState) => AppState): void {
    setAppState((previous) => updater(previous));
  }

  function updateMaterial(id: string, patch: Partial<Material>): void {
    updateState((previous) => ({
      ...previous,
      materiais: previous.materiais.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addMaterial(): void {
    updateState((previous) => ({
      ...previous,
      materiais: [
        ...previous.materiais,
        {
          id: uid("mat"),
          nome: "Novo material",
          categoria: "Categoria",
          unidade: "g",
          custoUnitario: 0,
          estoqueAtual: 0,
          estoqueMinimo: 0,
          fornecedor: "",
        },
      ],
    }));
  }

  function createMaterialFromName(name: string): string {
    const normalized = normalizeText(name);
    const existing = appState.materiais.find((item) => normalizeText(item.nome) === normalized);
    if (existing) {
      return existing.id;
    }

    const id = uid("mat");
    updateState((previous) => ({
      ...previous,
      materiais: [
        ...previous.materiais,
        {
          id,
          nome: name.trim(),
          categoria: "Categoria",
          unidade: "g",
          custoUnitario: 0,
          estoqueAtual: 0,
          estoqueMinimo: 0,
          fornecedor: "",
        },
      ],
    }));
    return id;
  }

  function removeMaterial(id: string): void {
    updateState((previous) => ({
      ...previous,
      materiais: previous.materiais.filter((item) => item.id !== id),
      produtos: previous.produtos.map((product) => ({
        ...product,
        materiais: product.materiais.filter((usage) => usage.materialId !== id),
      })),
    }));
  }

  function updatePackaging(id: string, patch: Partial<Packaging>): void {
    updateState((previous) => ({
      ...previous,
      embalagens: previous.embalagens.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addPackaging(): void {
    updateState((previous) => ({
      ...previous,
      embalagens: [
        ...previous.embalagens,
        {
          id: uid("emb"),
          nome: "Nova embalagem",
          tipo: "Envio",
          custoUnitario: 0,
          estoqueAtual: 0,
          estoqueMinimo: 0,
        },
      ],
    }));
  }

  function createPackagingFromName(name: string): string {
    const normalized = normalizeText(name);
    const existing = appState.embalagens.find((item) => normalizeText(item.nome) === normalized);
    if (existing) {
      return existing.id;
    }

    const id = uid("emb");
    updateState((previous) => ({
      ...previous,
      embalagens: [
        ...previous.embalagens,
        {
          id,
          nome: name.trim(),
          tipo: "Envio",
          custoUnitario: 0,
          estoqueAtual: 0,
          estoqueMinimo: 0,
        },
      ],
    }));
    return id;
  }

  function removePackaging(id: string): void {
    updateState((previous) => ({
      ...previous,
      embalagens: previous.embalagens.filter((item) => item.id !== id),
      produtos: previous.produtos.map((product) => ({
        ...product,
        embalagens: product.embalagens.filter((option) => option.packagingId !== id),
      })),
    }));
  }

  function updateMarketplace(id: string, patch: Partial<Marketplace>): void {
    updateState((previous) => ({
      ...previous,
      marketplaces: previous.marketplaces.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addMarketplace(): void {
    updateState((previous) => ({
      ...previous,
      marketplaces: [
        ...previous.marketplaces,
        {
          id: uid("mk"),
          nome: "Novo canal",
          tipo: "Marketplace",
          comissaoPct: 0,
          taxaPagamentoPct: 0,
          despesaVariavelPct: 0,
          tarifaFixa: 0,
          tetoTarifa: 0,
          cobrarComissaoSobreTarifa: false,
          quantidadeMinima: 1,
          regras: [],
        },
      ],
    }));
  }

  function createMarketplaceFromName(name: string): string {
    const normalized = normalizeText(name);
    const existing = appState.marketplaces.find(
      (item) => normalizeText(item.nome) === normalized,
    );
    if (existing) {
      return existing.id;
    }

    const id = uid("mk");
    updateState((previous) => ({
      ...previous,
      marketplaces: [
        ...previous.marketplaces,
        {
          id,
          nome: name.trim(),
          tipo: "Marketplace",
          comissaoPct: 0,
          taxaPagamentoPct: 0,
          despesaVariavelPct: 0,
          tarifaFixa: 0,
          tetoTarifa: 0,
          cobrarComissaoSobreTarifa: false,
          quantidadeMinima: 1,
          regras: [],
        },
      ],
    }));
    return id;
  }

  function removeMarketplace(id: string): void {
    updateState((previous) => ({
      ...previous,
      marketplaces: previous.marketplaces.filter((item) => item.id !== id),
    }));
  }

  function updateMarketplaceRule(
    marketplaceId: string,
    ruleId: string,
    patch: Partial<MarketplaceRule>,
  ): void {
    updateState((previous) => ({
      ...previous,
      marketplaces: previous.marketplaces.map((item) =>
        item.id === marketplaceId
          ? {
              ...item,
              regras: item.regras.map((rule) =>
                rule.id === ruleId ? { ...rule, ...patch } : rule,
              ),
            }
          : item,
      ),
    }));
  }

  function addMarketplaceRule(marketplaceId: string): void {
    updateState((previous) => ({
      ...previous,
      marketplaces: previous.marketplaces.map((item) =>
        item.id === marketplaceId
          ? {
              ...item,
              regras: [
                ...item.regras,
                {
                  id: uid("tier"),
                  faixaDe: 0,
                  faixaAte: null,
                  comissaoPct: item.comissaoPct,
                  tarifaFixa: item.tarifaFixa,
                  tetoTarifa: item.tetoTarifa,
                  cobrarComissaoSobreTarifa: item.cobrarComissaoSobreTarifa,
                  quantidadeMinima: item.quantidadeMinima,
                },
              ],
            }
          : item,
      ),
    }));
  }

  function removeMarketplaceRule(marketplaceId: string, ruleId: string): void {
    updateState((previous) => ({
      ...previous,
      marketplaces: previous.marketplaces.map((item) =>
        item.id === marketplaceId
          ? { ...item, regras: item.regras.filter((rule) => rule.id !== ruleId) }
          : item,
      ),
    }));
  }

  function updateProduct(id: string, patch: Partial<Product>): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addProduct(): void {
    const productId = uid("prd");
    const novoProduto: Product = {
      id: productId,
      nome: "Novo produto",
      categoria: "Categoria",
      descricao: "",
      destaque: "Novo",
      ativo: true,
      imagemUrl: "",
      imagemNomeArquivo: "",
      materiais: [],
      embalagens: [],
      variantes: [
        {
          id: uid("var"),
          nome: "190 mm",
          larguraMm: 190,
          alturaMm: 190,
          profundidadeMm: 30,
          multiplicadorMaterial: 1,
          horasProducao: 1,
          consumoEnergiaKwh: 0.5,
          custoExtra: 0,
          margemSugeridaPct: appState.configuracoes.margemPadraoPct,
        },
      ],
    };

    updateState((previous) => ({
      ...previous,
      produtos: [...previous.produtos, novoProduto],
    }));
    setSelectedProductId(productId);
  }

  function createProductFromName(name: string): string {
    const normalized = normalizeText(name);
    const existing = appState.produtos.find((item) => normalizeText(item.nome) === normalized);
    if (existing) {
      return existing.id;
    }

    const id = uid("prd");
    const newProduct: Product = {
      id,
      nome: name.trim(),
      categoria: "Categoria",
      descricao: "",
      destaque: "Novo",
      ativo: true,
      imagemUrl: "",
      imagemNomeArquivo: "",
      materiais: [],
      embalagens: [],
      variantes: [
        {
          id: uid("var"),
          nome: "190 mm",
          larguraMm: 190,
          alturaMm: 190,
          profundidadeMm: 30,
          multiplicadorMaterial: 1,
          horasProducao: 1,
          consumoEnergiaKwh: 0.5,
          custoExtra: 0,
          margemSugeridaPct: appState.configuracoes.margemPadraoPct,
        },
      ],
    };

    updateState((previous) => ({
      ...previous,
      produtos: [...previous.produtos, newProduct],
    }));
    return id;
  }

  function removeProduct(id: string): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.filter((item) => item.id !== id),
    }));

    if (selectedProductId === id) {
      setSelectedProductId(appState.produtos.find((item) => item.id !== id)?.id ?? "");
    }
  }

  function updateProductVariant(
    productId: string,
    variantId: string,
    patch: Partial<ProductVariant>,
  ): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              variantes: item.variantes.map((variant) =>
                variant.id === variantId ? { ...variant, ...patch } : variant,
              ),
            }
          : item,
      ),
    }));
  }

  function addProductVariant(productId: string): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              variantes: [
                ...item.variantes,
                {
                  id: uid("var"),
                  nome: "Nova medida",
                  larguraMm: 190,
                  alturaMm: 190,
                  profundidadeMm: 30,
                  multiplicadorMaterial: 1,
                  horasProducao: 1,
                  consumoEnergiaKwh: 0.5,
                  custoExtra: 0,
                  margemSugeridaPct: appState.configuracoes.margemPadraoPct,
                },
              ],
            }
          : item,
      ),
    }));
  }

  function removeProductVariant(productId: string, variantId: string): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              variantes: item.variantes.filter((variant) => variant.id !== variantId),
            }
          : item,
      ),
    }));
  }

  function updateProductUsage(
    productId: string,
    usageId: string,
    patch: Partial<ProductMaterialUsage>,
  ): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              materiais: item.materiais.map((usage) =>
                usage.id === usageId ? { ...usage, ...patch } : usage,
              ),
            }
          : item,
      ),
    }));
  }

  function addProductUsage(productId: string): void {
    const firstMaterial = appState.materiais[0];
    if (!firstMaterial) {
      return;
    }

    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              materiais: [
                ...item.materiais,
                {
                  id: uid("use"),
                  materialId: firstMaterial.id,
                  quantidade: 0,
                },
              ],
            }
          : item,
      ),
    }));
  }

  function removeProductUsage(productId: string, usageId: string): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              materiais: item.materiais.filter((usage) => usage.id !== usageId),
            }
          : item,
      ),
    }));
  }

  function updateProductPackagingOption(
    productId: string,
    optionId: string,
    patch: Partial<ProductPackagingOption>,
  ): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              embalagens: item.embalagens.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : item,
      ),
    }));
  }

  function addProductPackagingOption(productId: string): void {
    const firstPackaging = appState.embalagens[0];
    if (!firstPackaging) {
      return;
    }

    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              embalagens: [
                ...item.embalagens,
                {
                  id: uid("pke"),
                  packagingId: firstPackaging.id,
                  quantidade: 1,
                },
              ],
            }
          : item,
      ),
    }));
  }

  function removeProductPackagingOption(productId: string, optionId: string): void {
    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.map((item) =>
        item.id === productId
          ? {
              ...item,
              embalagens: item.embalagens.filter((option) => option.id !== optionId),
            }
          : item,
      ),
    }));
  }

  function updateSettings(patch: Partial<Settings>): void {
    updateState((previous) => ({
      ...previous,
      configuracoes: { ...previous.configuracoes, ...patch },
    }));
  }

  function addQuoteItem(): void {
    if (!quoteDraft.productId || !quoteDraft.variantId || !quoteDraft.marketplaceId) {
      return;
    }
    setCurrentQuote((previous) => ({
      ...previous,
      itens: [...previous.itens, { ...quoteDraft, id: uid("item") }],
    }));
  }

  function removeQuoteItem(itemId: string): void {
    setCurrentQuote((previous) => ({
      ...previous,
      itens: previous.itens.filter((item) => item.id !== itemId),
    }));
  }

  function saveQuote(): void {
    if (currentQuote.itens.length === 0) {
      return;
    }

    updateState((previous) => ({
      ...previous,
      orcamentos: [
        {
          ...currentQuote,
          id: uid("orc"),
          criadoEm: new Date().toISOString(),
        },
        ...previous.orcamentos,
      ],
    }));

    setCurrentQuote({
      id: uid("orc"),
      cliente: "",
      criadoEm: new Date().toISOString(),
      observacoes: "",
      itens: [],
    });
  }

  async function handleCloudSignIn(): Promise<void> {
    if (!cloudEmail.trim()) {
      setCloudStatus("Informe um e-mail valido para receber o link de acesso.");
      return;
    }

    setCloudBusy(true);
    try {
      await signInCloud(cloudEmail.trim());
      setCloudStatus("Link magico enviado. Abra o e-mail e volte para este sistema.");
    } catch (error) {
      setCloudStatus(`Falha ao enviar o link: ${getErrorMessage(error)}`);
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleCloudPullNow(): Promise<void> {
    if (!cloudInfo.userId) {
      setCloudStatus("Entre na nuvem antes de importar os dados do banco.");
      return;
    }

    setCloudBusy(true);
    try {
      const snapshot = await pullCloudSnapshot<AppState>();
      if (snapshot) {
        const hydratedState = withDefaultProducts(snapshot);
        setAppState(hydratedState);
        setSelectedProductId(hydratedState.produtos[0]?.id ?? "");
        setCloudHydrated(true);
        setCloudStatus("Dados remotos importados com sucesso.");
      } else {
        setCloudStatus("Ainda nao existe base remota para esse usuario.");
      }
    } catch (error) {
      setCloudStatus(`Falha ao importar da nuvem: ${getErrorMessage(error)}`);
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleCloudPushNow(): Promise<void> {
    if (!cloudInfo.userId) {
      setCloudStatus("Entre na nuvem antes de salvar no banco.");
      return;
    }

    setCloudBusy(true);
    try {
      await pushCloudSnapshot(appState);
      setCloudHydrated(true);
      setCloudStatus("Dados enviados manualmente para a nuvem.");
    } catch (error) {
      setCloudStatus(`Falha ao enviar para a nuvem: ${getErrorMessage(error)}`);
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleCloudSignOut(): Promise<void> {
    setCloudBusy(true);
    try {
      await signOutCloud();
      setStorageMode("local");
      setCloudStatus("Sessao da nuvem encerrada. O app voltou ao modo local.");
    } catch (error) {
      setCloudStatus(`Falha ao sair da nuvem: ${getErrorMessage(error)}`);
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleProductImageUpload(
    productId: string,
    file: File | null,
  ): Promise<void> {
    if (!file) {
      return;
    }

    try {
      const imageUrl = await fileToDataUrl(file);
      updateProduct(productId, {
        imagemUrl: imageUrl,
        imagemNomeArquivo: file.name,
      });
    } catch (error) {
      setBackupStatus(`Falha ao carregar a imagem: ${getErrorMessage(error)}`);
    }
  }

  function clearProductImage(productId: string): void {
    updateProduct(productId, {
      imagemUrl: "",
      imagemNomeArquivo: "",
    });
  }

  function handleExportBackup(): void {
    const payload: BackupPayload = {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      source: "Calculadora de Precos - L3D Atelier",
      data: appState,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateLabel = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `backup-calculadora-precos-${dateLabel}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setBackupStatus("Backup JSON exportado com sucesso.");
  }

  async function handleImportBackup(file: File | null): Promise<void> {
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as BackupPayload | AppState;
      const importedState =
        "data" in parsed ? withDefaultProducts(parsed.data) : withDefaultProducts(parsed);
      setAppState(importedState);
      setSelectedProductId(importedState.produtos[0]?.id ?? "");
      setBackupStatus(`Backup importado com sucesso a partir de ${file.name}.`);
    } catch (error) {
      setBackupStatus(`Falha ao importar backup: ${getErrorMessage(error)}`);
    }
  }

  function handleExportQuotePdf(): void {
    if (quoteTotals.linhas.length === 0) {
      setBackupStatus("Adicione pelo menos um item ao orcamento antes de gerar o PDF.");
      return;
    }

    const doc = new jsPDF();
    let y = 18;
    const lineHeight = 7;
    const pageBottom = 280;

    const printLine = (text: string, fontStyle: "normal" | "bold" = "normal"): void => {
      if (y > pageBottom) {
        doc.addPage();
        y = 18;
      }
      doc.setFont("helvetica", fontStyle);
      doc.text(text, 14, y);
      y += lineHeight;
    };

    doc.setFontSize(16);
    printLine(appState.configuracoes.nomeAtelier || "Calculadora de Precos", "bold");
    doc.setFontSize(11);
    printLine("Relatorio de orcamento", "bold");
    printLine(`Data: ${new Date().toLocaleString("pt-BR")}`);
    printLine(`Cliente: ${currentQuote.cliente || "Nao informado"}`);
    if (currentQuote.observacoes.trim()) {
      printLine(`Observacoes: ${currentQuote.observacoes.trim()}`);
    }
    y += 4;

    quoteTotals.linhas.forEach((line, index) => {
      printLine(`${index + 1}. ${line.product.nome} - ${line.variant.nome}`, "bold");
      printLine(`Quantidade: ${line.item.quantidade} un`);
      printLine(`Marketplace: ${line.marketplace.nome}`);
      printLine(`Custo base: ${formatMoney(line.breakdown.custoBase)}`);
      printLine(`Preco unitario: ${formatMoney(line.breakdown.precoFinal)}`);
      printLine(`Subtotal: ${formatMoney(line.subtotal)}`);
      if (line.item.observacoes.trim()) {
        printLine(`Obs. item: ${line.item.observacoes.trim()}`);
      }
      y += 3;
    });

    y += 4;
    printLine(`Total do orcamento: ${formatMoney(quoteTotals.total)}`, "bold");

    const safeClientName = (currentQuote.cliente || "cliente").replace(/[^a-z0-9]+/gi, "-");
    doc.save(`orcamento-${safeClientName}.pdf`);
    setBackupStatus("PDF do orcamento gerado com sucesso.");
  }

  const quoteTotals = useMemo(() => {
    const linhas = currentQuote.itens.map((item) => {
      const product = appState.produtos.find((value) => value.id === item.productId);
      const variant = product?.variantes.find((value) => value.id === item.variantId);
      const marketplace = appState.marketplaces.find((value) => value.id === item.marketplaceId);
      const packaging = item.packagingId
        ? appState.embalagens.find((value) => value.id === item.packagingId) ?? null
        : null;
      if (!product || !variant || !marketplace) {
        return null;
      }
      const breakdown = calculatePrice({
        product,
        variant,
        packaging,
        marketplace,
        materiais: appState.materiais,
        embalagens: appState.embalagens,
        settings: appState.configuracoes,
        marginOverridePct: item.margemOverridePct,
      });

      return {
        item,
        product,
        variant,
        marketplace,
        breakdown,
        subtotal: breakdown.precoFinal * item.quantidade,
      };
    });

    const validLines = linhas.filter(
      (
        value,
      ): value is {
        item: QuoteItem;
        product: Product;
        variant: ProductVariant;
        marketplace: Marketplace;
        breakdown: PriceBreakdown;
        subtotal: number;
      } => value !== null,
    );

    const total = validLines.reduce((sum, line) => sum + line.subtotal, 0);
    return { linhas: validLines, total };
  }, [appState, currentQuote.itens]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Printer size={22} />
          </div>
          <div>
            <h1>Calculadora</h1>
            <p>Preco justo, lucro certo</p>
          </div>
        </div>

        <nav className="nav-list">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>{appState.configuracoes.nomeAtelier}</span>
          <small>React + Vite + armazenamento local</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Visao geral</span>
            <h2>{navigationItems.find((item) => item.id === section)?.label}</h2>
          </div>
          <div className="topbar-actions">
            <label className="searchbox">
              <Search size={16} />
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Buscar produto, categoria ou descricao..."
              />
            </label>
            <button className="primary-button" type="button" onClick={() => setSection("orcamentos")}>
              <Calculator size={16} />
              Calculo rapido
            </button>
          </div>
        </header>

        {section === "dashboard" && (
          <section className="content-grid">
            <div className="hero-panel card span-12">
              <div>
                <span className="eyebrow">Composicao de produtos</span>
                <h3>Painel da producao artesanal em impressao 3D</h3>
                <p>
                  Cadastre produtos, insumos, embalagens, taxas de marketplaces e monte
                  orcamentos com margem por tamanho, canal de venda e embalagem.
                </p>
              </div>
              <div className="hero-actions">
                <button className="secondary-button" type="button" onClick={addProduct}>
                  <Plus size={16} />
                  Novo produto
                </button>
              </div>
            </div>

            <StatCard
              title="Produtos ativos"
              value={String(dashboardStats.produtosAtivos)}
              subtitle="Catalogo pronto para precificar"
            />
            <StatCard
              title="Materiais cadastrados"
              value={String(dashboardStats.totalMateriais)}
              subtitle="Com custo por unidade e fornecedor"
            />
            <StatCard
              title="Preco medio sugerido"
              value={formatMoney(dashboardStats.precoMedio)}
              subtitle="Baseado no primeiro canal de venda"
            />
            <StatCard
              title="Itens com alerta"
              value={String(dashboardStats.itensBaixoEstoque)}
              subtitle="Materiais e embalagens abaixo do minimo"
            />

            <div className="card span-12">
              <SectionHeader
                title="Produtos em destaque"
                description="Resumo com custo base, margem sugerida e preco final estimado."
              />
              <div className="product-card-grid">
                {filteredProducts.map((product) => {
                  const variant = product.variantes[0];
                  const marketplace = appState.marketplaces[0];
                  if (!variant || !marketplace) {
                    return null;
                  }
                  const breakdown = calculatePrice({
                    product,
                    variant,
                    packaging: null,
                    marketplace,
                    materiais: appState.materiais,
                    embalagens: appState.embalagens,
                    settings: appState.configuracoes,
                    marginOverridePct: null,
                  });

                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="product-card"
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setSection("produtos");
                      }}
                    >
                      <div className="product-card-image">
                        {product.imagemUrl ? (
                          <img src={product.imagemUrl} alt={product.nome} className="product-card-photo" />
                        ) : null}
                        <span>{product.categoria}</span>
                      </div>
                      <div className="product-card-body">
                        <div className="product-card-head">
                          <div>
                            <h4>{product.nome}</h4>
                            <p>{product.descricao}</p>
                          </div>
                          <span className="status-pill">{product.destaque}</span>
                        </div>
                        <div className="metric-row">
                          <span>Custo base</span>
                          <strong>{formatMoney(breakdown.custoBase)}</strong>
                        </div>
                        <div className="metric-row">
                          <span>Margem</span>
                          <strong>{formatPercent(variant.margemSugeridaPct)}</strong>
                        </div>
                        <div className="metric-row price">
                          <span>Preco sugerido</span>
                          <strong>{formatMoney(breakdown.precoFinal)}</strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {section === "produtos" && (
          <section className="content-grid">
            <div className="card span-4">
              <SectionHeader
                title="Catalogo"
                description="Selecione um produto para editar medidas, insumos e embalagens."
                action={
                  <button className="secondary-button" type="button" onClick={addProduct}>
                    <Plus size={16} />
                    Adicionar
                  </button>
                }
              />
              <div className="stack-list">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`select-card ${selectedProductId === product.id ? "active" : ""}`}
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <div>
                      <strong>{product.nome}</strong>
                      <p>{product.categoria}</p>
                    </div>
                    <span className="status-dot">{product.ativo ? "Ativo" : "Inativo"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card span-8">
              {selectedProduct ? (
                <>
                  <SectionHeader
                    title="Ficha do produto"
                    description="Edite a estrutura da peca e os tamanhos comercializados."
                    action={
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => removeProduct(selectedProduct.id)}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    }
                  />

                  <div className="form-grid two-columns">
                    <Field label="Nome">
                      <input
                        value={selectedProduct.nome}
                        onChange={(event) =>
                          updateProduct(selectedProduct.id, { nome: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Categoria">
                      <input
                        value={selectedProduct.categoria}
                        list="produto-categorias"
                        onChange={(event) =>
                          updateProduct(selectedProduct.id, { categoria: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Descricao">
                      <textarea
                        value={selectedProduct.descricao}
                        onChange={(event) =>
                          updateProduct(selectedProduct.id, { descricao: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Destaque">
                      <input
                        value={selectedProduct.destaque}
                        list="produto-destaques"
                        onChange={(event) =>
                          updateProduct(selectedProduct.id, { destaque: event.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="section-block">
                    <SectionHeader
                      title="Fotos do produto"
                      description="Use upload direto para salvar na base atual ou informe um caminho fixo dentro de public/uploads/produtos."
                    />
                    <div className="product-photo-panel">
                      <div className="product-photo-preview">
                        {selectedProduct.imagemUrl ? (
                          <img src={selectedProduct.imagemUrl} alt={selectedProduct.nome} />
                        ) : (
                          <div className="product-photo-empty">
                            Nenhuma foto vinculada a este produto.
                          </div>
                        )}
                      </div>
                      <div className="form-grid">
                        <Field label="Caminho da foto">
                          <input
                            value={selectedProduct.imagemUrl}
                            placeholder="/uploads/produtos/nome-da-foto.jpg"
                            onChange={(event) =>
                              updateProduct(selectedProduct.id, {
                                imagemUrl: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Nome do arquivo">
                          <input
                            value={selectedProduct.imagemNomeArquivo}
                            placeholder="nome-da-foto.jpg"
                            onChange={(event) =>
                              updateProduct(selectedProduct.id, {
                                imagemNomeArquivo: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Upload rapido">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(event) =>
                              void handleProductImageUpload(
                                selectedProduct.id,
                                event.target.files?.[0] ?? null,
                              )
                            }
                          />
                        </Field>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              updateProduct(selectedProduct.id, {
                                imagemUrl: "/uploads/produtos/",
                              })
                            }
                          >
                            Usar pasta padrao
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => clearProductImage(selectedProduct.id)}
                          >
                            Remover foto
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-block">
                    <SectionHeader
                      title="Variantes e tamanhos"
                      description="Defina custo e tempo para 190 mm, 220 mm, 225 mm e outros."
                      action={
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => addProductVariant(selectedProduct.id)}
                        >
                          <Plus size={16} />
                          Nova variante
                        </button>
                      }
                    />
                    <div className="table-like">
                      <div className="table-head">
                        <span>Nome</span>
                        <span>Dimensoes</span>
                        <span>Material</span>
                        <span>Horas</span>
                        <span>Energia</span>
                        <span>Margem</span>
                        <span />
                      </div>
                      {selectedProduct.variantes.map((variant) => (
                        <div className="table-row" key={variant.id}>
                          <input
                            value={variant.nome}
                            onChange={(event) =>
                              updateProductVariant(selectedProduct.id, variant.id, {
                                nome: event.target.value,
                              })
                            }
                          />
                          <div className="inline-grid">
                            <input
                              type="number"
                              value={variant.larguraMm}
                              onChange={(event) =>
                                updateProductVariant(selectedProduct.id, variant.id, {
                                  larguraMm: asNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              type="number"
                              value={variant.alturaMm}
                              onChange={(event) =>
                                updateProductVariant(selectedProduct.id, variant.id, {
                                  alturaMm: asNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              type="number"
                              value={variant.profundidadeMm}
                              onChange={(event) =>
                                updateProductVariant(selectedProduct.id, variant.id, {
                                  profundidadeMm: asNumber(event.target.value),
                                })
                              }
                            />
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={variant.multiplicadorMaterial}
                            onChange={(event) =>
                              updateProductVariant(selectedProduct.id, variant.id, {
                                multiplicadorMaterial: asNumber(event.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={variant.horasProducao}
                            onChange={(event) =>
                              updateProductVariant(selectedProduct.id, variant.id, {
                                horasProducao: asNumber(event.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={variant.consumoEnergiaKwh}
                            onChange={(event) =>
                              updateProductVariant(selectedProduct.id, variant.id, {
                                consumoEnergiaKwh: asNumber(event.target.value),
                              })
                            }
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={variant.margemSugeridaPct}
                            onChange={(event) =>
                              updateProductVariant(selectedProduct.id, variant.id, {
                                margemSugeridaPct: asNumber(event.target.value),
                              })
                            }
                          />
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => removeProductVariant(selectedProduct.id, variant.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section-block split-panels">
                    <div>
                      <SectionHeader
                        title="Materiais da peca"
                        description="Quantidade base por peca antes do multiplicador do tamanho."
                        action={
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => addProductUsage(selectedProduct.id)}
                          >
                            <Plus size={16} />
                            Adicionar
                          </button>
                        }
                      />
                      <div className="mini-table">
                        {selectedProduct.materiais.map((usage) => (
                          <div key={usage.id} className="mini-row">
                            <PickerField
                              title="Selecionar material"
                              value={usage.materialId}
                              options={materialPickerOptions}
                              placeholder="Escolha ou crie um material"
                              onChange={(value) =>
                                updateProductUsage(selectedProduct.id, usage.id, {
                                  materialId: value ?? "",
                                })
                              }
                              onCreate={createMaterialFromName}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={usage.quantidade}
                              onChange={(event) =>
                                updateProductUsage(selectedProduct.id, usage.id, {
                                  quantidade: asNumber(event.target.value),
                                })
                              }
                            />
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => removeProductUsage(selectedProduct.id, usage.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionHeader
                        title="Embalagens recomendadas"
                        description="Escolha as opcoes normalmente usadas no produto."
                        action={
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => addProductPackagingOption(selectedProduct.id)}
                          >
                            <Plus size={16} />
                            Adicionar
                          </button>
                        }
                      />
                      <div className="mini-table">
                        {selectedProduct.embalagens.map((option) => (
                          <div key={option.id} className="mini-row">
                            <PickerField
                              title="Selecionar embalagem"
                              value={option.packagingId}
                              options={packagingPickerOptions}
                              placeholder="Escolha ou crie uma embalagem"
                              onChange={(value) =>
                                updateProductPackagingOption(selectedProduct.id, option.id, {
                                  packagingId: value ?? "",
                                })
                              }
                              onCreate={createPackagingFromName}
                            />
                            <input
                              type="number"
                              step="1"
                              value={option.quantidade}
                              onChange={(event) =>
                                updateProductPackagingOption(selectedProduct.id, option.id, {
                                  quantidade: asNumber(event.target.value),
                                })
                              }
                            />
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() =>
                                removeProductPackagingOption(selectedProduct.id, option.id)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Nenhum produto selecionado"
                  description="Crie um produto para cadastrar tamanhos, materiais e embalagem."
                />
              )}
            </div>
          </section>
        )}

        {section === "materiais" && (
          <section className="content-grid">
            <div className="card span-12">
              <SectionHeader
                title="Cadastro de materiais"
                description="Controle custo unitario, estoque minimo e fornecedor."
                action={
                  <button className="secondary-button" type="button" onClick={addMaterial}>
                    <Plus size={16} />
                    Novo material
                  </button>
                }
              />
              <div className="table-like">
                <div className="table-head materials">
                  <span>Nome</span>
                  <span>Categoria</span>
                  <span>Unidade</span>
                  <span>Custo</span>
                  <span>Estoque</span>
                  <span>Minimo</span>
                  <span>Fornecedor</span>
                  <span />
                </div>
                {appState.materiais.map((material) => (
                  <div className="table-row materials" key={material.id}>
                    <input
                      value={material.nome}
                      onChange={(event) => updateMaterial(material.id, { nome: event.target.value })}
                    />
                    <input
                      value={material.categoria}
                      list="material-categorias"
                      onChange={(event) =>
                        updateMaterial(material.id, { categoria: event.target.value })
                      }
                    />
                    <input
                      value={material.unidade}
                      onChange={(event) => updateMaterial(material.id, { unidade: event.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={material.custoUnitario}
                      onChange={(event) =>
                        updateMaterial(material.id, { custoUnitario: asNumber(event.target.value) })
                      }
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={material.estoqueAtual}
                      onChange={(event) =>
                        updateMaterial(material.id, { estoqueAtual: asNumber(event.target.value) })
                      }
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={material.estoqueMinimo}
                      onChange={(event) =>
                        updateMaterial(material.id, { estoqueMinimo: asNumber(event.target.value) })
                      }
                    />
                    <input
                      value={material.fornecedor}
                      list="material-fornecedores"
                      onChange={(event) =>
                        updateMaterial(material.id, { fornecedor: event.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeMaterial(material.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {section === "embalagens" && (
          <section className="content-grid">
            <div className="card span-12">
              <SectionHeader
                title="Cadastro de embalagens"
                description="Use caixas e protecoes diferentes para cada tipo de envio."
                action={
                  <button className="secondary-button" type="button" onClick={addPackaging}>
                    <Plus size={16} />
                    Nova embalagem
                  </button>
                }
              />
              <div className="table-like">
                <div className="table-head packaging">
                  <span>Nome</span>
                  <span>Tipo</span>
                  <span>Custo</span>
                  <span>Estoque</span>
                  <span>Minimo</span>
                  <span />
                </div>
                {appState.embalagens.map((item) => (
                  <div className="table-row packaging" key={item.id}>
                    <input
                      value={item.nome}
                      onChange={(event) => updatePackaging(item.id, { nome: event.target.value })}
                    />
                    <input
                      value={item.tipo}
                      list="embalagem-tipos"
                      onChange={(event) => updatePackaging(item.id, { tipo: event.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.custoUnitario}
                      onChange={(event) =>
                        updatePackaging(item.id, { custoUnitario: asNumber(event.target.value) })
                      }
                    />
                    <input
                      type="number"
                      step="1"
                      value={item.estoqueAtual}
                      onChange={(event) =>
                        updatePackaging(item.id, { estoqueAtual: asNumber(event.target.value) })
                      }
                    />
                    <input
                      type="number"
                      step="1"
                      value={item.estoqueMinimo}
                      onChange={(event) =>
                        updatePackaging(item.id, { estoqueMinimo: asNumber(event.target.value) })
                      }
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removePackaging(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {section === "marketplaces" && (
          <section className="content-grid">
            <div className="card span-12">
              <SectionHeader
                title="Taxas de plataforma e canais de venda"
                description="Configure comissao, taxa do meio de pagamento, despesa variavel e faixas de preco."
                action={
                  <button className="secondary-button" type="button" onClick={addMarketplace}>
                    <Plus size={16} />
                    Novo canal
                  </button>
                }
              />
              <div className="marketplace-stack">
                {appState.marketplaces.map((marketplace) => (
                  <div key={marketplace.id} className="marketplace-card">
                    <div className="marketplace-card-header">
                      <div>
                        <input
                          className="title-input"
                          value={marketplace.nome}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, { nome: event.target.value })
                          }
                        />
                        <input
                          value={marketplace.tipo}
                          list="marketplace-tipos"
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, { tipo: event.target.value })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => removeMarketplace(marketplace.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="form-grid four-columns">
                      <Field label="Comissao (%)">
                        <input
                          type="number"
                          step="0.01"
                          value={marketplace.comissaoPct}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, {
                              comissaoPct: asNumber(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Taxa pagamento (%)">
                        <input
                          type="number"
                          step="0.01"
                          value={marketplace.taxaPagamentoPct}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, {
                              taxaPagamentoPct: asNumber(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Despesa variavel (%)">
                        <input
                          type="number"
                          step="0.01"
                          value={marketplace.despesaVariavelPct}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, {
                              despesaVariavelPct: asNumber(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Tarifa fixa (R$)">
                        <input
                          type="number"
                          step="0.01"
                          value={marketplace.tarifaFixa}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, {
                              tarifaFixa: asNumber(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Teto da tarifa (R$)">
                        <input
                          type="number"
                          step="0.01"
                          value={marketplace.tetoTarifa}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, {
                              tetoTarifa: asNumber(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Qtd minima da tarifa">
                        <input
                          type="number"
                          step="1"
                          value={marketplace.quantidadeMinima}
                          onChange={(event) =>
                            updateMarketplace(marketplace.id, {
                              quantidadeMinima: Math.max(1, asNumber(event.target.value)),
                            })
                          }
                        />
                      </Field>
                      <Field label="Comissao sobre tarifa">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={marketplace.cobrarComissaoSobreTarifa}
                            onChange={(event) =>
                              updateMarketplace(marketplace.id, {
                                cobrarComissaoSobreTarifa: event.target.checked,
                              })
                            }
                          />
                          <span>{marketplace.cobrarComissaoSobreTarifa ? "Sim" : "Nao"}</span>
                        </label>
                      </Field>
                    </div>

                    <div className="section-block">
                      <SectionHeader
                        title="Faixas de preco"
                        description="Opcional para canais como Elo7 e outros que variam comissao por faixa."
                        action={
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => addMarketplaceRule(marketplace.id)}
                          >
                            <Plus size={16} />
                            Nova faixa
                          </button>
                        }
                      />
                      <div className="table-like">
                        <div className="table-head tiers">
                          <span>De</span>
                          <span>Ate</span>
                          <span>Comissao</span>
                          <span>Tarifa</span>
                          <span>Teto</span>
                          <span>Qtd. minima</span>
                          <span>Comissao na tarifa</span>
                          <span />
                        </div>
                        {marketplace.regras.map((rule) => (
                          <div className="table-row tiers" key={rule.id}>
                            <input
                              type="number"
                              step="0.01"
                              value={rule.faixaDe}
                              onChange={(event) =>
                                updateMarketplaceRule(marketplace.id, rule.id, {
                                  faixaDe: asNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={rule.faixaAte ?? 0}
                              onChange={(event) =>
                                updateMarketplaceRule(marketplace.id, rule.id, {
                                  faixaAte: asNumber(event.target.value) || null,
                                })
                              }
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={rule.comissaoPct}
                              onChange={(event) =>
                                updateMarketplaceRule(marketplace.id, rule.id, {
                                  comissaoPct: asNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={rule.tarifaFixa}
                              onChange={(event) =>
                                updateMarketplaceRule(marketplace.id, rule.id, {
                                  tarifaFixa: asNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={rule.tetoTarifa}
                              onChange={(event) =>
                                updateMarketplaceRule(marketplace.id, rule.id, {
                                  tetoTarifa: asNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              type="number"
                              step="1"
                              value={rule.quantidadeMinima}
                              onChange={(event) =>
                                updateMarketplaceRule(marketplace.id, rule.id, {
                                  quantidadeMinima: Math.max(1, asNumber(event.target.value)),
                                })
                              }
                            />
                            <label className="switch compact">
                              <input
                                type="checkbox"
                                checked={rule.cobrarComissaoSobreTarifa}
                                onChange={(event) =>
                                  updateMarketplaceRule(marketplace.id, rule.id, {
                                    cobrarComissaoSobreTarifa: event.target.checked,
                                  })
                                }
                              />
                              <span>{rule.cobrarComissaoSobreTarifa ? "Sim" : "Nao"}</span>
                            </label>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => removeMarketplaceRule(marketplace.id, rule.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {section === "estoque" && (
          <section className="content-grid">
            <div className="card span-6">
              <SectionHeader
                title="Estoque de materiais"
                description="Ajuste rapido para compra, consumo ou inventario."
              />
              <div className="stock-list">
                {appState.materiais.map((material) => {
                  const abaixoMinimo = material.estoqueAtual <= material.estoqueMinimo;
                  return (
                    <div className="stock-card" key={material.id}>
                      <div>
                        <strong>{material.nome}</strong>
                        <p>{material.categoria}</p>
                      </div>
                      <div className="stock-meta">
                        <span>{material.estoqueAtual.toFixed(2)} {material.unidade}</span>
                        <small className={abaixoMinimo ? "danger-text" : ""}>
                          Minimo {material.estoqueMinimo.toFixed(2)} {material.unidade}
                        </small>
                      </div>
                      <div className="stock-actions">
                        <button
                          type="button"
                          onClick={() =>
                            updateMaterial(material.id, {
                              estoqueAtual: Math.max(0, material.estoqueAtual - 1),
                            })
                          }
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMaterial(material.id, {
                              estoqueAtual: material.estoqueAtual + 1,
                            })
                          }
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMaterial(material.id, {
                              estoqueAtual: material.estoqueAtual + 10,
                            })
                          }
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card span-6">
              <SectionHeader
                title="Estoque de embalagens"
                description="Controle as caixas e protecoes usadas em cada orcamento."
              />
              <div className="stock-list">
                {appState.embalagens.map((packaging) => {
                  const abaixoMinimo = packaging.estoqueAtual <= packaging.estoqueMinimo;
                  return (
                    <div className="stock-card" key={packaging.id}>
                      <div>
                        <strong>{packaging.nome}</strong>
                        <p>{packaging.tipo}</p>
                      </div>
                      <div className="stock-meta">
                        <span>{packaging.estoqueAtual.toFixed(0)} un</span>
                        <small className={abaixoMinimo ? "danger-text" : ""}>
                          Minimo {packaging.estoqueMinimo.toFixed(0)} un
                        </small>
                      </div>
                      <div className="stock-actions">
                        <button
                          type="button"
                          onClick={() =>
                            updatePackaging(packaging.id, {
                              estoqueAtual: Math.max(0, packaging.estoqueAtual - 1),
                            })
                          }
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updatePackaging(packaging.id, {
                              estoqueAtual: packaging.estoqueAtual + 1,
                            })
                          }
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updatePackaging(packaging.id, {
                              estoqueAtual: packaging.estoqueAtual + 10,
                            })
                          }
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {section === "orcamentos" && (
          <section className="content-grid">
            <div className="card span-5">
              <SectionHeader
                title="Calculo rapido"
                description="Monte um item com produto, tamanho, canal, embalagem e margem."
              />
              <div className="form-grid">
                <Field label="Produto">
                  <PickerField
                    title="Selecionar produto"
                    value={quoteDraft.productId}
                    options={productPickerOptions}
                    placeholder="Escolha ou crie um produto"
                    onChange={(value) => {
                      const product = appState.produtos.find((item) => item.id === value);
                      setQuoteDraft((previous) => ({
                        ...previous,
                        productId: value ?? "",
                        variantId: product?.variantes[0]?.id ?? previous.variantId,
                        packagingId: product?.embalagens[0]?.packagingId ?? previous.packagingId,
                      }));
                    }}
                    onCreate={createProductFromName}
                  />
                </Field>

                <Field label="Tamanho">
                  <select
                    value={quoteDraft.variantId}
                    onChange={(event) =>
                      setQuoteDraft((previous) => ({ ...previous, variantId: event.target.value }))
                    }
                  >
                    {(appState.produtos.find((item) => item.id === quoteDraft.productId)?.variantes ??
                      []).map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.nome}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Marketplace">
                  <PickerField
                    title="Selecionar marketplace"
                    value={quoteDraft.marketplaceId}
                    options={marketplacePickerOptions}
                    placeholder="Escolha ou crie um canal"
                    onChange={(value) =>
                      setQuoteDraft((previous) => ({
                        ...previous,
                        marketplaceId: value ?? "",
                      }))
                    }
                    onCreate={createMarketplaceFromName}
                  />
                </Field>

                <Field label="Embalagem principal">
                  <PickerField
                    title="Selecionar embalagem"
                    value={quoteDraft.packagingId}
                    options={packagingPickerOptions}
                    placeholder="Escolha ou crie uma embalagem"
                    emptyLabel="Sem embalagem extra"
                    onChange={(value) =>
                      setQuoteDraft((previous) => ({
                        ...previous,
                        packagingId: value,
                      }))
                    }
                    onCreate={createPackagingFromName}
                  />
                </Field>

                <Field label="Quantidade">
                  <input
                    type="number"
                    step="1"
                    value={quoteDraft.quantidade}
                    onChange={(event) =>
                      setQuoteDraft((previous) => ({
                        ...previous,
                        quantidade: Math.max(1, asNumber(event.target.value)),
                      }))
                    }
                  />
                </Field>

                <Field label="Margem personalizada (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={quoteDraft.margemOverridePct ?? ""}
                    placeholder="Usar margem sugerida"
                    onChange={(event) =>
                      setQuoteDraft((previous) => ({
                        ...previous,
                        margemOverridePct: event.target.value
                          ? asNumber(event.target.value)
                          : null,
                      }))
                    }
                  />
                </Field>

                <Field label="Observacoes">
                  <textarea
                    value={quoteDraft.observacoes}
                    onChange={(event) =>
                      setQuoteDraft((previous) => ({
                        ...previous,
                        observacoes: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              {quickQuotePreview && (
                <div className="preview-card">
                  <div className="preview-head">
                    <div>
                      <span className="eyebrow">Preco sugerido</span>
                      <h3>{formatMoney(quickQuotePreview.precoFinal)}</h3>
                    </div>
                    <span className="status-pill">{quickQuotePreview.marketplaceNome}</span>
                  </div>
                  <div className="metric-row">
                    <span>Custo base</span>
                    <strong>{formatMoney(quickQuotePreview.custoBase)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Lucro embutido</span>
                    <strong>{formatMoney(quickQuotePreview.valorLucro)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Comissao + taxa</span>
                    <strong>
                      {formatMoney(
                        quickQuotePreview.valorComissao +
                          quickQuotePreview.valorTaxaPagamento +
                          quickQuotePreview.tarifaFixaAplicada,
                      )}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Faixa aplicada</span>
                    <strong>{quickQuotePreview.faixaAplicada}</strong>
                  </div>
                  <div className="metric-row total">
                    <span>Total do item</span>
                    <strong>
                      {formatMoney(quickQuotePreview.precoFinal * quoteDraft.quantidade)}
                    </strong>
                  </div>
                  <button className="primary-button full-width" type="button" onClick={addQuoteItem}>
                    <Plus size={16} />
                    Adicionar ao orcamento
                  </button>
                </div>
              )}
            </div>

            <div className="card span-7">
              <SectionHeader
                title="Orcamento em andamento"
                description="Monte varios itens, registre cliente e salve no historico."
              />
              <div className="form-grid two-columns">
                <Field label="Cliente">
                  <input
                    value={currentQuote.cliente}
                    onChange={(event) =>
                      setCurrentQuote((previous) => ({
                        ...previous,
                        cliente: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Observacoes gerais">
                  <textarea
                    value={currentQuote.observacoes}
                    onChange={(event) =>
                      setCurrentQuote((previous) => ({
                        ...previous,
                        observacoes: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="quote-list">
                {quoteTotals.linhas.length === 0 && (
                  <EmptyState
                    title="Nenhum item no orcamento"
                    description="Use o calculo rapido para adicionar produtos ao pedido."
                  />
                )}
                {quoteTotals.linhas.map((line) => (
                  <div key={line.item.id} className="quote-card">
                    <div>
                      <h4>
                        {line.product.nome} - {line.variant.nome}
                      </h4>
                      <p>
                        {line.marketplace.nome} | {line.item.quantidade} un | custo base{" "}
                        {formatMoney(line.breakdown.custoBase)}
                      </p>
                    </div>
                    <div className="quote-card-meta">
                      <strong>{formatMoney(line.subtotal)}</strong>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => removeQuoteItem(line.item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="quote-footer">
                <div>
                  <span className="eyebrow">Total estimado</span>
                  <h3>{formatMoney(quoteTotals.total)}</h3>
                </div>
                <div className="quote-footer-actions">
                  <button className="secondary-button" type="button" onClick={handleExportQuotePdf}>
                    <Download size={16} />
                    Gerar PDF
                  </button>
                  <button className="primary-button" type="button" onClick={saveQuote}>
                    <DollarSign size={16} />
                    Salvar orcamento
                  </button>
                </div>
              </div>

              <div className="section-block">
                <SectionHeader
                  title="Historico salvo"
                  description="Orcamentos persistidos localmente no navegador."
                />
                <div className="quote-list">
                  {appState.orcamentos.map((quote) => (
                    <div key={quote.id} className="quote-card">
                      <div>
                        <h4>{quote.cliente || "Cliente nao informado"}</h4>
                        <p>
                          {new Date(quote.criadoEm).toLocaleDateString("pt-BR")} |{" "}
                          {quote.itens.length} item(ns)
                        </p>
                      </div>
                      <strong>
                        {formatMoney(
                          quote.itens.reduce((sum, item) => {
                            const product = appState.produtos.find((value) => value.id === item.productId);
                            const variant = product?.variantes.find((value) => value.id === item.variantId);
                            const marketplace = appState.marketplaces.find(
                              (value) => value.id === item.marketplaceId,
                            );
                            if (!product || !variant || !marketplace) {
                              return sum;
                            }
                            const breakdown = calculatePrice({
                              product,
                              variant,
                              packaging: item.packagingId
                                ? appState.embalagens.find((value) => value.id === item.packagingId) ??
                                  null
                                : null,
                              marketplace,
                              materiais: appState.materiais,
                              embalagens: appState.embalagens,
                              settings: appState.configuracoes,
                              marginOverridePct: item.margemOverridePct,
                            });
                            return sum + breakdown.precoFinal * item.quantidade;
                          }, 0),
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {section === "configuracoes" && (
          <section className="content-grid">
            <div className="card span-8">
              <SectionHeader
                title="Parametros globais"
                description="Esses valores afetam o calculo de mao de obra, energia, despesas fixas e margem padrao."
              />
              <div className="form-grid two-columns">
                <Field label="Nome do atelier">
                  <input
                    value={appState.configuracoes.nomeAtelier}
                    onChange={(event) =>
                      updateSettings({ nomeAtelier: event.target.value })
                    }
                  />
                </Field>
                <Field label="Mao de obra por hora (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={appState.configuracoes.custoHoraMaoDeObra}
                    onChange={(event) =>
                      updateSettings({ custoHoraMaoDeObra: asNumber(event.target.value) })
                    }
                  />
                </Field>
                <Field label="Custo energia por kWh (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={appState.configuracoes.custoEnergiaKwh}
                    onChange={(event) =>
                      updateSettings({ custoEnergiaKwh: asNumber(event.target.value) })
                    }
                  />
                </Field>
                <Field label="Despesas fixas mensais (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={appState.configuracoes.despesasFixasMensais}
                    onChange={(event) =>
                      updateSettings({ despesasFixasMensais: asNumber(event.target.value) })
                    }
                  />
                </Field>
                <Field label="Horas produtivas mensais">
                  <input
                    type="number"
                    step="0.01"
                    value={appState.configuracoes.horasProdutivasMensais}
                    onChange={(event) =>
                      updateSettings({ horasProdutivasMensais: asNumber(event.target.value) })
                    }
                  />
                </Field>
                <Field label="Margem padrao (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={appState.configuracoes.margemPadraoPct}
                    onChange={(event) =>
                      updateSettings({ margemPadraoPct: asNumber(event.target.value) })
                    }
                  />
                </Field>
                <Field label="Custo hora de design/acabamento (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={appState.configuracoes.custoDesignHora}
                    onChange={(event) =>
                      updateSettings({ custoDesignHora: asNumber(event.target.value) })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="card span-4">
              <SectionHeader
                title="Banco remoto"
                description="Opcional: use Supabase Postgres gratuito com login por e-mail e sincronizacao dos dados."
              />
              <div className="cloud-panel">
                <div className={`cloud-mode-badge ${storageMode === "cloud" ? "on" : "off"}`}>
                  {storageMode === "cloud" ? <Cloud size={16} /> : <CloudOff size={16} />}
                  <span>
                    {storageMode === "cloud" ? "Modo nuvem ativo" : "Modo local ativo"}
                  </span>
                </div>
                <p className="cloud-help">
                  GitHub nao hospeda Postgres. A opcao recomendada e conectar este app a um banco
                  gratuito do Supabase. Os dados ficam no banco e o acesso e controlado por login.
                </p>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={storageMode === "local" ? "secondary-button active-pill" : "secondary-button"}
                    onClick={() => setStorageMode("local")}
                  >
                    <CloudOff size={16} />
                    Local
                  </button>
                  <button
                    type="button"
                    className={storageMode === "cloud" ? "primary-button active-pill" : "secondary-button"}
                    onClick={() => setStorageMode("cloud")}
                    disabled={!cloudConfigured}
                  >
                    <Cloud size={16} />
                    Nuvem
                  </button>
                </div>
                {cloudConfigured ? (
                  <>
                    {cloudInfo.userId ? (
                      <div className="cloud-user-box">
                        <div className="metric-row">
                          <span>Conta conectada</span>
                          <strong>{cloudInfo.email ?? "Usuario autenticado"}</strong>
                        </div>
                        <div className="cloud-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => void handleCloudPullNow()}
                            disabled={cloudBusy}
                          >
                            <Download size={16} />
                            Baixar do banco
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => void handleCloudPushNow()}
                            disabled={cloudBusy}
                          >
                            <Upload size={16} />
                            Gravar no banco
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => void handleCloudSignOut()}
                            disabled={cloudBusy}
                          >
                            <LogOut size={16} />
                            Sair
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="cloud-login-box">
                        <input
                          type="email"
                          value={cloudEmail}
                          placeholder="seuemail@dominio.com"
                          onChange={(event) => setCloudEmail(event.target.value)}
                        />
                        <button
                          type="button"
                          className="primary-button full-width"
                          onClick={() => void handleCloudSignIn()}
                          disabled={cloudBusy}
                        >
                          <LogIn size={16} />
                          Receber link magico
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cloud-warning">
                    <Database size={16} />
                    <span>Crie um arquivo `.env` local com as chaves do Supabase.</span>
                  </div>
                )}
                <div className="cloud-status">
                  {cloudBusy ? <RefreshCw size={16} className="spin" /> : <CheckCircle2 size={16} />}
                  <span>{cloudStatus}</span>
                </div>
              </div>
            </div>

            <div className="card span-4">
              <SectionHeader
                title="Impacto da configuracao"
                description="Resumo do que muda quando voce ajusta os parametros globais."
              />
              <ul className="impact-list">
                <li>Mao de obra afeta todos os produtos e orcamentos.</li>
                <li>Energia impacta variantes por kWh de impressao.</li>
                <li>Despesas fixas alteram o custo por hora produtiva.</li>
                <li>Margem padrao e usada quando a variante nao tiver override.</li>
                <li>O historico salvo continua calculavel com os dados atuais.</li>
              </ul>
            </div>

            <div className="card span-12">
              <SectionHeader
                title="Backup e restauracao"
                description="Exporte um backup JSON completo do sistema ou importe um arquivo salvo anteriormente."
              />
              <div className="backup-panel">
                <div className="backup-actions">
                  <button type="button" className="secondary-button" onClick={handleExportBackup}>
                    <Download size={16} />
                    Exportar backup JSON
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => backupInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    Importar backup JSON
                  </button>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden-input"
                    onChange={(event) => {
                      void handleImportBackup(event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
                <div className="cloud-status">
                  <CheckCircle2 size={16} />
                  <span>{backupStatus}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <datalist id="produto-categorias">
          {productCategorySuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="produto-destaques">
          {productHighlightSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="material-categorias">
          {materialCategorySuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="material-fornecedores">
          {materialSupplierSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="embalagem-tipos">
          {packagingTypeSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="marketplace-tipos">
          {marketplaceTypeSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}): JSX.Element {
  return (
    <div className="card stat-card span-3">
      <span className="eyebrow">{title}</span>
      <h3>{value}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="empty-state">
      <p>{title}</p>
      <small>{description}</small>
    </div>
  );
}

function PickerField({
  title,
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
  onCreate,
}: {
  title: string;
  value: string | null;
  options: PickerOption[];
  placeholder: string;
  emptyLabel?: string;
  onChange: (value: string | null) => void;
  onCreate?: (label: string) => string;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(search);
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = normalizeText(`${option.label} ${option.subtitle ?? ""}`);
      return haystack.includes(normalizedQuery);
    });
  }, [options, search]);

  const canCreate =
    Boolean(onCreate) &&
    normalizeText(search).length > 0 &&
    !options.some((option) => normalizeText(option.label) === normalizeText(search));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent): void {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function selectValue(nextValue: string | null): void {
    onChange(nextValue);
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div className="picker-field" ref={containerRef}>
      <button
        type="button"
        className={`picker-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="picker-trigger-text">
          <strong>{selectedOption?.label ?? emptyLabel ?? placeholder}</strong>
          <small>{selectedOption?.subtitle ?? title}</small>
        </div>
        <ChevronsUpDown size={16} />
      </button>

      {isOpen ? (
        <div className="picker-popover">
          <input
            autoFocus
            value={search}
            placeholder={`Buscar em ${title.toLocaleLowerCase("pt-BR")}...`}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="picker-options">
            {emptyLabel ? (
              <button
                type="button"
                className={`picker-option ${value === null ? "selected" : ""}`}
                onClick={() => selectValue(null)}
              >
                <span>{emptyLabel}</span>
                <small>Remove a selecao atual desse campo.</small>
              </button>
            ) : null}

            {filteredOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className={`picker-option ${option.id === value ? "selected" : ""}`}
                onClick={() => selectValue(option.id)}
              >
                <span>{option.label}</span>
                <small>{option.subtitle ?? "Item ja cadastrado no sistema."}</small>
              </button>
            ))}

            {canCreate && onCreate ? (
              <button
                type="button"
                className="picker-option create"
                onClick={() => {
                  const createdId = onCreate(search.trim());
                  selectValue(createdId);
                }}
              >
                <span>Criar "{search.trim()}"</span>
                <small>Cria o novo item, grava no sistema e ja seleciona neste campo.</small>
              </button>
            ) : null}

            {filteredOptions.length === 0 && !canCreate ? (
              <div className="picker-empty">
                Nenhum item encontrado. Digite outro nome ou crie um novo item.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
