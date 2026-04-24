import { ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PickerOption } from "../types/app";
import { normalizeText } from "../lib/app-utils";

export function Field({
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

export function SectionHeader({
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

export function StatCard({
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

export function EmptyState({
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

export function PickerField({
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
