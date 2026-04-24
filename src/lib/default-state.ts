import type { AppState } from "../types/app";
import { uid } from "./app-utils";

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

export function createDefaultAppState(): AppState {
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

export function withDefaultProducts(base: AppState): AppState {
  if (base.produtos.length > 0) {
    return {
      ...base,
      produtos: base.produtos.map((product) => {
        const fallbackImage = getDefaultProductImage(product.nome);
        return {
          ...product,
          imagemUrl: product.imagemUrl || fallbackImage.imagemUrl,
          imagemNomeArquivo: product.imagemNomeArquivo || fallbackImage.imagemNomeArquivo,
        };
      }),
    };
  }

  const byName = (name: string) => base.materiais.find((material) => material.nome === name)?.id ?? "";
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
        descricao: "Escultura ou busto personalizado com acabamento manual e composicao por partes.",
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
