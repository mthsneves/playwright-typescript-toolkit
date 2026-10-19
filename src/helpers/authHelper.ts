import { Page, expect } from "@playwright/test";

/**
 * Opções de configuração para o fluxo de autenticação resiliente.
 */
export interface PlaywrightLoginOptions {
  /** Caminho relativo ou rota hash da página de login (padrão: "/login") */
  loginPath?: string;
  /** Seletor do campo de e-mail ou usuário */
  emailSelector?: string;
  /** Seletor do campo de senha */
  passwordSelector?: string;
  /** Seletor do botão de submissão do login */
  submitSelector?: string;
  /** Seletor do modal de detecção de sessão concorrente */
  activeSessionModalSelector?: string;
  /** Seletor do botão de confirmação para desconectar outra sessão */
  confirmSessionSelector?: string;
  /** Seletor da mensagem de erro de credenciais inválidas */
  errorMessageSelector?: string;
  /** Tempo limite máximo para o fluxo em milissegundos (padrão: 15000) */
  timeout?: number;
}

/**
 * Helper para autenticação, controle de sessão e logout com resiliência.
 */
export class AuthHelper {
  constructor(protected page: Page) {}

  /**
   * Executa login na plataforma com limpeza prévia de contexto (cookies e storage),
   * tratamento de sessões concorrentes e asserção de redirecionamento.
   *
   * @param email E-mail do usuário (fallback: process.env.USER_EMAIL)
   * @param password Senha do usuário (fallback: process.env.USER_PASSWORD)
   * @param options Configurações de seletores e rotas de login
   */
  async loginPlatform(
    email?: string,
    password?: string,
    options?: PlaywrightLoginOptions
  ): Promise<void> {
    const userEmail = email || process.env.USER_EMAIL;
    const userPassword = password || process.env.USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error(
        "Credenciais de login não fornecidas. Informe email e senha como parâmetros ou configure as variáveis de ambiente USER_EMAIL e USER_PASSWORD."
      );
    }

    const loginPath = options?.loginPath ?? "/login";
    const emailSelector =
      options?.emailSelector ??
      'input[type="email"], input[name="email"], #txt-login-email, [data-testid="email-input"]';
    const passwordSelector =
      options?.passwordSelector ??
      'input[type="password"], input[name="password"], #txt-login-password, [data-testid="password-input"]';
    const submitSelector =
      options?.submitSelector ??
      'button[type="submit"], #btn-login-submit, [data-testid="login-submit"]';
    const activeSessionModalSelector =
      options?.activeSessionModalSelector ??
      '.modal-active-session, [data-testid="active-session-modal"]';
    const confirmSessionSelector =
      options?.confirmSessionSelector ??
      '.modal-active-session button.btn-confirm, [data-testid="confirm-session-btn"]';
    const errorMessageSelector =
      options?.errorMessageSelector ??
      '.alert-danger, .login-error-message, [data-testid="login-error"]';
    const timeout = options?.timeout ?? 15000;

    // 1. Limpa cookies do contexto antes de navegar
    await this.page.context().clearCookies();

    // 2. Navega até a rota de login preservando eventual hash routing (ex: "#/login")
    await this.page.goto(loginPath);

    // 3. Limpa localStorage e sessionStorage na origem carregada
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Ignora falhas em páginas com restrições ou about:blank
    }

    // 4. Preenche as credenciais e submete
    const emailInput = this.page.locator(emailSelector).first();
    const passwordInput = this.page.locator(passwordSelector).first();
    const submitBtn = this.page.locator(submitSelector).first();

    await emailInput.fill(userEmail, { timeout });
    await passwordInput.fill(userPassword, { timeout });
    await submitBtn.click({ timeout });

    // 5. Polling resiliente com tratamento de sessão concorrente e erros
    const cleanPath = loginPath.replace(/^#/, "");
    const startTime = Date.now();
    const pollInterval = 500;

    while (Date.now() - startTime < timeout) {
      // A. Trata modal de sessão concorrente / já ativa em outro dispositivo
      const modal = this.page.locator(activeSessionModalSelector).first();
      if (await modal.isVisible().catch(() => false)) {
        const confirmBtn = this.page.locator(confirmSessionSelector).first();
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click().catch(() => {});
        }
      }

      // B. Verifica mensagens de erro na tela (credenciais incorretas, conta bloqueada, etc.)
      const errorMsg = this.page.locator(errorMessageSelector).first();
      if (await errorMsg.isVisible().catch(() => false)) {
        const text = (await errorMsg.textContent().catch(() => ""))?.trim();
        throw new Error(`Falha no login: Mensagem de erro exibida na tela: "${text}"`);
      }

      // C. Verifica se navegou para fora da rota de login
      const currentUrl = this.page.url();
      if (!currentUrl.includes(cleanPath)) {
        return;
      }

      await this.page.waitForTimeout(pollInterval);
    }

    // Se esgotar o tempo, asserção explícita com mensagem descritiva
    const escapedCleanPath = cleanPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(
      this.page,
      `Login não concluiu em ${timeout}ms. A aplicação permaneceu na rota de login (${loginPath}).`
    ).not.toHaveURL(new RegExp(escapedCleanPath), { timeout: 1000 });
  }

  /**
   * Executa logout na aplicação, abrindo o menu de usuário e clicando no botão de saída,
   * seguido de limpeza de storage.
   *
   * @param options Configurações de seletores de menu e logout
   */
  async logout(options?: {
    menuSelector?: string;
    logoutBtnSelector?: string;
    timeout?: number;
  }): Promise<void> {
    const timeout = options?.timeout ?? 10000;
    const menuSelector =
      options?.menuSelector ??
      '[data-testid="user-menu"], .user-profile-menu, #user-dropdown';
    const logoutBtnSelector =
      options?.logoutBtnSelector ??
      '[data-testid="logout-btn"], .btn-logout, #id-userLogout-btn';

    // Abre o menu do usuário se estiver presente
    const menu = this.page.locator(menuSelector).first();
    if (await menu.isVisible().catch(() => false)) {
      await menu.click({ timeout });
    }

    // Aguarda o botão de logout aparecer e clica
    const logoutBtn = this.page.locator(logoutBtnSelector).first();
    await logoutBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click({ timeout });
    }

    // Limpa tokens armazenados
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Ignora erro se não for possível acessar o storage
    }
  }
}
