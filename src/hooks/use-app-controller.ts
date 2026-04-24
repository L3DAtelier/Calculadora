import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  fileToDataUrl,
  formatMoney,
  formatPercent,
  getErrorMessage,
  normalizeText,
  uid,
  uniqueSuggestions,
} from "../lib/app-utils";
import { createDefaultAppState, withDefaultProducts } from "../lib/default-state";
import { calculatePrice } from "../lib/pricing";
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
} from "../lib/storage";
import type {
  AppState,
  BackupPayload,
  Marketplace,
  MarketplaceRule,
  Material,
  Packaging,
  PickerOption,
  PriceBreakdown,
  Product,
  ProductMaterialUsage,
  ProductPackagingOption,
  ProductVariant,
  QuoteItem,
  SavedQuote,
  Section,
  Settings,
} from "../types/app";

export type DashboardStats = {
  produtosAtivos: number;
  totalMateriais: number;
  itensBaixoEstoque: number;
  precoMedio: number;
};

export type QuoteLine = {
  item: QuoteItem;
  product: Product;
  variant: ProductVariant;
  marketplace: Marketplace;
  breakdown: PriceBreakdown;
  subtotal: number;
};

export type QuoteTotals = {
  linhas: QuoteLine[];
  total: number;
};

function createEmptyQuote(): SavedQuote {
  return {
    id: uid("orc"),
    cliente: "",
    criadoEm: new Date().toISOString(),
    observacoes: "",
    itens: [],
  };
}

function createQuoteDraft(): QuoteItem {
  return {
    id: uid("item"),
    productId: "",
    variantId: "",
    marketplaceId: "",
    packagingId: null,
    quantidade: 1,
    margemOverridePct: null,
    observacoes: "",
  };
}

function calculateQuoteTotals(appState: AppState, currentQuote: SavedQuote): QuoteTotals {
  const linhas = currentQuote.itens
    .map((item) => {
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
    })
    .filter((value): value is QuoteLine => value !== null);

  return {
    linhas,
    total: linhas.reduce((sum, line) => sum + line.subtotal, 0),
  };
}

