import {
  BadgeDollarSign,
  Box,
  Boxes,
  Calculator,
  ClipboardList,
  Cog,
  Factory,
  PackagePlus,
  Search,
  Store,
  type LucideIcon,
} from "lucide-react";
import {
  CatalogSection,
  DashboardSection,
  QuotesSection,
  SettingsSection,
} from "./components/app-sections";
import { useAppController } from "./hooks/use-app-controller";
import type { Section } from "./types/app";

const navigationItems: Array<{
  id: Section;
  label: string;
  icon: LucideIcon;
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

const brandLogoUrl = `${import.meta.env.BASE_URL}PWAc-192x192.svg`;

function App(): JSX.Element {
  const controller = useAppController();
  const currentSectionTitle =
    navigationItems.find((item) => item.id === controller.section)?.label ?? "Dashboard";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <img src={brandLogoUrl} alt="Logo da calculadora" className="brand-mark-image" />
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
                type="button"
                className={`nav-item ${controller.section === item.id ? "active" : ""}`}
                onClick={() => controller.setSection(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>{controller.appState.configuracoes.nomeAtelier}</span>
          <small>React + Vite + Supabase relacional</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Visao geral</span>
            <h2>{currentSectionTitle}</h2>
          </div>
          <div className="topbar-actions">
            <label className="searchbox">
              <Search size={16} />
              <input
                value={controller.productSearch}
                onChange={(event) => controller.setProductSearch(event.target.value)}
                placeholder="Buscar produto, categoria ou descricao..."
              />
            </label>
            <button
              className="primary-button"
              type="button"
              onClick={() => controller.setSection("orcamentos")}
            >
              <Calculator size={16} />
              Calculo rapido
            </button>
          </div>
        </header>

        {controller.section === "dashboard" && (
          <DashboardSection
            filteredProducts={controller.filteredProducts}
            appState={controller.appState}
            dashboardStats={controller.dashboardStats}
            addProduct={controller.addProduct}
            setSelectedProductId={controller.setSelectedProductId}
            setSection={controller.setSection}
          />
        )}

        {controller.section !== "dashboard" &&
          controller.section !== "orcamentos" &&
          controller.section !== "configuracoes" && (
            <CatalogSection
              section={controller.section}
              filteredProducts={controller.filteredProducts}
              selectedProductId={controller.selectedProductId}
              setSelectedProductId={controller.setSelectedProductId}
              selectedProduct={controller.selectedProduct}
              appState={controller.appState}
              addProduct={controller.addProduct}
              removeProduct={controller.removeProduct}
              updateProduct={controller.updateProduct}
              addProductVariant={controller.addProductVariant}
              updateProductVariant={controller.updateProductVariant}
              removeProductVariant={controller.removeProductVariant}
              addProductUsage={controller.addProductUsage}
              updateProductUsage={controller.updateProductUsage}
              removeProductUsage={controller.removeProductUsage}
              addProductPackagingOption={controller.addProductPackagingOption}
              updateProductPackagingOption={controller.updateProductPackagingOption}
              removeProductPackagingOption={controller.removeProductPackagingOption}
              materialPickerOptions={controller.materialPickerOptions}
              packagingPickerOptions={controller.packagingPickerOptions}
              createMaterialFromName={controller.createMaterialFromName}
              createPackagingFromName={controller.createPackagingFromName}
              handleProductImageUpload={controller.handleProductImageUpload}
              clearProductImage={controller.clearProductImage}
              addMaterial={controller.addMaterial}
              updateMaterial={controller.updateMaterial}
              removeMaterial={controller.removeMaterial}
              addPackaging={controller.addPackaging}
              updatePackaging={controller.updatePackaging}
              removePackaging={controller.removePackaging}
              addMarketplace={controller.addMarketplace}
              updateMarketplace={controller.updateMarketplace}
              removeMarketplace={controller.removeMarketplace}
              addMarketplaceRule={controller.addMarketplaceRule}
              updateMarketplaceRule={controller.updateMarketplaceRule}
              removeMarketplaceRule={controller.removeMarketplaceRule}
            />
          )}

        {controller.section === "orcamentos" && (
          <QuotesSection
            appState={controller.appState}
            quoteDraft={controller.quoteDraft}
            setQuoteDraft={controller.setQuoteDraft}
            productPickerOptions={controller.productPickerOptions}
            marketplacePickerOptions={controller.marketplacePickerOptions}
            packagingPickerOptions={controller.packagingPickerOptions}
            createProductFromName={controller.createProductFromName}
            createMarketplaceFromName={controller.createMarketplaceFromName}
            createPackagingFromName={controller.createPackagingFromName}
            quickQuotePreview={controller.quickQuotePreview}
            addQuoteItem={controller.addQuoteItem}
            currentQuote={controller.currentQuote}
            setCurrentQuote={controller.setCurrentQuote}
            quoteTotals={controller.quoteTotals}
            removeQuoteItem={controller.removeQuoteItem}
            handleExportQuotePdf={controller.handleExportQuotePdf}
            saveQuote={controller.saveQuote}
          />
        )}

        {controller.section === "configuracoes" && (
          <SettingsSection
            settings={controller.appState.configuracoes}
            updateSettings={controller.updateSettings}
            storageMode={controller.storageMode}
            setStorageMode={controller.setStorageMode}
            cloudConfigured={controller.cloudConfigured}
            cloudInfo={controller.cloudInfo}
            cloudEmail={controller.cloudEmail}
            setCloudEmail={controller.setCloudEmail}
            cloudBusy={controller.cloudBusy}
            cloudStatus={controller.cloudStatus}
            handleCloudPullNow={controller.handleCloudPullNow}
            handleCloudPushNow={controller.handleCloudPushNow}
            handleCloudSignIn={controller.handleCloudSignIn}
            handleCloudSignOut={controller.handleCloudSignOut}
            handleExportBackup={controller.handleExportBackup}
            backupInputRef={controller.backupInputRef}
            handleImportBackup={controller.handleImportBackup}
            backupStatus={controller.backupStatus}
          />
        )}

        <datalist id="produto-categorias">
          {controller.productCategorySuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="produto-destaques">
          {controller.productHighlightSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="material-categorias">
          {controller.materialCategorySuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="material-fornecedores">
          {controller.materialSupplierSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="embalagem-tipos">
          {controller.packagingTypeSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="marketplace-tipos">
          {controller.marketplaceTypeSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </main>
    </div>
  );
}

export default App;
