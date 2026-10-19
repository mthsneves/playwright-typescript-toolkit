import { test as baseTest, expect } from "@playwright/test";
import { UIHelper } from "../helpers/uiHelper";
import { AuthHelper } from "../helpers/authHelper";
import { ApiHelper } from "../helpers/apiHelper";

/**
 * Definição dos tipos das fixtures customizadas do toolkit.
 */
export type CustomFixtures = {
  /** Instância do UIHelper com utilitários de interface e resiliência */
  ui: UIHelper;
  /** Instância do AuthHelper com fluxos de autenticação resilientes */
  auth: AuthHelper;
  /** Instância do ApiHelper com suporte a chamadas de API e seeding */
  api: ApiHelper;
};

/**
 * Runner de testes estendido com as fixtures de automação customizadas.
 */
export const test = baseTest.extend<CustomFixtures>({
  ui: async ({ page }, use) => {
    await use(new UIHelper(page));
  },
  auth: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },
  api: async ({ request }, use) => {
    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "A variável de ambiente API_BASE_URL não está configurada. Defina API_BASE_URL no arquivo de configuração (.env ou config/.env.*) para utilizar a fixture 'api'."
      );
    }
    await use(new ApiHelper(request, baseUrl));
  },
});

export { expect };
