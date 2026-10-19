import { APIRequestContext } from "@playwright/test";

/**
 * Helper para operações de API e injeção de dados (API Seeding) em testes Playwright.
 */
export class ApiHelper {
  private request: APIRequestContext;
  private baseUrl: string;

  /**
   * Inicializa o ApiHelper com o contexto de requisição e a URL base da API.
   *
   * @param request Instância de APIRequestContext do Playwright
   * @param baseUrl URL base da API (ex: https://api.exemplo.com)
   */
  constructor(request: APIRequestContext, baseUrl = "") {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * Normaliza a concatenação da URL base com o endpoint, evitando barras duplicadas ou ausentes.
   *
   * @param endpoint Caminho relativo ou URL absoluta
   * @returns URL normalizada
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    const cleanBase = (this.baseUrl || "").replace(/\/+$/, "");
    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    return cleanBase ? `${cleanBase}/${cleanEndpoint}` : `/${cleanEndpoint}`;
  }

  /**
   * Realiza login diretamente via API para obtenção de token de autenticação.
   *
   * @param username Usuário ou e-mail (fallback: process.env.USER_EMAIL)
   * @param password Senha do usuário (fallback: process.env.USER_PASSWORD)
   * @param loginEndpoint Endpoint de autenticação (padrão: "/api/v1/auth/login")
   * @returns Token de autenticação extraído da resposta
   */
  async loginViaAPI(
    username?: string,
    password?: string,
    loginEndpoint = "/api/v1/auth/login"
  ): Promise<string> {
    const user = username || process.env.USER_EMAIL || "";
    const pass = password || process.env.USER_PASSWORD || "";

    const url = this.buildUrl(loginEndpoint);
    const response = await this.request.post(url, {
      data: {
        username: user,
        email: user,
        password: pass,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`Falha no login via API [Status ${response.status()}]: ${errorBody}`);
    }

    const data = await response.json();
    const token =
      data.token ||
      data.accessToken ||
      data.access_token ||
      data.data?.token ||
      "";

    return token;
  }

  /**
   * Realiza injeção rápida de registros/massa de dados no backend via requisição POST.
   *
   * @param endpoint Endpoint para criação do registro
   * @param payload Objeto/massa de dados a ser enviado no corpo da requisição
   * @param token Token de autenticação JWT/Bearer opcional
   * @returns Resposta tipada com o registro criado
   */
  async seedRecordViaAPI<T = unknown>(
    endpoint: string,
    payload: unknown,
    token?: string
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await this.request.post(url, {
      data: payload,
      headers,
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`Falha no seeding de registro via API [Status ${response.status()}]: ${errorBody}`);
    }

    return (await response.json()) as T;
  }
}
