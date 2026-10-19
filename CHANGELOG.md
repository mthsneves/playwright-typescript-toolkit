# Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-10-19

### Adicionado
- **Arquitetura modular em TypeScript**: Divisão do código em módulos desacoplados (`utils/dataGenerator`, `helpers/uiHelper`, `helpers/authHelper`, `helpers/apiHelper`, `fixtures/customFixtures`).
- **`src/index.ts`**: Reexportação de todos os componentes, fixtures e tipos para facilitar importação e consumo como biblioteca ou toolkit compartilhado.
- **`DataGenerator`**:
  - Geração resiliente de CPF e CNPJ (com e sem formatação de máscara).
  - Validadores matemáticos independentes `isValidCpf` e `isValidCnpj` aderentes às regras da Receita Federal.
  - Geração de dados de apoio: `email` (com garantia de unicidade sem colisão), `phone` (com DDD e formato móvel), `fullName` / `generateName`, `uniqueHash`.
  - Normalizador de texto `normalizeText` (remoção de diacríticos/acentos, lowercase e redução de espaços).
- **`UIHelper`**:
  - `waitForPageLoad`: aguarda `domcontentloaded` e `load`, com suporte opcional a `networkidle`.
  - `interactWithElement`: suporte unificado para ações de `click`, `containsClick`, `type` (com opção `sequentially`) e `clear`.
  - `clickWhenVisibleAndEnabled`: espera explícita de visibilidade e estado habilitado antes do clique.
  - `selectOptionWithText`: seleção em dropdowns via `getByRole("option")` com fallback para `li`.
  - `selectAutocomplete`: busca e seleção em autocompletes modernos com digitação sequencial (`delay: 50ms`).
  - `clickUntilVisible`: tentativas iterativas com tolerância à re-renderização até o elemento alvo estar visível.
  - `validateTextInElement`: asserção de múltiplos textos com suporte a `Locator` ou seletores.
  - `searchForm`: preenchimento inteligente de formulários com suporte a autocompletes e índices configuráveis.
  - `reloadUntilVisible`: recarregamento com asserção rápida inteligente e validação sobre múltiplos elementos (`allTextContents`).
  - `validateDownload`: monitoramento nativo de download do Playwright (`waitForEvent("download")`).
  - `validateDownloadDetailed`: novo método com persistência opcional em diretório de disco e retorno de caminho absoluto.
  - Métodos utilitários de preenchimento dinâmico: `fillGeneratedName`, `fillGeneratedEmail`, `fillGeneratedCPF`, `fillGeneratedCNPJ` e `fillGeneratedPhone`.
- **`AuthHelper`**:
  - `loginPlatform`: fluxo resiliente com limpeza prévia de cookies e storage, suporte a hash routing (`#/login`), interceptação de modal de sessão concorrente, detecção imediata de erros e asserção de saída da tela de login.
  - `logout`: encerramento de sessão com abertura de menu, espera explícita do botão de saída e limpeza de storage.
- **`ApiHelper`**:
  - `loginViaAPI`: autenticação direta com endpoint customizável (`loginEndpoint`) e extração automática de tokens.
  - `seedRecordViaAPI`: injeção rápida de dados com suporte a cabeçalhos de autorização e tipagem genérica `<T>`.
  - Mensagens de erro ricas contendo status HTTP e o corpo detalhado da resposta em caso de falha.
- **Custom Fixtures**:
  - Extensão nativa do runner Playwright (`test.extend<CustomFixtures>`) injetando `ui`, `auth` e `api`.
  - Lazy loading da fixture `api` com validação obrigatória da variável `API_BASE_URL`.
- **Suíte de Smoke Tests**:
  - `tests/smoke/dataGenerator.spec.ts`: 100% dos testes unitários de geração e validação de CPF, CNPJ, e-mail e strings.
  - `tests/smoke/uiHelper.spec.ts`: cobertura ponta a ponta dos helpers de UI utilizando TodoMVC e páginas dinâmicas.
  - `tests/smoke/fixtures.spec.ts`: injeção de dependências e testes de API contra servidor HTTP mock isolado.
