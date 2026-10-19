import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Carrega variáveis de ambiente baseadas em TEST_ENV (qa, staging, prod).
 * Se config/.env.<TEST_ENV> não existir, não derruba a execução e registra um aviso com console.warn.
 */
const testEnv = process.env.TEST_ENV;
if (testEnv) {
  const envPath = path.resolve(__dirname, 'config', `.env.${testEnv}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.warn(`[Aviso] Arquivo de configuração de ambiente não encontrado: ${envPath}. Prosseguindo com variáveis do sistema/padrão.`);
  }
} else {
  // Carrega .env padrão da raiz se existir
  dotenv.config();
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://demo.playwright.dev/todomvc',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
