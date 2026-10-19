import { test, expect } from "../../src/fixtures/customFixtures";
import * as fs from "fs";

test.describe("UIHelper - Smoke Tests", () => {
  test.beforeEach(async ({ page, ui }) => {
    await page.goto("https://demo.playwright.dev/todomvc");
    await ui.waitForPageLoad();
  });

  test("deve manipular elementos com interactWithElement (type, clear, click, containsClick)", async ({
    page,
    ui,
  }) => {
    const input = page.locator(".new-todo");

    // 1. type
    await ui.interactWithElement(input, "type", "Comprar leite");
    await input.press("Enter");
    await expect(page.locator(".todo-list li label")).toHaveText(["Comprar leite"]);

    // 2. clear
    await ui.interactWithElement(input, "type", "Texto para apagar");
    await ui.interactWithElement(input, "clear");
    await expect(input).toHaveValue("");

    // 3. containsClick no filtro
    await ui.interactWithElement(".filters a", "containsClick", "All");
    await expect(page.locator(".filters a.selected")).toHaveText("All");

    // 4. click na marcação do todo
    await ui.interactWithElement(".todo-list li .toggle", "click");
    await expect(page.locator(".todo-list li")).toHaveClass(/completed/);
  });

  test("deve clicar em elemento quando visível e habilitado (clickWhenVisibleAndEnabled)", async ({
    page,
    ui,
  }) => {
    const input = page.locator(".new-todo");
    await input.fill("Tarefa Importante");
    await input.press("Enter");

    await ui.clickWhenVisibleAndEnabled(".todo-list li .toggle");
    await expect(page.locator(".todo-list li")).toHaveClass(/completed/);
  });

  test("deve validar textos em elemento com validateTextInElement", async ({ page, ui }) => {
    const input = page.locator(".new-todo");
    await input.fill("Item Alfa");
    await input.press("Enter");
    await input.fill("Item Beta");
    await input.press("Enter");

    await ui.validateTextInElement(".todo-list", ["Item Alfa", "Item Beta"]);
  });

  test("deve preencher campo com nome gerado e retornar o valor (fillGeneratedName)", async ({
    page,
    ui,
  }) => {
    const input = page.locator(".new-todo");
    const nameFilled = await ui.fillGeneratedName(input, "Tarefa");
    expect(nameFilled).toContain("Tarefa");
    await expect(input).toHaveValue(nameFilled);
  });

  test("deve clicar iterativamente com clickUntilVisible até que o alvo apareça", async ({
    page,
    ui,
  }) => {
    const input = page.locator(".new-todo");
    await input.fill("Tarefa para limpar");
    await input.press("Enter");

    // Clica no toggle até que o botão 'Clear completed' apareça
    await ui.clickUntilVisible(".todo-list li .toggle", ".clear-completed", {
      maxAttempts: 5,
      interval: 300,
    });

    await expect(page.locator(".clear-completed")).toBeVisible();
  });

  test("deve selecionar opção em autocomplete e preencher formulário (selectAutocomplete e searchForm)", async ({
    page,
    ui,
  }) => {
    // Cenário com página controlada via setContent para validar autocompletes modernos
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .dropdown { display: block; position: relative; }
            .options { display: none; list-style: none; padding: 0; margin: 0; }
            .options.open { display: block; }
            .option { padding: 8px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="dropdown">
            <input id="city-autocomplete" placeholder="Digite a cidade..." />
            <ul id="city-options" class="options">
              <li role="option" class="option" data-value="sp">São Paulo</li>
              <li role="option" class="option" data-value="rj">Rio de Janeiro</li>
              <li role="option" class="option" data-value="bh">Belo Horizonte</li>
            </ul>
          </div>
          <input id="txt-nome" placeholder="Nome completo" />
          <input id="txt-email" placeholder="E-mail" />

          <script>
            const input = document.getElementById('city-autocomplete');
            const options = document.getElementById('city-options');
            input.addEventListener('focus', () => options.classList.add('open'));
            input.addEventListener('input', (e) => {
              options.classList.add('open');
              const term = e.target.value.toLowerCase();
              Array.from(options.children).forEach(li => {
                li.style.display = li.textContent.toLowerCase().includes(term) ? 'block' : 'none';
              });
            });
            Array.from(options.children).forEach(li => {
              li.addEventListener('click', () => {
                input.value = li.textContent;
                options.classList.remove('open');
              });
            });
          </script>
        </body>
      </html>
    `);

    // Teste de selectAutocomplete
    await ui.selectAutocomplete("#city-autocomplete", "Rio de Janeiro", { type: true });
    await expect(page.locator("#city-autocomplete")).toHaveValue("Rio de Janeiro");

    // Teste de searchForm
    await ui.searchForm([
      { selector: "#txt-nome", value: "Maria Silva", sequentially: true },
      { selector: "#txt-email", value: "maria@exemplo.com" },
    ]);

    await expect(page.locator("#txt-nome")).toHaveValue("Maria Silva");
    await expect(page.locator("#txt-email")).toHaveValue("maria@exemplo.com");
  });

  test("deve validar download nativo simples e detalhado (validateDownload e validateDownloadDetailed)", async ({
    page,
    ui,
  }) => {
    await page.setContent(`
      <button id="btn-download">Baixar Relatório</button>
      <script>
        document.getElementById('btn-download').addEventListener('click', () => {
          const blob = new Blob(['Conteúdo do relatório em PDF para teste'], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'relatorio.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      </script>
    `);

    // 1. validateDownload (retrocompatível, retorna string do arquivo)
    const fileName = await ui.validateDownload(async () => {
      await page.locator("#btn-download").click();
    });
    expect(fileName).toBe("relatorio.pdf");

    // 2. validateDownloadDetailed (retorna objeto com path e salva em downloads/)
    const detailed = await ui.validateDownloadDetailed(
      async () => {
        await page.locator("#btn-download").click();
      },
      "downloads"
    );
    expect(detailed.fileName).toBe("relatorio.pdf");
    expect(fs.existsSync(detailed.path)).toBe(true);

    // Limpa o arquivo baixado após teste para manter pasta downloads limpa
    try {
      fs.unlinkSync(detailed.path);
    } catch {
      // Ignora erro se já removido
    }
  });
});
