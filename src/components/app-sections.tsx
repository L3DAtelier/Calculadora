import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  DollarSign,
  Download,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { asNumber, formatMoney, formatPercent } from "../lib/app-utils";
import { calculatePrice } from "../lib/pricing";
import type {
  AppState,
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
import { EmptyState, Field, PickerField, SectionHeader, StatCard } from "./ui";

type DashboardStats = {
  produtosAtivos: number;
  totalMateriais: number;
  itensBaixoEstoque: number;
  precoMedio: number;
};

type QuoteLine = {
  item: QuoteItem;
  product: Product;
  variant: ProductVariant;
  marketplace: Marketplace;
  breakdown: PriceBreakdown;
  subtotal: number;
};

type QuoteTotals = {
  linhas: QuoteLine[];
  total: number;
};

export function DashboardSection({
  filteredProducts,
  appState,
  dashboardStats,
  addProduct,
  setSelectedProductId,
  setSection,
}: {
  filteredProducts: Product[];
  appState: AppState;
  dashboardStats: DashboardStats;
  addProduct: () => void;
  setSelectedProductId: (value: string) => void;
  setSection: (value: Section) => void;
}): JSX.Element {
  return (
    <section className="content-grid">
      <div className="hero-panel card span-12">
        <div>
          <span className="eyebrow">Composicao de produtos</span>
          <h3>Painel da producao artesanal em impressao 3D</h3>
          <p>
            Cadastre produtos, insumos, embalagens, taxas de marketplaces e monte orcamentos
            com margem por tamanho, canal de venda e embalagem.
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
  );
}

export function CatalogSection({
  section,
  filteredProducts,
  selectedProductId,
  setSelectedProductId,
  selectedProduct,
  appState,
  addProduct,
  removeProduct,
  updateProduct,
  addProductVariant,
  updateProductVariant,
  removeProductVariant,
  addProductUsage,
  updateProductUsage,
  removeProductUsage,
  addProductPackagingOption,
  updateProductPackagingOption,
  removeProductPackagingOption,
  materialPickerOptions,
  packagingPickerOptions,
  createMaterialFromName,
  createPackagingFromName,
  handleProductImageUpload,
  clearProductImage,
  addMaterial,
  updateMaterial,
  removeMaterial,
  addPackaging,
  updatePackaging,
  removePackaging,
  addMarketplace,
  updateMarketplace,
  removeMarketplace,
  addMarketplaceRule,
  updateMarketplaceRule,
  removeMarketplaceRule,
}: {
  section: Section;
  filteredProducts: Product[];
  selectedProductId: string;
  setSelectedProductId: (value: string) => void;
  selectedProduct: Product | null;
  appState: AppState;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  addProductVariant: (productId: string) => void;
  updateProductVariant: (
    productId: string,
    variantId: string,
    patch: Partial<ProductVariant>,
  ) => void;
  removeProductVariant: (productId: string, variantId: string) => void;
  addProductUsage: (productId: string) => void;
  updateProductUsage: (
    productId: string,
    usageId: string,
    patch: Partial<ProductMaterialUsage>,
  ) => void;
  removeProductUsage: (productId: string, usageId: string) => void;
  addProductPackagingOption: (productId: string) => void;
  updateProductPackagingOption: (
    productId: string,
    optionId: string,
    patch: Partial<ProductPackagingOption>,
  ) => void;
  removeProductPackagingOption: (productId: string, optionId: string) => void;
  materialPickerOptions: PickerOption[];
  packagingPickerOptions: PickerOption[];
  createMaterialFromName: (name: string) => string;
  createPackagingFromName: (name: string) => string;
  handleProductImageUpload: (productId: string, file: File | null) => Promise<void>;
  clearProductImage: (productId: string) => void;
  addMaterial: () => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  removeMaterial: (id: string) => void;
  addPackaging: () => void;
  updatePackaging: (id: string, patch: Partial<Packaging>) => void;
  removePackaging: (id: string) => void;
  addMarketplace: () => void;
  updateMarketplace: (id: string, patch: Partial<Marketplace>) => void;
  removeMarketplace: (id: string) => void;
  addMarketplaceRule: (marketplaceId: string) => void;
  updateMarketplaceRule: (
    marketplaceId: string,
    ruleId: string,
    patch: Partial<MarketplaceRule>,
  ) => void;
  removeMarketplaceRule: (marketplaceId: string, ruleId: string) => void;
}): JSX.Element | null {
  if (section === "produtos") {
    return (
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
                      <div className="product-photo-empty">Nenhuma foto vinculada a este produto.</div>
                    )}
                  </div>
                  <div className="form-grid">
                    <Field label="Caminho da foto">
                      <input
                        value={selectedProduct.imagemUrl}
                        placeholder="/uploads/produtos/nome-da-foto.jpg"
                        onChange={(event) =>
                          updateProduct(selectedProduct.id, { imagemUrl: event.target.value })
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
    );
  }

  if (section === "materiais") {
    return (
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
    );
  }

  if (section === "embalagens") {
    return (
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
    );
  }

  if (section === "marketplaces") {
    return (
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
    );
  }

  if (section === "estoque") {
    return (
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
                    <span>
                      {material.estoqueAtual.toFixed(2)} {material.unidade}
                    </span>
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
    );
  }

  return null;
}