- **CI/CD**:
  - Pipeline GitHub Actions (`.github/workflows/ci.yml`) com execução de typecheck, testes no Chromium e upload do relatório HTML.

---

### Mudanças de comportamento (em relação à base de referência)

> [!IMPORTANT]
> As seguintes alterações foram implementadas intencionalmente para assegurar máxima conformidade com as boas práticas do Playwright e eliminar fragilidades identificadas:

1. **`interactWithElement` com `force: false` por padrão**:
   - *Original*: Utilizava `click({ force: true })` e `waitFor({ state: "visible" })`.
   - *Alteração*: O padrão de `force` agora é `false`. O Playwright possui verificações completas de actionability (elemento visível, estável, habilitado e receptor do evento de ponteiro). Forçar o clique indiscriminadamente impedia a detecção de overlays, loading spinners e botões desabilitados. Foi removido o `waitFor visible` redundante e adicionada a opção `sequentially` para digitação com eventos reais de teclado.
2. **`selectAutocomplete` com digitação sequencial**:
   - *Original*: Fazia `fill` diretamente no campo e uma espera fixa `waitForTimeout`.
   - *Alteração*: Agora utiliza `pressSequentially(value, { delay: 50 })` quando `type: true`, disparando keydown, keypress e keyup necessários para autocompletes modernos. A espera fixa desnecessária foi substituída pela espera do elemento da lista ficar visível.
3. **`clickUntilVisible` com tolerância a re-renderização**:
   - *Original*: Lançava exceção imediata caso o botão não estivesse visível em uma dada iteração.
   - *Alteração*: Se o botão sofrer re-renderização momentânea, o helper aguarda o intervalo configurado e continua tentando até o timeout total, reportando com precisão qual elemento faltou apenas no término.
4. **`reloadUntilVisible` mais rápido e abrangente**:
   - *Original*: Fazia `waitForTimeout(intervalMs)` estático sempre após cada reload e consultava apenas o primeiro elemento.
   - *Alteração*: Após o reload, tenta validar a presença do texto em até 2 segundos antes de aguardar o restante do intervalo. A busca de texto agora analisa todos os nós correspondentes via `allTextContents()` com normalização de acentuação e espaços.
5. **`DataGenerator.cpf` e `DataGenerator.cnpj` com distribuição uniforme**:
   - *Original*: Usava `Math.round(Math.random() * 9)`, gerando probabilidade desigual para 0 e 9 (50% menor que os dígitos centrais), e permitia sequências inválidas de dígitos iguais.
   - *Alteração*: Passou a utilizar `Math.floor(Math.random() * 10)` garantindo distribuição equiprovável de todos os algarismos, além de regenerar automaticamente CPFs que gerem sequências de dígitos iguais (inválidos perante a Receita Federal).
6. **Download com método estendido `validateDownloadDetailed`**:
   - *Original*: Retornava apenas o nome sugerido do arquivo.
   - *Alteração*: Mantido `validateDownload` retornando apenas `fileName` para retrocompatibilidade, e adicionado `validateDownloadDetailed` que aceita parâmetro de salvamento em disco (`saveTo`) e retorna `{ fileName, path }` com verificação de não-nulidade do arquivo.
7. **`ApiHelper` com endpoint flexível e mensagens detalhadas**:
   - *Original*: `loginEndpoint` fixo e asserção silenciosa sem detalhes de erro do backend.
   - *Alteração*: `loginEndpoint` tornou-se parâmetro opcional (default `/api/v1/auth/login`), URL base normalizada para evitar barras duplicadas, e erros agora imprimem o status HTTP e o corpo JSON/texto retornado pelo servidor.
8. **Fixture `api` estrita**:
   - *Original*: Utilizava fallback silencioso para `https://sua-api.com`.
   - *Alteração*: Agora lança erro explícito e amigável informando a necessidade de configurar `API_BASE_URL` no momento em que a fixture for invocada em um teste.