export function useAppController(): {
  appState: AppState;
  section: Section;
  setSection: (value: Section) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  backupInputRef: RefObject<HTMLInputElement>;
  selectedProductId: string;
  setSelectedProductId: (value: string) => void;
  storageMode: StorageMode;
  setStorageMode: Dispatch<SetStateAction<StorageMode>>;
  cloudConfigured: boolean;
  cloudInfo: CloudSessionInfo;
  cloudEmail: string;
  setCloudEmail: Dispatch<SetStateAction<string>>;
  cloudBusy: boolean;
  cloudStatus: string;
  backupStatus: string;
  currentQuote: SavedQuote;
  setCurrentQuote: Dispatch<SetStateAction<SavedQuote>>;
  quoteDraft: QuoteItem;
  setQuoteDraft: Dispatch<SetStateAction<QuoteItem>>;
  filteredProducts: Product[];
  selectedProduct: Product | null;
  quickQuotePreview: PriceBreakdown | null;
  dashboardStats: DashboardStats;
  productCategorySuggestions: string[];
  productHighlightSuggestions: string[];
  materialCategorySuggestions: string[];
  materialSupplierSuggestions: string[];
  packagingTypeSuggestions: string[];
  marketplaceTypeSuggestions: string[];
  productPickerOptions: PickerOption[];
  materialPickerOptions: PickerOption[];
  packagingPickerOptions: PickerOption[];
  marketplacePickerOptions: PickerOption[];
  quoteTotals: QuoteTotals;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  addMaterial: () => void;
  createMaterialFromName: (name: string) => string;
  removeMaterial: (id: string) => void;
  updatePackaging: (id: string, patch: Partial<Packaging>) => void;
  addPackaging: () => void;
  createPackagingFromName: (name: string) => string;
  removePackaging: (id: string) => void;
  updateMarketplace: (id: string, patch: Partial<Marketplace>) => void;
  addMarketplace: () => void;
  createMarketplaceFromName: (name: string) => string;
  removeMarketplace: (id: string) => void;
  updateMarketplaceRule: (
    marketplaceId: string,
    ruleId: string,
    patch: Partial<MarketplaceRule>,
  ) => void;
  addMarketplaceRule: (marketplaceId: string) => void;
  removeMarketplaceRule: (marketplaceId: string, ruleId: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  addProduct: () => void;
  createProductFromName: (name: string) => string;
  removeProduct: (id: string) => void;
  updateProductVariant: (
    productId: string,
    variantId: string,
    patch: Partial<ProductVariant>,
  ) => void;
  addProductVariant: (productId: string) => void;
  removeProductVariant: (productId: string, variantId: string) => void;
  updateProductUsage: (
    productId: string,
    usageId: string,
    patch: Partial<ProductMaterialUsage>,
  ) => void;
  addProductUsage: (productId: string) => void;
  removeProductUsage: (productId: string, usageId: string) => void;
  updateProductPackagingOption: (
    productId: string,
    optionId: string,
    patch: Partial<ProductPackagingOption>,
  ) => void;
  addProductPackagingOption: (productId: string) => void;
  removeProductPackagingOption: (productId: string, optionId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addQuoteItem: () => void;
  removeQuoteItem: (itemId: string) => void;
  saveQuote: () => void;
  handleCloudSignIn: () => Promise<void>;
  handleCloudPullNow: () => Promise<void>;
  handleCloudPushNow: () => Promise<void>;
  handleCloudSignOut: () => Promise<void>;
  handleProductImageUpload: (productId: string, file: File | null) => Promise<void>;
  clearProductImage: (productId: string) => void;
  handleExportBackup: () => void;
  handleImportBackup: (file: File | null) => Promise<void>;
  handleExportQuotePdf: () => void;
} {
  const cloudConfigured = isCloudConfigured();
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [appState, setAppState] = useState<AppState>(() =>
    withDefaultProducts(loadLocalSnapshot(createDefaultAppState())),
  );
  const [section, setSection] = useState<Section>("dashboard");
  const [productSearch, setProductSearchState] = useState("");
  const [selectedProductId, setSelectedProductIdState] = useState("");
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
  const [currentQuote, setCurrentQuote] = useState<SavedQuote>(() => createEmptyQuote());
  const [quoteDraft, setQuoteDraft] = useState<QuoteItem>(() => createQuoteDraft());

  function setProductSearch(value: string): void {
    setProductSearchState(value);
  }

  function setSelectedProductId(value: string): void {
    setSelectedProductIdState(value);
  }

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
        const snapshot = await pullCloudSnapshot();
        if (cancelled) {
          return;
        }

        if (snapshot) {
          const hydratedState = withDefaultProducts(snapshot);
          setAppState(hydratedState);
          setSelectedProductIdState((current) => current || hydratedState.produtos[0]?.id || "");
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

    void hydrateFromCloud();

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
      setSelectedProductIdState(appState.produtos[0].id);
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
    const search = productSearch.trim().toLocaleLowerCase("pt-BR");
    if (!search) {
      return appState.produtos;
    }

    return appState.produtos.filter((product) => {
      const haystack = `${product.nome} ${product.categoria} ${product.descricao}`.toLocaleLowerCase(
        "pt-BR",
      );
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

  const dashboardStats = useMemo<DashboardStats>(() => {
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

    return {
      produtosAtivos,
      totalMateriais,
      itensBaixoEstoque,
      precoMedio:
        precosCalculados.length > 0
          ? precosCalculados.reduce((sum, value) => sum + value, 0) / precosCalculados.length
          : 0,
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

  const productPickerOptions = useMemo<PickerOption[]>(
    () =>
      appState.produtos.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: item.categoria,
      })),
    [appState.produtos],
  );
  const materialPickerOptions = useMemo<PickerOption[]>(
    () =>
      appState.materiais.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: `${item.categoria} | ${item.unidade}`,
      })),
    [appState.materiais],
  );
  const packagingPickerOptions = useMemo<PickerOption[]>(
    () =>
      appState.embalagens.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: `${item.tipo} | ${formatMoney(item.custoUnitario)}`,
      })),
    [appState.embalagens],
  );
  const marketplacePickerOptions = useMemo<PickerOption[]>(
    () =>
      appState.marketplaces.map((item) => ({
        id: item.id,
        label: item.nome,
        subtitle: `${item.tipo} | comissao ${formatPercent(item.comissaoPct)}`,
      })),
    [appState.marketplaces],
  );

  const quoteTotals = useMemo(() => calculateQuoteTotals(appState, currentQuote), [appState, currentQuote]);

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
    const existing = appState.marketplaces.find((item) => normalizeText(item.nome) === normalized);
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
              regras: item.regras.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
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
      produtos: previous.produtos.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function addProduct(): void {
    const productId = uid("prd");
    const newProduct: Product = {
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
      produtos: [...previous.produtos, newProduct],
    }));
    setSelectedProductIdState(productId);
    setSection("produtos");
  }

  function createProductFromName(name: string): string {
    const normalized = normalizeText(name);
    const existing = appState.produtos.find((item) => normalizeText(item.nome) === normalized);
    if (existing) {
      return existing.id;
    }

    const id = uid("prd");
    updateState((previous) => ({
      ...previous,
      produtos: [
        ...previous.produtos,
        {
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
        },
      ],
    }));
    return id;
  }

  function removeProduct(id: string): void {
    const nextSelectedId = appState.produtos.find((item) => item.id !== id)?.id ?? "";

    updateState((previous) => ({
      ...previous,
      produtos: previous.produtos.filter((item) => item.id !== id),
    }));

    setSelectedProductIdState((current) => (current === id ? nextSelectedId : current));
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
    setCurrentQuote(createEmptyQuote());
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
      const snapshot = await pullCloudSnapshot();
      if (snapshot) {
        const hydratedState = withDefaultProducts(snapshot);
        setAppState(hydratedState);
        setSelectedProductIdState(hydratedState.produtos[0]?.id ?? "");
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

  async function handleProductImageUpload(productId: string, file: File | null): Promise<void> {
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
      version: "2.1.0",
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
      setSelectedProductIdState(importedState.produtos[0]?.id ?? "");
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
    printLine(`Cliente: ${currentQuote.cliente || "Nao informado"}`);
    printLine(`Data: ${new Date().toLocaleDateString("pt-BR")}`);
    if (currentQuote.observacoes.trim()) {
      printLine(`Observacoes: ${currentQuote.observacoes.trim()}`);
    }

    y += 4;
    quoteTotals.linhas.forEach((line, index) => {
      printLine(`${index + 1}. ${line.product.nome} - ${line.variant.nome}`, "bold");
      printLine(`Marketplace: ${line.marketplace.nome}`);
      printLine(`Quantidade: ${line.item.quantidade}`);
      printLine(`Preco unitario: ${formatMoney(line.breakdown.precoFinal)}`);
      printLine(`Subtotal: ${formatMoney(line.subtotal)}`);
      y += 2;
    });

    y += 4;
    printLine(`Total do orcamento: ${formatMoney(quoteTotals.total)}`, "bold");

    const safeClientName = (currentQuote.cliente || "cliente").replace(/[^a-z0-9]+/gi, "-");
    doc.save(`orcamento-${safeClientName}.pdf`);
    setBackupStatus("PDF do orcamento gerado com sucesso.");
  }

  return {
    appState,
    section,
    setSection,
    productSearch,
    setProductSearch,
    backupInputRef,
    selectedProductId,
    setSelectedProductId,
    storageMode,
    setStorageMode,
    cloudConfigured,
    cloudInfo,
    cloudEmail,
    setCloudEmail,
    cloudBusy,
    cloudStatus,
    backupStatus,
    currentQuote,
    setCurrentQuote,
    quoteDraft,
    setQuoteDraft,
    filteredProducts,
    selectedProduct,
    quickQuotePreview,
    dashboardStats,
    productCategorySuggestions,
    productHighlightSuggestions,
    materialCategorySuggestions,
    materialSupplierSuggestions,
    packagingTypeSuggestions,
    marketplaceTypeSuggestions,
    productPickerOptions,
    materialPickerOptions,
    packagingPickerOptions,
    marketplacePickerOptions,
    quoteTotals,
    updateMaterial,
    addMaterial,
    createMaterialFromName,
    removeMaterial,
    updatePackaging,
    addPackaging,
    createPackagingFromName,
    removePackaging,
    updateMarketplace,
    addMarketplace,
    createMarketplaceFromName,
    removeMarketplace,
    updateMarketplaceRule,
    addMarketplaceRule,
    removeMarketplaceRule,
    updateProduct,
    addProduct,
    createProductFromName,
    removeProduct,
    updateProductVariant,
    addProductVariant,
    removeProductVariant,
    updateProductUsage,
    addProductUsage,
    removeProductUsage,
    updateProductPackagingOption,
    addProductPackagingOption,
    removeProductPackagingOption,
    updateSettings,
    addQuoteItem,
    removeQuoteItem,
    saveQuote,
    handleCloudSignIn,
    handleCloudPullNow,
    handleCloudPushNow,
    handleCloudSignOut,
    handleProductImageUpload,
    clearProductImage,
    handleExportBackup,
    handleImportBackup,
    handleExportQuotePdf,
  };
}
