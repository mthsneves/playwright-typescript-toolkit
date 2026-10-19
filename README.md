# Playwright TS Toolkit 🎭⚡

[![Playwright Tests CI](https://github.com/matheusneves/playwright-ts-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/matheusneves/playwright-ts-toolkit/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58+-green.svg)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Boilerplate e toolkit corporativo para automação de testes End-to-End e de API com Playwright e TypeScript.**  
> Projetado com foco em resiliência, tipagem estrita, isolamento de fixtures, geração e validação de massas brasileiras (CPF, CNPJ, telefone) e execução contínua via CI/CD.

---

## 📋 Sumário
1. [Visão Geral](#-visão-geral)
2. [Pré-requisitos](#-pré-requisitos)
3. [Instalação](#-instalação)
4. [Estrutura do Projeto](#-estrutura-do-projeto)
5. [Tabela de Métodos e Utilitários](#-tabela-de-métodos-e-utilitários)
   - [DataGenerator](#1-datagenerator-srcutilsdatageneratorts)
   - [UIHelper](#2-uihelper-srchelpersuihelperts)
   - [AuthHelper](#3-authhelper-srchelpersauthhelperts)
   - [ApiHelper](#4-apihelper-srchelpersapihelperts)
6. [Configuração de Ambientes](#-configuração-de-ambientes-multi-env)
7. [Como Utilizar este Toolkit em Outro Projeto](#-como-utilizar-este-toolkit-em-outro-projeto)
8. [Diferenças em Relação ao Cypress](#-diferenças-em-relação-ao-cypress)
9. [Boas Práticas de Automação](#-boas-práticas-de-automação)
10. [Execução e Scripts](#-execução-e-scripts)

---

## 🎯 Visão Geral

O **Playwright TS Toolkit** fornece uma camada estruturada de abstração que resolve problemas comuns em pipelines de testes corporativos:
- **Resiliência real**: elimina esperas estáticas (`waitForTimeout`) substituindo-as por polling determinístico e tolerância a re-renderizações.
- **Fixtures desacopladas**: substitui comandos globais pelo sistema nativo `test.extend` do Playwright, garantindo autocompletion no VS Code e contexto estritamente isolado entre workers paralelos.
- **Massa de dados nativa para o Brasil**: geradores e validadores matemáticos de CPF e CNPJ (com distribuição equiprovável de dígitos e rejeição de sequências inválidas), além de celulares e e-mails únicos.
- **Suporte híbrido (UI + API)**: injeção rápida de dados (seeding) via API direto nos testes de interface, reduzindo o tempo de execução de minutos para segundos.
- **Multi-ambiente resiliente**: suporte nativo a múltiplos ambientes (`qa`, `staging`, `prod`) sem derrubar a execução se um arquivo de configuração estiver ausente.

---

## ⚙️ Pré-requisitos

- **Node.js**: versão `>= 18.0.0` (recomendado v20+ LTS).
- **NPM**: versão `>= 9.0.0`.
- **Git**: instalado e configurado no terminal.

---

## 🚀 Instalação

Clone o repositório e instale as dependências:

```bash
# Clone o repositório
git clone https://github.com/matheusneves/playwright-ts-toolkit.git
cd playwright-ts-toolkit

# Instale as dependências do projeto
npm install

# Instale os navegadores gerenciados pelo Playwright
npx playwright install chromium

# (No Linux/WSL, se faltarem bibliotecas do sistema)
npx playwright install --with-deps chromium
```

---

## 📁 Estrutura do Projeto

```text
playwright-ts-toolkit/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline GitHub Actions (typecheck + smoke tests)
├── config/
│   ├── .env.example              # Modelo de variáveis de ambiente versionado
│   └── .env.qa                   # (Opcional, ignorado no git)
├── downloads/
│   └── .gitkeep                  # Pasta monitorada para downloads de testes
├── docs/
│   └── EXEMPLOS.md               # Exemplos práticos detalhados de cada cenário
├── src/
│   ├── fixtures/
│   │   └── customFixtures.ts     # Extensão do runner (ui, auth, api)
│   ├── helpers/
│   │   ├── apiHelper.ts          # Requisições REST, autenticação e API seeding
│   │   ├── authHelper.ts         # Login resiliente, bypass de sessões e logout
│   │   └── uiHelper.ts           # Interações resilientes de UI, downloads e polling
│   ├── utils/
│   │   └── dataGenerator.ts      # Geração e validação de CPF, CNPJ, dados de teste
│   └── index.ts                  # Reexportação unificada de todos os módulos
├── tests/
│   └── smoke/
│       ├── dataGenerator.spec.ts # Testes unitários puros da massa de dados
│       ├── fixtures.spec.ts      # Testes de injeção e API com servidor mock local
│       └── uiHelper.spec.ts      # Testes ponta a ponta dos helpers de UI
├── CHANGELOG.md                  # Histórico de versões e alterações de comportamento
├── LICENSE                       # Licença MIT (Matheus Neves)
├── package.json                  # Scripts e dependências
├── playwright.config.ts          # Configurações do Playwright com suporte multi-env
├── README.md                     # Documentação principal
└── tsconfig.json                 # Configuração do TypeScript (strict, ES2020, commonjs)
```

---

## 📖 Tabela de Métodos e Utilitários

### 1. `DataGenerator` (`src/utils/dataGenerator.ts`)

| Método | Assinatura | Descrição | Exemplo de Uso |
| :--- | :--- | :--- | :--- |
| `cpf` | `cpf(formatted = true): string` | Gera um CPF matematicamente válido com dígitos uniformes, rejeitando sequências de dígitos iguais. | `const cpf = DataGenerator.cpf();` |
| `isValidCpf` | `isValidCpf(cpf: string): boolean` | Valida as regras da Receita Federal para um CPF (com ou sem máscara). | `DataGenerator.isValidCpf("123.456.789-00");` |
| `cnpj` | `cnpj(formatted = true): string` | Gera um CNPJ matematicamente válido com filial padrão `0001`. | `const cnpj = DataGenerator.cnpj(false);` |
| `isValidCnpj` | `isValidCnpj(cnpj: string): boolean` | Valida os dígitos verificadores de um CNPJ (com ou sem máscara). | `DataGenerator.isValidCnpj("11.222.333/0001-81");` |
| `email` | `email(prefix = "teste"): string` | Gera um e-mail com timestamp e hash sem risco de colisão em execuções paralelas. | `const email = DataGenerator.email("usuario");` |
| `phone` | `phone(formatted = true): string` | Gera número de celular brasileiro com DDD válido e nono dígito (9). | `const tel = DataGenerator.phone();` |
| `fullName` | `fullName(prefix = "Usuario"): string` | Gera um nome composto acompanhado de hash identificador. | `const nome = DataGenerator.fullName("Cliente");` |
| `uniqueHash` | `uniqueHash(length = 8): string` | Gera um hash alfanumérico pseudoaleatório de tamanho customizável. | `const hash = DataGenerator.uniqueHash(6);` |
| `normalizeText`| `normalizeText(text: string): string` | Remove acentuação/diacríticos, converte para minúsculas e reduz múltiplos espaços. | `DataGenerator.normalizeText(" Ação "); // "acao"` |

---

### 2. `UIHelper` (`src/helpers/uiHelper.ts`)

Injetado automaticamente na fixture `ui`:

| Método | Assinatura | Descrição | Exemplo de Uso |
| :--- | :--- | :--- | :--- |
| `waitForPageLoad` | `waitForPageLoad(waitForNetworkIdle = false): Promise<void>` | Aguarda os estados `domcontentloaded` e `load`. Opcionalmente suporta `networkidle`. | `await ui.waitForPageLoad();` |
| `interactWithElement` | `interactWithElement(el, action, val?, opts?): Promise<void>` | Executa ações comuns (`click`, `containsClick`, `type`, `clear`). Por padrão, `force: false`. | `await ui.interactWithElement("#input", "type", "Texto");` |
| `clickWhenVisibleAndEnabled` | `clickWhenVisibleAndEnabled(el, opts?): Promise<void>` | Aguarda explicitamente o elemento estar visível e habilitado antes do clique. | `await ui.clickWhenVisibleAndEnabled("#btn-salvar");` |
| `selectOptionWithText` | `selectOptionWithText(el, optionText, opts?): Promise<void>` | Clica no dropdown e seleciona a opção usando `getByRole("option")` com fallback para `li`. | `await ui.selectOptionWithText("#combo", "Opção A");` |
| `selectAutocomplete` | `selectAutocomplete(el, value, opts?): Promise<void>` | Preenche o campo via `pressSequentially` (delay 50ms) e clica na opção correspondente. | `await ui.selectAutocomplete("#cidade", "São Paulo", { type: true });` |
| `clickUntilVisible` | `clickUntilVisible(btn, target, opts?): Promise<void>` | Clica repetidamente com intervalo até que o elemento alvo apareça (tolerante a re-render). | `await ui.clickUntilVisible(".toggle", ".clear-completed");` |
| `validateTextInElement` | `validateTextInElement(el, texts, opts?): Promise<void>` | Realiza asserção de um ou múltiplos textos em um container/elemento. | `await ui.validateTextInElement(".card", ["Item 1", "R$ 10"]);` |
| `searchForm` | `searchForm(fields): Promise<void>` | Preenche múltiplos campos dinamicamente, suportando autocompletes e digitação sequencial. | `await ui.searchForm([{ selector: "#nome", value: "Ana" }]);` |
| `reloadUntilVisible` | `reloadUntilVisible(el, textOrOpts?, opts?): Promise<void>` | Recarrega a página em loop inteligente até que o texto normalizado apareça no elemento. | `await ui.reloadUntilVisible(".status", "CONCLUÍDO");` |
| `validateDownload` | `validateDownload(triggerAction, opts?): Promise<string>` | Monitora o evento nativo de download e retorna o nome sugerido do arquivo. | `const name = await ui.validateDownload(() => btn.click());` |
| `validateDownloadDetailed`| `validateDownloadDetailed(triggerAction, saveTo?, opts?): Promise<{ fileName, path }>` | Valida o download e opcionalmente salva o arquivo no diretório especificado em disco. | `const res = await ui.validateDownloadDetailed(trigger, "downloads");` |
| `fillGeneratedName` | `fillGeneratedName(el, prefix?, opts?): Promise<string>` | Preenche o campo com um nome gerado dinamicamente e retorna o valor preenchido. | `const nome = await ui.fillGeneratedName("#nome");` |
| `fillGeneratedEmail`| `fillGeneratedEmail(el, prefix?, opts?): Promise<string>` | Preenche com um e-mail único e retorna o endereço gerado. | `const email = await ui.fillGeneratedEmail("#email");` |
| `fillGeneratedCPF` | `fillGeneratedCPF(el, formatted?, opts?): Promise<string>` | Preenche com CPF válido e retorna o valor preenchido. | `const cpf = await ui.fillGeneratedCPF("#cpf");` |
| `fillGeneratedCNPJ`| `fillGeneratedCNPJ(el, formatted?, opts?): Promise<string>` | Preenche com CNPJ válido e retorna o valor preenchido. | `const cnpj = await ui.fillGeneratedCNPJ("#cnpj");` |
| `fillGeneratedPhone`| `fillGeneratedPhone(el, formatted?, opts?): Promise<string>` | Preenche com celular brasileiro válido e retorna o valor preenchido. | `const tel = await ui.fillGeneratedPhone("#tel");` |

---

### 3. `AuthHelper` (`src/helpers/authHelper.ts`)

Injetado automaticamente na fixture `auth`:

| Método | Assinatura | Descrição | Exemplo de Uso |
| :--- | :--- | :--- | :--- |
| `loginPlatform` | `loginPlatform(email?, password?, opts?): Promise<void>` | Limpa cookies/storage, preenche credenciais (ou fallback `.env`), trata modal de sessão ativa e valida saída da tela de login. | `await auth.loginPlatform("qa@empresa.com", "senha123");` |
| `logout` | `logout(opts?): Promise<void>` | Abre o menu de perfil do usuário, clica no botão de logout após espera explícita e limpa o storage. | `await auth.logout();` |

---

### 4. `ApiHelper` (`src/helpers/apiHelper.ts`)

Injetado automaticamente na fixture `api`:

| Método | Assinatura | Descrição | Exemplo de Uso |
| :--- | :--- | :--- | :--- |
| `loginViaAPI` | `loginViaAPI(user?, pass?, loginEndpoint?): Promise<string>` | Autentica diretamente no endpoint de API e extrai o token JWT. | `const token = await api.loginViaAPI("user", "pass");` |
| `seedRecordViaAPI`| `seedRecordViaAPI<T>(endpoint, payload, token?): Promise<T>` | Cria registros rápidos no backend via POST e retorna a resposta tipada. | `const res = await api.seedRecordViaAPI<Item>("/itens", dados, token);` |

---

## 🌐 Configuração de Ambientes (Multi-env)

As credenciais e URLs são configuradas por ambiente na pasta `config/`:

1. Copie o arquivo de exemplo para o ambiente desejado:
   ```bash
   cp config/.env.example config/.env.qa
   cp config/.env.example config/.env.staging
   cp config/.env.example config/.env.prod
   ```
2. Preencha as credenciais correspondentes no arquivo gerado:
   ```properties
   BASE_URL=https://qa.sua-aplicacao.com
   API_BASE_URL=https://api-qa.sua-aplicacao.com
   USER_EMAIL=usuario.qa@empresa.com
   USER_PASSWORD=SenhaSegura@123
   ```
3. Execute seus testes com o ambiente desejado via `cross-env`:
   ```bash
   npm run test:qa       # Carrega config/.env.qa
   npm run test:staging  # Carrega config/.env.staging
   npm run test:prod     # Carrega config/.env.prod
   ```

> [!NOTE]
> Se o arquivo `config/.env.<TEST_ENV>` não existir, o toolkit emite um aviso informativo (`console.warn`) e prossegue utilizando as variáveis de ambiente já carregadas no sistema ou do arquivo `.env` na raiz, impedindo que a suíte falhe na inicialização.

---

## 📦 Como Utilizar este Toolkit em Outro Projeto

Para consumir o toolkit em uma aplicação ou repositório existente:

1. **Copie a pasta `src/`**:
   Copie a pasta `src/` deste repositório para o seu projeto de destino.
2. **Instale as dependências necessárias**:
   ```bash
   npm i -D @playwright/test typescript dotenv @types/node cross-env
   ```
3. **Configure o `playwright.config.ts`**:
   Garanta que seu arquivo de configuração inclua o carregador de `.env` baseado em `TEST_ENV` e aponte para `src/fixtures/customFixtures.ts`.
4. **Importe as fixtures em seus testes**:
   ```typescript
   import { test, expect, DataGenerator } from "../src";

   test("meu teste", async ({ page, ui, auth, api }) => {
     // Acesso total a todos os helpers tipados!
   });
   ```

---

## ⚖️ Diferenças em Relação ao Cypress

Se a sua equipe possui histórico com Cypress, observe as vantagens e diferenças fundamentais desta arquitetura no Playwright:

| Aspecto | Cypress | Playwright TS Toolkit |
| :--- | :--- | :--- |
| **Actionability & Auto-waiting** | Requer plugins ou repetições manuais. `force: true` frequente mascarava bugs de UI. | Auto-waiting nativo do Playwright. Os helpers usam `force: false` por padrão, garantindo que o elemento esteja visível, estável e receptivo. |
| **Comandos Customizados** | Comandos globais acoplados via `Cypress.Commands.add` e `cy.*`, exigindo arquivos complexos de tipagem global (`index.d.ts`). | **Custom Fixtures tipadas** (`ui`, `auth`, `api`) estendidas via `test.extend`. Autocompletion perfeito, sem poluição global e com isolamento estrito entre threads. |
| **Autenticação e Sessão** | `cy.session` grava em cache de browser proprietário do Cypress. | `AuthHelper` limpa cookies/storage no contexto nativo (`BrowserContext`), garantindo isolamento total por teste. |
| **Downloads de Arquivos** | Exigia tasks em Node.js (`cy.task`) e busca de arquivos no disco via `glob`. | Captura nativa assíncrona com `page.waitForEvent("download")`, inspecionando o stream do browser sem dependências externas. |
| **Chamadas de API** | `cy.request` é enfileirado na mesma fila da interface. | `ApiHelper` utiliza `APIRequestContext` do Playwright em chamadas assíncronas assíncronas reais (`async/await`), executando em frações de segundo. |

---

## 🏆 Boas Práticas de Automação

1. **Prefira Localizadores Acessíveis**:
   - Dê preferência aos seletores recomendados pelo Playwright: `getByRole`, `getByLabel`, `getByTestId` e `getByText`.
2. **Evite `waitForTimeout` e `networkidle`**:
   - `page.waitForTimeout` introduz lentidão e fragilidade (*flakiness*).
   - `networkidle` é desencorajado pelo time oficial do Playwright em SPAs modernas com polling ou websockets. Prefira aguardar o elemento ou resposta de API específica via `waitForResponse`.
3. **Use API Seeding para Preparação de Dados**:
   - Não crie clientes, pedidos ou cadastros complexos via interface para preparar outros testes. Utilize `api.seedRecordViaAPI` para injetar os dados no banco em milissegundos e abra a UI direto no registro criado.
4. **Utilize `storageState` para Sessões Persistentes**:
   - Em suítes extensas, faça o login uma única vez no `globalSetup` salvando o estado de cookies e storage em um arquivo JSON (`storageState`) e injete esse arquivo nos testes subsequentes para pular a tela de login.

---

## 🧪 Execução e Scripts

| Comando | Descrição |
| :--- | :--- |
| `npm test` | Executa todos os testes em modo headless com Chromium |
| `npm run test:headed` | Executa os testes abrindo o navegador visível |
| `npm run test:ui` | Abre o **Playwright UI Mode** interativo para depuração visual passo a passo |
| `npm run test:qa` | Executa os testes carregando as variáveis de `config/.env.qa` |
| `npm run test:staging`| Executa os testes carregando as variáveis de `config/.env.staging` |
| `npm run test:prod` | Executa os testes carregando as variáveis de `config/.env.prod` |
| `npm run report` | Abre o relatório HTML detalhado da última execução (`playwright show-report`) |
| `npm run typecheck` | Executa validação estrita de tipos TypeScript sem gerar arquivos (`tsc --noEmit`) |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

**Autor**: Matheus Neves
