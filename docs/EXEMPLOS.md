# Exemplos Práticos de Uso - Playwright TS Toolkit

Este guia apresenta cenários práticos e funcionais demonstrando o poder dos utilitários, helpers de resiliência e fixtures incluídos no toolkit.

---

## 1. Cenário: Login Resiliente e Cadastro com Dados Únicos

Demonstra o fluxo de autenticação com limpeza de sessão, bypass de sessões concorrentes ativas e preenchimento de formulário com dados dinâmicos únicos (sem colisão).

```typescript
import { test, expect } from "../src/fixtures/customFixtures";

test.describe("Módulo de Clientes", () => {
  test("Cenário 1: Login Resiliente e Cadastro com Dados Únicos", async ({
    page,
    auth,
    ui,
  }) => {
    // 1. Executa login com limpeza de cookies/storage e tratamento de sessão concorrente
    await auth.loginPlatform("usuario.qa@empresa.com", "SenhaForte@123", {
      loginPath: "/login",
      timeout: 20000,
    });

    // 2. Navega para a tela de cadastro
    await page.goto("/clientes/novo");
    await ui.waitForPageLoad();

    // 3. Preenchimento do formulário com dados randômicos matematicamente válidos
    const nomePreenchido = await ui.fillGeneratedName("#txt-nome", "Cliente Corporativo");
    await ui.fillGeneratedCNPJ("#txt-cnpj");
    await ui.fillGeneratedEmail("#txt-email", "contato");
    await ui.fillGeneratedPhone("#txt-telefone");

    // 4. Seleção em autocomplete dinâmico
    await ui.selectAutocomplete("#filtro-cidade", "São Paulo", {
      type: true,
      timeout: 5000,
    });

    // 5. Clique seguro após certificar que o botão está visível e habilitado
    await ui.clickWhenVisibleAndEnabled("#btn-salvar");

    // 6. Validação de confirmação em tela
    await expect(page.getByText("Cadastrado com sucesso")).toBeVisible();
    await ui.validateTextInElement(".alert-sucesso", ["Sucesso", nomePreenchido]);
  });
});
```

---

## 2. Cenário: Teste Híbrido (API Seeding) + Download Nativo

Combina a injeção instantânea de dados de negócio via API (seeding) para abrir a interface diretamente na tela do registro criado, seguido pela validação de download de arquivo.

```typescript
import { test, expect } from "../src/fixtures/customFixtures";
import { DataGenerator } from "../src/utils/dataGenerator";

test.describe("Módulo de Pedidos e Exportação", () => {
  test("Cenário 2: Injeção de Dados via API e Validação de Download de PDF", async ({
    page,
    api,
    ui,
  }) => {
    // 1. Autenticação rápida no backend e injeção do pedido
    const token = await api.loginViaAPI("admin@empresa.com", "admin123");

    interface PedidoPayload {
      codigo: string;
      valor: number;
      descricao: string;
    }

    interface PedidoResponse extends PedidoPayload {
      id: number;
      status: string;
    }

    const novoPedido: PedidoPayload = {
      codigo: `PED_${DataGenerator.uniqueHash(6)}`,
      valor: 2500.0,
      descricao: "Pedido gerado para automação de teste",
    };

    const pedidoCriado = await api.seedRecordViaAPI<PedidoResponse>(
      "/api/v1/pedidos",
      novoPedido,
      token
    );

    // 2. Navega diretamente para a interface do pedido recém-criado
    await page.goto(`/pedidos/${pedidoCriado.id}`);
    await ui.waitForPageLoad();

    // 3. Valida múltiplos textos no container de resumo
    await ui.validateTextInElement(".card-resumo", [
      novoPedido.codigo,
      "R$ 2.500,00",
    ]);

    // 4. Validação e monitoramento nativo de download
    const fileName = await ui.validateDownload(async () => {
      await page.locator("#btn-exportar-pdf").click();
    });

    expect(fileName).toContain(".pdf");
  });
});
```

---

## 3. Cenário: Download Detalhado com Salvamento em Disco

Utiliza `validateDownloadDetailed` para capturar o arquivo baixado e salvá-lo no diretório local `downloads/`.

```typescript
import { test, expect } from "../src/fixtures/customFixtures";
import * as fs from "fs";

test("Cenário 3: Download com persistência em disco", async ({ page, ui }) => {
  await page.goto("/relatorios/financeiro");

  const downloadInfo = await ui.validateDownloadDetailed(
    async () => {
      await page.locator("#btn-baixar-planilha").click();
    },
    "downloads" // Pasta de destino
  );

  console.log(`Arquivo salvo em: ${downloadInfo.path}`);
  expect(downloadInfo.fileName).toMatch(/\.xlsx$/);
  expect(fs.existsSync(downloadInfo.path)).toBe(true);
});
```

---

## 4. Cenário: Polling Resiliente com `reloadUntilVisible`

Lida com processos assíncronos do backend (ex: geração de notas, processamento de relatórios em fila) recarregando a página periodicamente de forma inteligente até a conclusão.

```typescript
import { test, expect } from "../src/fixtures/customFixtures";

test("Cenário 4: Aguardar processamento assíncrono via reloadUntilVisible", async ({
  page,
  ui,
}) => {
  await page.goto("/processamentos/lote-4892");

  // Recarrega a página em intervalos até que o status mude para 'CONCLUÍDO'
  await ui.reloadUntilVisible(".badge-status", "CONCLUÍDO", {
    maxAttempts: 10,
    intervalMs: 3000,
    initialWaitMs: 1000,
  });

  await expect(page.locator(".badge-status")).toHaveText("CONCLUÍDO");
});
```

---

## 5. Cenário: Preenchimento de Formulários Complexos com `searchForm`

Preenche múltiplos campos de formulários mesclando inputs padrão, autocompletes e digitação sequencial para campos com máscara.

```typescript
import { test } from "../src/fixtures/customFixtures";

test("Cenário 5: Preenchimento dinâmico com searchForm", async ({ page, ui }) => {
  await page.goto("/filtros/pesquisa");

  await ui.searchForm([
    { selector: "#txt-cpf", value: "12345678909", sequentially: true },
    { selector: "#combo-categoria", value: "Eletrônicos", type: "autocomplete" },
    { selector: "#txt-termo", value: "Smartphone 5G" },
  ]);

  await ui.clickWhenVisibleAndEnabled("#btn-pesquisar");
});
```
