const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const basePath = import.meta.env.BASE_URL ?? "/";

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function asNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

export function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function uniqueSuggestions(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].sort(
    (left, right) => left.localeCompare(right, "pt-BR"),
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const possibleMessage = "message" in error ? error.message : undefined;
    const possibleDetails = "details" in error ? error.details : undefined;
    const possibleHint = "hint" in error ? error.hint : undefined;
    const parts = [possibleMessage, possibleDetails, possibleHint].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "Erro nao identificado.";
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}

export function normalizeStoredAssetPath(path: string): string {
  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return "";
  }

  if (/^(data:|blob:|https?:\/\/)/i.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedBase = basePath === "/" ? "" : basePath.replace(/^\/|\/$/g, "");
  const cleanedPath = trimmedPath.replace(/^\/+/, "");

  if (normalizedBase && cleanedPath.startsWith(`${normalizedBase}/`)) {
    return cleanedPath.slice(normalizedBase.length + 1);
  }

  return cleanedPath;
}

export function resolvePublicAssetUrl(path: string): string {
  const normalizedPath = normalizeStoredAssetPath(path);

  if (!normalizedPath || /^(data:|blob:|https?:\/\/)/i.test(normalizedPath)) {
    return normalizedPath;
  }

  return `${basePath}${normalizedPath}`.replace(/([^:]\/)\/+/g, "$1");
}
