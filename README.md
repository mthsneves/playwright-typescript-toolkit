# Playwright TypeScript Toolkit 🎭⚡

[![Playwright Tests CI](https://github.com/mthsneves/playwright-typescript-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/mthsneves/playwright-typescript-toolkit/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58+-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Boilerplate e toolkit de nível sênior para automação de testes End-to-End (E2E) e de API utilizando Playwright e TypeScript.**  
> Desenvolvido com foco em alta resiliência, auto-waiting nativo, injeção desacoplada via custom fixtures, geração e validação de massas de dados brasileiras (CPF, CNPJ, telefone celular) e integração contínua (CI/CD).

---

## 📋 Sumário
1. [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
2. [Pré-requisitos](#-pré-requisitos)
3. [Instalação e Quick Start](#-instalação-e-quick-start)
4. [Estrutura do Repositório](#-estrutura-do-repositório)
5. [Documentação Completa de Utilitários e Helpers](#-documentação-completa-de-utilitários-e-helpers)
   - [DataGenerator (Geração e Validação de Dados)](#1-datagenerator-srcutilsdatageneratorts)
   - [UIHelper (Interações Resilientes e UI)](#2-uihelper-srchelpersuihelperts)
   - [AuthHelper (Login e Controle de Sessão)](#3-authhelper-srchelpersauthhelperts)
   - [ApiHelper (API Seeding e Requisições REST)](#4-apihelper-srchelpersapihelperts)
   - [Custom Fixtures (test.extend)](#5-custom-fixtures-srcfixturescustomfixturests)
6. [Configuração de Ambientes Multi-Env](#-configuração-de-ambientes-multi-env)
7. [Diferenças Chave em Relação ao Cypress](#-diferenças-chave-em-relação-ao-cypress)
8. [Boas Práticas de Automação](#-boas-práticas-de-automação)
9. [Como Adotar em Outro Projeto](#-como-adotar-em-outro-projeto)
10. [Scripts Disponíveis](#-scripts-disponíveis)
11. [Pipeline CI/CD](#-pipeline-cicd)
12. [Licença e Autoria](#-licença-e-autoria)

---

## 🏛️ Visão Geral e Arquitetura

O **Playwright TypeScript Toolkit** foi projetado para superar as fragilidades e limitações comuns em suites de testes legadas (como esperas estáticas cegas, comandos globais acoplados e testes instáveis):

```
                        ┌────────────────────────┐
                        │   Playwright Runner    │
                        │     (test.extend)      │
                        └───────────┬────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
   ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
   │    Fixture    │        │    Fixture    │        │    Fixture    │
   │     "ui"      │        │    "auth"     │        │     "api"     │
   │  (UIHelper)   │        │ (AuthHelper)  │        │  (ApiHelper)  │
   └───────┬───────┘        └───────┬───────┘        └───────┬───────┘
           │                        │                        │
           ▼                        ▼                        ▼
   ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
   │ Page Actions  │        │ Sessão / Auth │        │  API Seeding  │
   │ Auto-waiting  │        │ Token Storage │        │ Injeção Dados │
   └───────┬───────┘        └───────────────┘        └───────────────┘
           │
           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                  DataGenerator (Massa de Dados)                 │
   │   CPF / CNPJ (Válidos + Validadores) | Emails | Celulares BR    │
   └─────────────────────────────────────────────────────────────────┘
```

### Principais Pilares:
- **Resiliência Real**: Sem `waitForTimeout` estático. Todo polling é determinístico, baseado no estado real do DOM e tolerante a re-renderizações.
- **Actionability Preservada**: `force: false` por padrão, respeitando as regras nativas do Playwright para garantir que o usuário real consiga interagir com os elementos.
- **Fixtures Tipadas**: Injeção direta de `ui`, `auth` e `api` sem poluir o escopo global e com autocompletion inteligente no VS Code.
- **Massas de Dados Realistas**: Algoritmos estritos de dígitos verificadores para CPF e CNPJ com distribuição equiprovável de números e funções de validação incluídas.
- **Testes Híbridos (API Seeding)**: Crie registros no banco de dados via API em ~100ms e teste apenas a jornada crítica na UI.

---

## ⚙️ Pré-requisitos

- **Node.js**: versão `>= 18.0.0` (recomendado v20+ LTS).
- **NPM**: versão `>= 9.0.0`.
- **Git**: instalado e configurado no sistema.

---

## 🚀 Instalação e Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/mthsneves/playwright-typescript-toolkit.git
cd playwright-typescript-toolkit

# 2. Instale as dependências
npm install

# 3. Instale o navegador Chromium gerenciado pelo Playwright
npx playwright install chromium

# 4. Execute a suíte de testes de validação
npm test
```

### Exemplo Rápido de Teste (Quick Start):

```typescript
import { test, expect } from "./src";

test("meu primeiro teste com o toolkit", async ({ page, ui }) => {
  await page.goto("https://demo.playwright.dev/todomvc");
  await ui.waitForPageLoad();

  // Preenche dinamicamente com nome aleatório
  const item = await ui.fillGeneratedName(".new-todo", "Aprender");
  await page.keyboard.press("Enter");

  // Valida presença na lista
  await ui.validateTextInElement(".todo-list", item);
});
```

---

## 📁 Estrutura do Repositório

```text
playwright-typescript-toolkit/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Pipeline GitHub Actions (typecheck, tests, artifacts)
├── config/
│   ├── .env.example                  # Template com variáveis de ambiente padrão
│   └── .env.qa                       # Exemplo de configuração específica (ignorado no git)
├── docs/
│   └── EXEMPLOS.md                   # 5 cenários práticos e funcionais detalhados
├── downloads/
│   └── .gitkeep                      # Diretório monitorado para downloads em testes
├── src/
│   ├── fixtures/
│   │   └── customFixtures.ts         # Fixtures personalizadas (ui, auth, api via test.extend)
│   ├── helpers/
│   │   ├── apiHelper.ts              # Requisições REST, autenticação e seeding de dados
│   │   ├── authHelper.ts             # Login resiliente, bypass de sessões e logout
│   │   └── uiHelper.ts               # Helpers de UI, actionability, polling e downloads
│   ├── utils/
│   │   └── dataGenerator.ts          # Geração e validação de massas brasileiras
│   └── index.ts                      # Ponto único de exportação da biblioteca
├── tests/
│   └── smoke/
│       ├── dataGenerator.spec.ts     # Smoke tests unitários de massa de dados
│       ├── fixtures.spec.ts          # Smoke tests de injeção e API (mock HTTP local)
│       └── uiHelper.spec.ts          # Smoke tests E2E de UI (TodoMVC + páginas dinâmicas)
├── .gitignore                        # Regras estritas de exclusão de artefatos temporários
├── CHANGELOG.md                      # Histórico de versões e mudanças de comportamento
├── LICENSE                           # Licença MIT (Matheus Neves)
├── package.json                      # Configuração do projeto, dependências e scripts
├── playwright.config.ts              # Configuração do Playwright com suporte multi-env
├── README.md                         # Documentação principal
└── tsconfig.json                     # Configuração do TypeScript (strict, CommonJS, ES2020)
```

---

## 📖 Documentação Completa de Utilitários e Helpers

### 1. `DataGenerator` (`src/utils/dataGenerator.ts`)

Classe estática com utilitários para geração e validação de dados dinâmicos e sem colisões.

| Método | Assinatura | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `cpf` | `cpf(formatted = true): string` | Gera CPF matematicamente válido com distribuição uniforme, descartando sequências com todos os dígitos iguais. | `const cpf = DataGenerator.cpf();` |
| `isValidCpf` | `isValidCpf(cpf: string): boolean` | Valida se um CPF atende às regras da Receita Federal (com ou sem máscara). | `DataGenerator.isValidCpf("111.111.111-11"); // false` |
| `cnpj` | `cnpj(formatted = true): string` | Gera CNPJ matematicamente válido com filial padrão `0001`. | `const cnpj = DataGenerator.cnpj(false);` |
| `isValidCnpj` | `isValidCnpj(cnpj: string): boolean` | Valida se um CNPJ possui dígitos verificadores corretos. | `DataGenerator.isValidCnpj("11.222.333/0001-81");` |
| `email` | `email(prefix = "teste"): string` | Gera e-mail único com timestamp e hash para evitar colisão em testes concorrentes. | `const email = DataGenerator.email("qa");` |
| `phone` | `phone(formatted = true): string` | Gera número de celular nacional com DDD (11-99) no formato móvel brasileiro. | `const fone = DataGenerator.phone(true);` |
| `fullName` | `fullName(prefix = "Usuario"): string` | Gera nome acompanhado de identificador alfanumérico único. | `const nome = DataGenerator.fullName("Cliente");` |
| `uniqueHash` | `uniqueHash(length = 8): string` | Gera hash alfanumérico aleatório do tamanho desejado. | `const hash = DataGenerator.uniqueHash(6);` |
| `normalizeText`| `normalizeText(text: string): string` | Remove acentuação/diacríticos, substitui espaços extras e converte para minúsculas. | `DataGenerator.normalizeText(" Ação "); // "acao"` |

---

### 2. `UIHelper` (`src/helpers/uiHelper.ts`)

Injetado automaticamente através da fixture `ui`. Facilita interações complexas de tela e garante estabilidade.

| Método | Assinatura | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `waitForPageLoad` | `waitForPageLoad(waitForNetworkIdle = false): Promise<void>` | Aguarda os estados `domcontentloaded` e `load`. Opcionalmente aguarda `networkidle`. | `await ui.waitForPageLoad();` |
| `interactWithElement` | `interactWithElement(el, action, val?, opts?): Promise<void>` | Executa ações comuns (`click`, `containsClick`, `type`, `clear`). Por padrão, `force: false`. | `await ui.interactWithElement("#input", "type", "Valor");` |
| `clickWhenVisibleAndEnabled` | `clickWhenVisibleAndEnabled(el, opts?): Promise<void>` | Aguarda explicitamente o elemento estar visível e habilitado antes do clique. | `await ui.clickWhenVisibleAndEnabled("#btn-confirmar");` |
| `selectOptionWithText` | `selectOptionWithText(el, optionText, opts?): Promise<void>` | Abre o dropdown e clica na opção usando `getByRole("option")` com fallback para `li`. | `await ui.selectOptionWithText("#combo", "São Paulo");` |
| `selectAutocomplete` | `selectAutocomplete(el, value, opts?): Promise<void>` | Digita via `pressSequentially` (delay 50ms) e clica na opção correspondente. | `await ui.selectAutocomplete("#cidade", "Curitiba", { type: true });` |
| `clickUntilVisible` | `clickUntilVisible(btn, target, opts?): Promise<void>` | Clica repetidamente até o alvo aparecer, com tolerância a re-renderizações. | `await ui.clickUntilVisible(".item", ".btn-remover");` |
| `validateTextInElement` | `validateTextInElement(el, texts, opts?): Promise<void>` | Valida a presença de um ou múltiplos textos em um elemento container. | `await ui.validateTextInElement(".card", ["Confirmado", "R$ 100"]);` |
| `searchForm` | `searchForm(fields): Promise<void>` | Preenche múltiplos campos dinamicamente, suportando autocompletes e digitação com atraso. | `await ui.searchForm([{ selector: "#nome", value: "Carlos" }]);` |
| `reloadUntilVisible` | `reloadUntilVisible(el, textOrOpts?, opts?): Promise<void>` | Recarrega a página em loop inteligente até que o texto normalizado apareça no elemento. | `await ui.reloadUntilVisible(".badge", "CONCLUÍDO");` |
| `validateDownload` | `validateDownload(triggerAction, opts?): Promise<string>` | Monitora o evento nativo de download e retorna o nome sugerido do arquivo. | `const file = await ui.validateDownload(() => btn.click());` |
| `validateDownloadDetailed`| `validateDownloadDetailed(triggerAction, saveTo?, opts?): Promise<{ fileName, path }>` | Valida o download e salva o arquivo no diretório especificado em disco. | `const res = await ui.validateDownloadDetailed(trigger, "downloads");` |
| `fillGeneratedName` | `fillGeneratedName(el, prefix?, opts?): Promise<string>` | Preenche campo com nome dinâmico e retorna o valor preenchido. | `const nome = await ui.fillGeneratedName("#nome");` |
| `fillGeneratedEmail`| `fillGeneratedEmail(el, prefix?, opts?): Promise<string>` | Preenche com e-mail único e retorna o valor preenchido. | `const email = await ui.fillGeneratedEmail("#email");` |
| `fillGeneratedCPF` | `fillGeneratedCPF(el, formatted?, opts?): Promise<string>` | Preenche com CPF válido e retorna o valor preenchido. | `const cpf = await ui.fillGeneratedCPF("#cpf");` |
| `fillGeneratedCNPJ`| `fillGeneratedCNPJ(el, formatted?, opts?): Promise<string>` | Preenche com CNPJ válido e retorna o valor preenchido. | `const cnpj = await ui.fillGeneratedCNPJ("#cnpj");` |
| `fillGeneratedPhone`| `fillGeneratedPhone(el, formatted?, opts?): Promise<string>` | Preenche com celular brasileiro e retorna o valor preenchido. | `const tel = await ui.fillGeneratedPhone("#tel");` |

---

### 3. `AuthHelper` (`src/helpers/authHelper.ts`)

Injetado automaticamente através da fixture `auth`. Gerencia login resiliente e encerramento de sessão.

| Método | Assinatura | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `loginPlatform` | `loginPlatform(email?, password?, opts?): Promise<void>` | Limpa cookies/storage, suporta rotas hash (`#/login`), trata modal de sessão ativa concorrente, detecta mensagens de erro e assegura redirecionamento. | `await auth.loginPlatform("qa@empresa.com", "senha123");` |
| `logout` | `logout(opts?): Promise<void>` | Abre o menu de perfil do usuário, clica no botão de logout após espera explícita e limpa o storage. | `await auth.logout();` |

---

### 4. `ApiHelper` (`src/helpers/apiHelper.ts`)

Injetado automaticamente através da fixture `api`. Executa operações diretas no backend.

| Método | Assinatura | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `loginViaAPI` | `loginViaAPI(user?, pass?, loginEndpoint?): Promise<string>` | Autentica diretamente na API e extrai o token JWT retornado. | `const token = await api.loginViaAPI("user", "pass");` |
| `seedRecordViaAPI`| `seedRecordViaAPI<T>(endpoint, payload, token?): Promise<T>` | Cria registros rápidos no backend via POST e retorna a resposta tipada `<T>`. | `const res = await api.seedRecordViaAPI<Item>("/pedidos", dados, token);` |

---

### 5. `Custom Fixtures` (`src/fixtures/customFixtures.ts`)

Extensão nativa do Playwright que disponibiliza os helpers de forma lazy:

```typescript
import { test, expect } from "./src";

test("Exemplo com múltiplas fixtures", async ({ page, ui, auth, api }) => {
  // ui   -> Instância de UIHelper
  // auth -> Instância de AuthHelper
  // api  -> Instância de ApiHelper (valida se API_BASE_URL está configurada)
});
```

---

## 🌐 Configuração de Ambientes Multi-Env

O carregamento de variáveis baseia-se em `TEST_ENV` gerenciado pelo `cross-env`:

1. Copie o template para os ambientes necessários:
   ```bash
   cp config/.env.example config/.env.qa
   cp config/.env.example config/.env.staging
   cp config/.env.example config/.env.prod
   ```
2. Configure as credenciais no arquivo correspondente:
   ```properties
   BASE_URL=https://qa.sua-aplicacao.com
   API_BASE_URL=https://api-qa.sua-aplicacao.com
   USER_EMAIL=automacao.qa@empresa.com
   USER_PASSWORD=SenhaSegura@123
   ```
3. Execute apontando para o ambiente desejado:
   ```bash
   npm run test:qa       # Utiliza config/.env.qa
   npm run test:staging  # Utiliza config/.env.staging
   npm run test:prod     # Utiliza config/.env.prod
   ```

> [!NOTE]
> Se `config/.env.<TEST_ENV>` não existir, o toolkit emite um aviso no console (`console.warn`) e prossegue com as variáveis do sistema ou do arquivo `.env` da raiz, evitando falhas de inicialização.

---

## ⚖️ Diferenças Chave em Relação ao Cypress

| Recurso / Conceito | Cypress Legado | Playwright TypeScript Toolkit |
| :--- | :--- | :--- |
| **Actionability & Auto-waiting** | Depende de plugins ou chamadas repetidas; uso frequente de `{ force: true }` mascarando defeitos visuais. | Auto-waiting nativo do Playwright com `force: false` por padrão, verificando visibilidade, estabilidade e receptividade. |
| **Comandos Globais vs Fixtures** | Poluição do objeto global `cy.*` com `Cypress.Commands.add` e arquivos complexos de tipagem (`index.d.ts`). | **Custom Fixtures isoladas** via `test.extend<CustomFixtures>`. Tipagem estrita e autocomplete perfeito no editor. |
| **Downloads de Arquivos** | Necessitava de tarefas Node.js (`cy.task`) e leitura de disco via bibliotecas externas (`glob`). | Captura nativa assíncrona com `page.waitForEvent("download")` sem depender do sistema operacional. |
| **Requisições de API** | Enfileiradas na mesma fila de execução da interface (`cy.request`). | Chamadas assíncronas reais (`async/await`) via `APIRequestContext`, executando de forma instantânea. |
| **Isolamento de Sessão** | `cy.session` persiste em cache proprietário do navegador. | `AuthHelper` gerencia cookies e storage nativos do `BrowserContext` de forma limpa por teste. |

---

## 🏆 Boas Práticas de Automação

1. **Priorize Localizadores Acessíveis**:
   - Utilize seletores resilientes e orientados ao usuário: `getByRole`, `getByLabel`, `getByTestId` e `getByText`.
2. **Elimine Esperas Estáticas (`waitForTimeout`)**:
   - Nunca utilize pausas cegas. Confie no auto-waiting do Playwright ou em helpers como `reloadUntilVisible` e `clickUntilVisible`.
3. **Evite `networkidle` em Aplicações Reativas**:
   - `networkidle` pode travar a automação em aplicações com websockets ou polling constante. Prefira aguardar o elemento ou uma rota específica via `page.waitForResponse`.
4. **Use API Seeding para Geração de Massa**:
   - Não crie cadastros complexos via UI apenas para servir de pré-requisito para outro teste. Injete os dados via `api.seedRecordViaAPI` em milissegundos.
5. **Aproveite o `storageState` para Pular Telas de Login**:
   - Em suítes extensas, autentique-se uma vez no setup global e compartilhe o arquivo de estado entre os testes para economizar minutos de execução.

---

## 📦 Como Adotar em Outro Projeto

1. Copie o diretório `src/` para o seu projeto.
2. Instale as dependências:
   ```bash
   npm i -D @playwright/test typescript dotenv @types/node cross-env
   ```
3. Integre as configurações do `playwright.config.ts` à sua suite.
4. Importe e utilize diretamente:
   ```typescript
   import { test, expect, DataGenerator } from "./src";
   ```

---

## 🧪 Scripts Disponíveis

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| `npm test` | `playwright test` | Executa todos os testes em modo headless com Chromium |
| `npm run test:headed` | `playwright test --headed` | Executa os testes abrindo o navegador visível |
| `npm run test:ui` | `playwright test --ui` | Abre o **Playwright UI Mode** interativo para depuração visual passo a passo |
| `npm run test:qa` | `cross-env TEST_ENV=qa playwright test` | Executa os testes apontando para `config/.env.qa` |
| `npm run test:staging` | `cross-env TEST_ENV=staging playwright test` | Executa os testes apontando para `config/.env.staging` |
| `npm run test:prod` | `cross-env TEST_ENV=prod playwright test` | Executa os testes apontando para `config/.env.prod` |
| `npm run report` | `playwright show-report` | Exibe o relatório HTML detalhado da última execução |
| `npm run typecheck` | `tsc --noEmit` | Executa validação de tipos TypeScript sem gerar arquivos |

---

## 🔄 Pipeline CI/CD

O repositório inclui um workflow otimizado para o **GitHub Actions** ([.github/workflows/ci.yml](file:///.github/workflows/ci.yml)):
- Executa em Ubuntu com Node.js 20 LTS e cache de dependências NPM.
- Instala o Chromium com as bibliotecas nativas do sistema operacional.
- Executa validação estrita de tipos (`npm run typecheck`).
- Roda todos os testes de forma paralela (`npm test`).
- Faz upload automático do relatório HTML do Playwright como artefato (`if: always()`).

---

## 📄 Licença e Autoria

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

**Autor**: Matheus Neves  
**E-mail**: mthsnevesdev@outlook.com  
**Repositório**: [https://github.com/mthsneves/playwright-typescript-toolkit](https://github.com/mthsneves/playwright-typescript-toolkit)
