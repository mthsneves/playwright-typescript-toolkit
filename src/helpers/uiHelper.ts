import { Page, Locator, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { DataGenerator } from "../utils/dataGenerator";

/**
 * Helper de automação de interface do usuário e resiliência com Playwright.
 */
export class UIHelper {
  constructor(protected page: Page) {}

  /**
   * Converte uma string ou Locator no Locator correspondente.
   */
  protected toLocator(selectorOrLocator: string | Locator): Locator {
    return typeof selectorOrLocator === "string"
      ? this.page.locator(selectorOrLocator)
      : selectorOrLocator;
  }

  /**
   * Aguarda o carregamento da página por estados de DOM e Load.
   *
   * @param waitForNetworkIdle Quando true, também aguarda networkidle.
   * [Atenção]: O uso de networkidle é desencorajado pela documentação oficial do Playwright,
   * pois pode travar a execução indefinidamente em aplicações com long-polling, websockets ou requisições contínuas.
   */
  async waitForPageLoad(waitForNetworkIdle = false): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("load");

    if (waitForNetworkIdle) {
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Interage com um elemento executando ações comuns como click, type ou clear.
   * Por padrão, force é false para respeitar as checagens nativas de actionability do Playwright.
   *
   * @param selectorOrLocator Seletor CSS/XPath ou Locator do elemento
   * @param action Ação a ser executada ("click" | "containsClick" | "type" | "clear")
   * @param value Texto para preenchimento quando action for "type" ou filtro para "containsClick"
   * @param options Opções adicionais de force, timeout e sequentially
   */
  async interactWithElement(
    selectorOrLocator: string | Locator,
    action: "click" | "containsClick" | "type" | "clear",
    value?: string,
    options?: { force?: boolean; timeout?: number; sequentially?: boolean }
  ): Promise<void> {
    const timeout = options?.timeout ?? 10000;
    const force = options?.force ?? false;

    if (action === "containsClick") {
      const loc =
        typeof selectorOrLocator === "string"
          ? value
            ? this.page.locator(selectorOrLocator, { hasText: value })
            : this.page.locator(selectorOrLocator)
          : value
          ? selectorOrLocator.filter({ hasText: value })
          : selectorOrLocator;
      await loc.click({ timeout, force });
      return;
    }

    const locator = this.toLocator(selectorOrLocator);

    switch (action) {
      case "click":
        await locator.click({ timeout, force });
        break;
      case "type":
        if (options?.sequentially) {
          await locator.pressSequentially(value || "", { timeout, delay: 50 });
        } else {
          await locator.fill(value || "", { timeout, force });
        }
        break;
      case "clear":
        await locator.clear({ timeout, force });
        break;
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
  }

  /**
   * Aguarda explicitamente um elemento estar visível e habilitado antes de clicar.
   *
   * @param selectorOrLocator Seletor ou Locator do elemento
   * @param options Configurações de timeout e force
   */
  async clickWhenVisibleAndEnabled(
    selectorOrLocator: string | Locator,
    options?: { timeout?: number; force?: boolean }
  ): Promise<void> {
    const locator = this.toLocator(selectorOrLocator);
    const timeout = options?.timeout ?? 10000;
    await locator.waitFor({ state: "visible", timeout });
    await expect(locator).toBeEnabled({ timeout });
    await locator.click({ timeout, force: options?.force ?? false });
  }

  /**
   * Seleciona uma opção em um dropdown clicando no gatilho e depois na opção desejada.
   * Suporta getByRole("option") com fallback para <li> para compatibilidade com frameworks modernos.
   *
   * @param selectorOrLocator Gatilho do dropdown
   * @param optionText Texto visível da opção a selecionar
   * @param options Opções de timeout
   */
  async selectOptionWithText(
    selectorOrLocator: string | Locator,
    optionText: string,
    options?: { timeout?: number }
  ): Promise<void> {
    const timeout = options?.timeout ?? 10000;
    const trigger = this.toLocator(selectorOrLocator);
    await trigger.click({ timeout });

    const roleOption = this.page.getByRole("option", { name: optionText }).first();
    const liOption = this.page.locator("li", { hasText: optionText }).first();

    try {
      await roleOption.waitFor({ state: "visible", timeout: Math.min(timeout, 3000) });
      await roleOption.click({ timeout });
    } catch {
      await liOption.waitFor({ state: "visible", timeout });
      await liOption.click({ timeout });
    }
  }

  /**
   * Seleciona valor em campos autocomplete/combobox.
   * Utiliza pressSequentially com delay para disparar eventos reais de digitação.
   *
   * @param selectorOrLocator Campo de input do autocomplete
   * @param value Texto a ser pesquisado e selecionado
   * @param options Configurações opcionais de digitação, espera e timeout
   */
  async selectAutocomplete(
    selectorOrLocator: string | Locator,
    value: string,
    options?: { type?: boolean; waitTime?: number; timeout?: number }
  ): Promise<void> {
    const timeout = options?.timeout ?? 10000;
    const locator = this.toLocator(selectorOrLocator);

    if (options?.type) {
      await locator.click({ timeout });
      await locator.pressSequentially(value, { delay: 50, timeout });
    } else {
      await locator.click({ timeout });
    }

    if (options?.waitTime && options.waitTime > 0) {
      await this.page.waitForTimeout(options.waitTime);
    }

    const roleOption = this.page.getByRole("option", { name: value, exact: false }).first();
    const liOption = this.page.locator("li", { hasText: value }).first();

    try {
      await roleOption.waitFor({ state: "visible", timeout: Math.min(timeout, 3000) });
      await roleOption.click({ timeout });
    } catch {
      await liOption.waitFor({ state: "visible", timeout });
      await liOption.click({ timeout });
    }
  }

  /**
   * Clica repetidamente em um botão com tolerância a re-renderização até que o elemento alvo fique visível.
   * Lança erro com detalhes exatos de qual seletor falhou após timeout.
   *
   * @param buttonSelectorOrLocator Botão a ser clicado
   * @param targetSelectorOrLocator Elemento esperado após o clique
   * @param options Configurações de tentativas, intervalo e timeout
   */
  async clickUntilVisible(
    buttonSelectorOrLocator: string | Locator,
    targetSelectorOrLocator: string | Locator,
    options?: { maxAttempts?: number; interval?: number; timeout?: number }
  ): Promise<void> {
    const maxAttempts = options?.maxAttempts ?? 10;
    const interval = options?.interval ?? 500;
    const timeout = options?.timeout ?? 10000;

    const buttonLoc = this.toLocator(buttonSelectorOrLocator);
    const targetLoc = this.toLocator(targetSelectorOrLocator);

    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < timeout && attempts < maxAttempts) {
      attempts++;
      if (await targetLoc.isVisible().catch(() => false)) {
        return;
      }

      const isButtonVisible = await buttonLoc.isVisible().catch(() => false);
      if (isButtonVisible) {
        await buttonLoc.click().catch(() => {});
      }

      await this.page.waitForTimeout(interval);
    }

    if (await targetLoc.isVisible().catch(() => false)) {
      return;
    }

    const buttonVisibleAtEnd = await buttonLoc.isVisible().catch(() => false);
    const buttonDesc =
      typeof buttonSelectorOrLocator === "string"
        ? buttonSelectorOrLocator
        : "botão (Locator)";
    const targetDesc =
      typeof targetSelectorOrLocator === "string"
        ? targetSelectorOrLocator
        : "alvo (Locator)";

    if (!buttonVisibleAtEnd) {
      throw new Error(
        `clickUntilVisible falhou após ${attempts} tentativas (${timeout}ms): O botão "${buttonDesc}" não estava visível e o elemento alvo "${targetDesc}" não apareceu.`
      );
    } else {
      throw new Error(
        `clickUntilVisible falhou após ${attempts} tentativas (${timeout}ms): O botão "${buttonDesc}" foi clicado, mas o elemento alvo "${targetDesc}" não ficou visível.`
      );
    }
  }

  /**
   * Valida a presença de um ou múltiplos textos em um elemento.
   *
   * @param selectorOrLocator Seletor ou Locator do container/elemento
   * @param expectedTexts Texto ou array de textos esperados
   * @param options Configurações de timeout
   */
  async validateTextInElement(
    selectorOrLocator: string | Locator,
    expectedTexts: string | string[],
    options?: { timeout?: number }
  ): Promise<void> {
    const locator = this.toLocator(selectorOrLocator);
    const timeout = options?.timeout ?? 10000;
    const texts = Array.isArray(expectedTexts) ? expectedTexts : [expectedTexts];

    for (const text of texts) {
      await expect(locator).toContainText(text, { timeout });
    }
  }

  /**
   * Preenche múltiplos campos de formulário dinamicamente, suportando autocompletes e digitação sequencial.
   *
   * @param fields Lista de campos a preencher
   */
  async searchForm(
    fields: Array<{
      selector: string | Locator;
      value: string;
      type?: "input" | "autocomplete";
      sequentially?: boolean;
      optionIndex?: number;
      useOptionIndex?: boolean;
    }>
  ): Promise<void> {
    for (const field of fields) {
      const locator = this.toLocator(field.selector);
      const fieldType = field.type ?? "input";

      if (fieldType === "autocomplete") {
        const idx = field.optionIndex ?? (field.useOptionIndex ? 0 : 0);
        await this.selectAutocomplete(locator, field.value, {
          type: true,
          timeout: 5000,
        });
        if (idx > 0) {
          const option = this.page.getByRole("option").nth(idx);
          if (await option.isVisible().catch(() => false)) {
            await option.click();
          }
        }
      } else {
        if (field.sequentially) {
          await locator.pressSequentially(field.value, { delay: 50 });
        } else {
          await locator.fill(field.value);
        }
      }
    }
  }

  /**
   * Recarrega a página repetidamente até que um elemento ou texto esperado fique visível.
   * Utiliza espera inteligente após reload e comparação com allTextContents normalizado.
   *
   * @param selectorOrLocator Elemento a ser verificado
   * @param textOrOptions Texto esperado ou objeto de opções
   * @param optionsObj Opções adicionais quando texto for passado como segundo parâmetro
   */
  async reloadUntilVisible(
    selectorOrLocator: string | Locator,
    textOrOptions?:
      | string
      | {
          text?: string;
          maxAttempts?: number;
          intervalMs?: number;
          initialWaitMs?: number;
        },
    optionsObj?: {
      maxAttempts?: number;
      intervalMs?: number;
      initialWaitMs?: number;
    }
  ): Promise<void> {
    let expectedText: string | undefined;
    let maxAttempts = 5;
    let intervalMs = 3000;
    let initialWaitMs = 1000;

    if (typeof textOrOptions === "string") {
      expectedText = textOrOptions;
      if (optionsObj) {
        maxAttempts = optionsObj.maxAttempts ?? maxAttempts;
        intervalMs = optionsObj.intervalMs ?? intervalMs;
        initialWaitMs = optionsObj.initialWaitMs ?? initialWaitMs;
      }
    } else if (textOrOptions && typeof textOrOptions === "object") {
      expectedText = textOrOptions.text;
      maxAttempts = textOrOptions.maxAttempts ?? maxAttempts;
      intervalMs = textOrOptions.intervalMs ?? intervalMs;
      initialWaitMs = textOrOptions.initialWaitMs ?? initialWaitMs;
    }

    const locator = this.toLocator(selectorOrLocator);

    if (initialWaitMs > 0) {
      await this.page.waitForTimeout(initialWaitMs);
    }

    const checkMatch = async (): Promise<boolean> => {
      if (!expectedText) {
        return await locator.isVisible().catch(() => false);
      }
      const contents = await locator.allTextContents().catch(() => []);
      const normalizedExpected = DataGenerator.normalizeText(expectedText);
      return contents.some((content) =>
        DataGenerator.normalizeText(content).includes(normalizedExpected)
      );
    };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (await checkMatch()) {
        return;
      }

      await this.page.reload();

      // Tenta espera rápida de até 2s após reload
      if (expectedText) {
        try {
          await expect(locator).toContainText(expectedText, { timeout: 2000 });
          if (await checkMatch()) return;
        } catch {
          // Continua para o intervalo restante
        }
      } else {
        try {
          await locator.waitFor({ state: "visible", timeout: 2000 });
          return;
        } catch {
          // Continua para o intervalo restante
        }
      }

      const remainingWait = Math.max(0, intervalMs - 2000);
      if (remainingWait > 0 && attempt < maxAttempts) {
        await this.page.waitForTimeout(remainingWait);
      }
    }

    const selectorDesc =
      typeof selectorOrLocator === "string"
        ? selectorOrLocator
        : "elemento (Locator)";
    throw new Error(
      `reloadUntilVisible: Elemento "${selectorDesc}" ${
        expectedText ? `com texto "${expectedText}" ` : ""
      }não ficou visível após ${maxAttempts} recarregamentos.`
    );
  }

  /**
   * Monitora e valida nativamente o download de um arquivo disparado por uma ação.
   * Retorna o nome sugerido do arquivo (retrocompatível).
   *
   * @param triggerAction Função assíncrona que dispara o download (ex: clicar em um botão)
   * @param options Configurações de timeout
   * @returns Nome sugerido do arquivo baixado
   */
  async validateDownload(
    triggerAction: () => Promise<void>,
    options?: { timeout?: number }
  ): Promise<string> {
    const timeout = options?.timeout ?? 30000;
    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout }),
      triggerAction(),
    ]);

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    return download.suggestedFilename();
  }

  /**
   * Monitora, valida e opcionalmente salva o download de um arquivo em disco.
   *
   * @param triggerAction Função assíncrona que dispara o download
   * @param saveTo Diretório de destino para salvar o arquivo (ex: "downloads")
   * @param options Configurações de timeout
   * @returns Objeto com o nome do arquivo e o caminho absoluto onde foi salvo
   */
  async validateDownloadDetailed(
    triggerAction: () => Promise<void>,
    saveTo?: string,
    options?: { timeout?: number }
  ): Promise<{ fileName: string; path: string }> {
    const timeout = options?.timeout ?? 30000;
    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout }),
      triggerAction(),
    ]);

    const tempPath = await download.path();
    expect(tempPath).not.toBeNull();

    const fileName = download.suggestedFilename();
    let finalPath = tempPath!;

    if (saveTo) {
      const targetDir = path.resolve(saveTo);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      finalPath = path.join(targetDir, fileName);
      await download.saveAs(finalPath);
    }

    return { fileName, path: finalPath };
  }

  /**
   * Preenche um campo com um nome gerado dinamicamente e retorna o valor preenchido.
   */
  async fillGeneratedName(
    selectorOrLocator: string | Locator,
    prefix = "Usuario",
    options?: { timeout?: number }
  ): Promise<string> {
    const generated = DataGenerator.fullName(prefix);
    const locator = this.toLocator(selectorOrLocator);
    await locator.fill(generated, { timeout: options?.timeout ?? 10000 });
    return generated;
  }

  /**
   * Preenche um campo com um e-mail gerado dinamicamente e retorna o valor preenchido.
   */
  async fillGeneratedEmail(
    selectorOrLocator: string | Locator,
    prefix = "teste",
    options?: { timeout?: number }
  ): Promise<string> {
    const generated = DataGenerator.email(prefix);
    const locator = this.toLocator(selectorOrLocator);
    await locator.fill(generated, { timeout: options?.timeout ?? 10000 });
    return generated;
  }

  /**
   * Preenche um campo com um CPF gerado dinamicamente e retorna o valor preenchido.
   */
  async fillGeneratedCPF(
    selectorOrLocator: string | Locator,
    formatted = true,
    options?: { timeout?: number }
  ): Promise<string> {
    const generated = DataGenerator.cpf(formatted);
    const locator = this.toLocator(selectorOrLocator);
    await locator.fill(generated, { timeout: options?.timeout ?? 10000 });
    return generated;
  }

  /**
   * Preenche um campo com um CNPJ gerado dinamicamente e retorna o valor preenchido.
   */
  async fillGeneratedCNPJ(
    selectorOrLocator: string | Locator,
    formatted = true,
    options?: { timeout?: number }
  ): Promise<string> {
    const generated = DataGenerator.cnpj(formatted);
    const locator = this.toLocator(selectorOrLocator);
    await locator.fill(generated, { timeout: options?.timeout ?? 10000 });
    return generated;
  }

  /**
   * Preenche um campo com um telefone celular gerado dinamicamente e retorna o valor preenchido.
   */
  async fillGeneratedPhone(
    selectorOrLocator: string | Locator,
    formatted = true,
    options?: { timeout?: number }
  ): Promise<string> {
    const generated = DataGenerator.phone(formatted);
    const locator = this.toLocator(selectorOrLocator);
    await locator.fill(generated, { timeout: options?.timeout ?? 10000 });
    return generated;
  }
}
