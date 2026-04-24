import type {
  Marketplace,
  MarketplaceRule,
  Material,
  Packaging,
  PriceBreakdown,
  Product,
  ProductVariant,
  Settings,
} from "../types/app";
import { formatMoney } from "./app-utils";

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
    quantidadeMinima: Math.max(1, regra?.quantidadeMinima ?? marketplace.quantidadeMinima),
  };
}

// Calcula o preco final por peca com base nos custos, taxas do canal e margem desejada.
export function calculatePrice({
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
    custoMateriais + custoEmbalagem + custoMaoDeObra + custoEnergia + custoDespesasFixas;

  const margemPct =
    (marginOverridePct ?? variant.margemSugeridaPct ?? settings.margemPadraoPct) / 100;
  const taxaPagamentoPct = marketplace.taxaPagamentoPct / 100;
  const despesaVariavelPct = marketplace.despesaVariavelPct / 100;

  let precoAtual =
    custoBase /
    Math.max(
      1 - (marketplace.comissaoPct / 100 + taxaPagamentoPct + despesaVariavelPct + margemPct),
      0.01,
    );
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
      tarifaPorUnidade > 0 && (resolved.tetoTarifa <= 0 || precoAtual <= resolved.tetoTarifa);

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

  const baseComissao =
    tarifaFixaAplicada > 0 && !marketplace.cobrarComissaoSobreTarifa
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