export function QuotesSection({
  appState,
  quoteDraft,
  setQuoteDraft,
  productPickerOptions,
  marketplacePickerOptions,
  packagingPickerOptions,
  createProductFromName,
  createMarketplaceFromName,
  createPackagingFromName,
  quickQuotePreview,
  addQuoteItem,
  currentQuote,
  setCurrentQuote,
  quoteTotals,
  removeQuoteItem,
  handleExportQuotePdf,
  saveQuote,
}: {
  appState: AppState;
  quoteDraft: QuoteItem;
  setQuoteDraft: Dispatch<SetStateAction<QuoteItem>>;
  productPickerOptions: PickerOption[];
  marketplacePickerOptions: PickerOption[];
  packagingPickerOptions: PickerOption[];
  createProductFromName: (name: string) => string;
  createMarketplaceFromName: (name: string) => string;
  createPackagingFromName: (name: string) => string;
  quickQuotePreview: PriceBreakdown | null;
  addQuoteItem: () => void;
  currentQuote: SavedQuote;
  setCurrentQuote: Dispatch<SetStateAction<SavedQuote>>;
  quoteTotals: QuoteTotals;
  removeQuoteItem: (itemId: string) => void;
  handleExportQuotePdf: () => void;
  saveQuote: () => void;
}): JSX.Element {
  return (
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
              {(appState.produtos.find((item) => item.id === quoteDraft.productId)?.variantes ?? []).map(
                (variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.nome}
                  </option>
                ),
              )}
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
                  margemOverridePct: event.target.value ? asNumber(event.target.value) : null,
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
              <strong>{formatMoney(quickQuotePreview.precoFinal * quoteDraft.quantidade)}</strong>
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
                    {new Date(quote.criadoEm).toLocaleDateString("pt-BR")} | {quote.itens.length}{" "}
                    item(ns)
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
                          ? appState.embalagens.find((value) => value.id === item.packagingId) ?? null
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
  );
}

export function SettingsSection({
  settings,
  updateSettings,
  storageMode,
  setStorageMode,
  cloudConfigured,
  cloudInfo,
  cloudEmail,
  setCloudEmail,
  cloudBusy,
  cloudStatus,
  handleCloudPullNow,
  handleCloudPushNow,
  handleCloudSignIn,
  handleCloudSignOut,
  handleExportBackup,
  backupInputRef,
  handleImportBackup,
  backupStatus,
}: {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  storageMode: "local" | "cloud";
  setStorageMode: Dispatch<SetStateAction<"local" | "cloud">>;
  cloudConfigured: boolean;
  cloudInfo: { email: string | null; userId: string | null };
  cloudEmail: string;
  setCloudEmail: Dispatch<SetStateAction<string>>;
  cloudBusy: boolean;
  cloudStatus: string;
  handleCloudPullNow: () => Promise<void>;
  handleCloudPushNow: () => Promise<void>;
  handleCloudSignIn: () => Promise<void>;
  handleCloudSignOut: () => Promise<void>;
  handleExportBackup: () => void;
  backupInputRef: RefObject<HTMLInputElement>;
  handleImportBackup: (file: File | null) => Promise<void>;
  backupStatus: string;
}): JSX.Element {
  return (
    <section className="content-grid">
      <div className="card span-8">
        <SectionHeader
          title="Parametros globais"
          description="Esses valores afetam o calculo de mao de obra, energia, despesas fixas e margem padrao."
        />
        <div className="form-grid two-columns">
          <Field label="Nome do atelier">
            <input
              value={settings.nomeAtelier}
              onChange={(event) => updateSettings({ nomeAtelier: event.target.value })}
            />
          </Field>
          <Field label="Mao de obra por hora (R$)">
            <input
              type="number"
              step="0.01"
              value={settings.custoHoraMaoDeObra}
              onChange={(event) =>
                updateSettings({ custoHoraMaoDeObra: asNumber(event.target.value) })
              }
            />
          </Field>
          <Field label="Custo energia por kWh (R$)">
            <input
              type="number"
              step="0.01"
              value={settings.custoEnergiaKwh}
              onChange={(event) =>
                updateSettings({ custoEnergiaKwh: asNumber(event.target.value) })
              }
            />
          </Field>
          <Field label="Despesas fixas mensais (R$)">
            <input
              type="number"
              step="0.01"
              value={settings.despesasFixasMensais}
              onChange={(event) =>
                updateSettings({ despesasFixasMensais: asNumber(event.target.value) })
              }
            />
          </Field>
          <Field label="Horas produtivas mensais">
            <input
              type="number"
              step="0.01"
              value={settings.horasProdutivasMensais}
              onChange={(event) =>
                updateSettings({ horasProdutivasMensais: asNumber(event.target.value) })
              }
            />
          </Field>
          <Field label="Margem padrao (%)">
            <input
              type="number"
              step="0.01"
              value={settings.margemPadraoPct}
              onChange={(event) => updateSettings({ margemPadraoPct: asNumber(event.target.value) })}
            />
          </Field>
          <Field label="Custo hora de design/acabamento (R$)">
            <input
              type="number"
              step="0.01"
              value={settings.custoDesignHora}
              onChange={(event) => updateSettings({ custoDesignHora: asNumber(event.target.value) })}
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
            <span>{storageMode === "cloud" ? "Modo nuvem ativo" : "Modo local ativo"}</span>
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
  );
}
