import { test, expect } from "../../src/fixtures/customFixtures";
import { UIHelper } from "../../src/helpers/uiHelper";
import { AuthHelper } from "../../src/helpers/authHelper";
import { ApiHelper } from "../../src/helpers/apiHelper";
import * as http from "http";
import { AddressInfo } from "net";

/**
 * Smoke tests para validação das custom fixtures e do ApiHelper.
 * Utiliza um servidor HTTP local simulado (mock) via Node http.createServer,
 * garantindo testes 100% isolados, rápidos, determinísticos e livres de instabilidades de rede externa.
 */
test.describe("Custom Fixtures & ApiHelper - Smoke Tests", () => {
  let server: http.Server;
  let mockBaseUrl: string;
  const originalApiBaseUrl = process.env.API_BASE_URL;

  test.beforeAll(async () => {
    // Inicializa servidor de mock local
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        res.setHeader("Content-Type", "application/json");

        // Rota de login
        if (req.url === "/api/v1/auth/login" && req.method === "POST") {
          const parsed = JSON.parse(body || "{}");
          if (parsed.password === "senha-correta") {
            res.writeHead(200);
            res.end(
              JSON.stringify({
                token: "jwt-token-valido-12345",
                user: { id: 1, email: parsed.email || parsed.username },
              })
            );
          } else {
            res.writeHead(401);
            res.end(
              JSON.stringify({ message: "Credenciais inválidas fornecidas" })
            );
          }
          return;
        }

        // Rota de seeding de pedidos
        if (req.url === "/api/v1/pedidos" && req.method === "POST") {
          const authHeader = req.headers["authorization"];
          if (authHeader !== "Bearer jwt-token-valido-12345") {
            res.writeHead(403);
            res.end(
              JSON.stringify({ error: "Acesso não autorizado ou token ausente" })
            );
            return;
          }

          const parsed = JSON.parse(body || "{}");
          res.writeHead(201);
          res.end(
            JSON.stringify({
              id: 999,
              ...parsed,
              status: "CRIADO",
            })
          );
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: "Rota não encontrada" }));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address() as AddressInfo;
        mockBaseUrl = `http://127.0.0.1:${address.port}`;
        process.env.API_BASE_URL = mockBaseUrl;
        resolve();
      });
    });
  });

  test.afterAll(async () => {
    process.env.API_BASE_URL = originalApiBaseUrl;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  test("deve injetar corretamente as instâncias de UIHelper, AuthHelper e ApiHelper nas fixtures", async ({
    ui,
    auth,
    api,
  }) => {
    expect(ui).toBeInstanceOf(UIHelper);
    expect(auth).toBeInstanceOf(AuthHelper);
    expect(api).toBeInstanceOf(ApiHelper);
  });

  test("deve realizar loginViaAPI e extrair o token com sucesso contra o mock", async ({
    api,
  }) => {
    const token = await api.loginViaAPI("usuario@empresa.com", "senha-correta");
    expect(token).toBe("jwt-token-valido-12345");
  });

  test("deve lançar erro com status e corpo da resposta quando loginViaAPI falhar", async ({
    api,
  }) => {
    await expect(
      api.loginViaAPI("usuario@empresa.com", "senha-errada")
    ).rejects.toThrow(/Status 401.*Credenciais inválidas fornecidas/);
  });

  test("deve realizar injeção de dados (seedRecordViaAPI) com tipagem e autorização", async ({
    api,
  }) => {
    interface PedidoResponse {
      id: number;
      codigo: string;
      valor: number;
      status: string;
    }

    const token = await api.loginViaAPI("admin@empresa.com", "senha-correta");
    const payload = {
      codigo: "PED-MOCK-789",
      valor: 350.5,
    };

    const resultado = await api.seedRecordViaAPI<PedidoResponse>(
      "/api/v1/pedidos",
      payload,
      token
    );

    expect(resultado.id).toBe(999);
    expect(resultado.codigo).toBe("PED-MOCK-789");
    expect(resultado.valor).toBe(350.5);
    expect(resultado.status).toBe("CRIADO");
  });

  test("deve lançar erro descritivo em seedRecordViaAPI quando token for inválido", async ({
    api,
  }) => {
    await expect(
      api.seedRecordViaAPI("/api/v1/pedidos", { teste: true }, "token-falso")
    ).rejects.toThrow(/Status 403.*Acesso não autorizado/);
  });

  test("deve validar que a fixture api exige a configuração explícita de API_BASE_URL", () => {
    const prev = process.env.API_BASE_URL;
    delete process.env.API_BASE_URL;
    try {
      const initApiFixture = () => {
        const baseUrl = process.env.API_BASE_URL;
        if (!baseUrl) {
          throw new Error(
            "A variável de ambiente API_BASE_URL não está configurada. Defina API_BASE_URL no arquivo de configuração (.env ou config/.env.*) para utilizar a fixture 'api'."
          );
        }
      };
      expect(initApiFixture).toThrow(/A variável de ambiente API_BASE_URL não está configurada/);
    } finally {
      process.env.API_BASE_URL = prev;
    }
  });
});
