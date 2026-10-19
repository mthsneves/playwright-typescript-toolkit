import { test, expect } from "@playwright/test";
import { DataGenerator } from "../../src/utils/dataGenerator";

test.describe("DataGenerator - Smoke Tests Unitários", () => {
  test("deve gerar CPFs válidos com e sem máscara (200 iterações cada)", () => {
    // 200 iterações com máscara
    for (let i = 0; i < 200; i++) {
      const cpfFormatted = DataGenerator.cpf(true);
      expect(cpfFormatted).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
      expect(DataGenerator.isValidCpf(cpfFormatted)).toBe(true);
    }

    // 200 iterações sem máscara
    for (let i = 0; i < 200; i++) {
      const cpfRaw = DataGenerator.cpf(false);
      expect(cpfRaw).toMatch(/^\d{11}$/);
      expect(DataGenerator.isValidCpf(cpfRaw)).toBe(true);
    }
  });

  test("deve gerar CNPJs válidos com e sem máscara (200 iterações cada)", () => {
    // 200 iterações com máscara
    for (let i = 0; i < 200; i++) {
      const cnpjFormatted = DataGenerator.cnpj(true);
      expect(cnpjFormatted).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(DataGenerator.isValidCnpj(cnpjFormatted)).toBe(true);
    }

    // 200 iterações sem máscara
    for (let i = 0; i < 200; i++) {
      const cnpjRaw = DataGenerator.cnpj(false);
      expect(cnpjRaw).toMatch(/^\d{14}$/);
      expect(DataGenerator.isValidCnpj(cnpjRaw)).toBe(true);
    }
  });

  test("deve garantir unicidade de 100 e-mails gerados consecutivamente", () => {
    const emails = new Set<string>();
    const total = 100;

    for (let i = 0; i < total; i++) {
      const email = DataGenerator.email("qa");
      emails.add(email);
    }

    expect(emails.size).toBe(total);
  });

  test("deve gerar celulares no formato correto brasileiro com e sem máscara", () => {
    const phoneFormatted = DataGenerator.phone(true);
    expect(phoneFormatted).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);

    const phoneRaw = DataGenerator.phone(false);
    expect(phoneRaw).toMatch(/^\d{2}9\d{8}$/);
  });

  test("deve normalizar texto removendo acentos, convertendo em minúsculas e eliminando espaços duplicados", () => {
    const raw = "  Ação   Éxito ";
    const normalized = DataGenerator.normalizeText(raw);
    expect(normalized).toBe("acao exito");
  });

  test("deve identificar como inválidos CPFs e CNPJs conhecidos incorretos", () => {
    // CPFs com todos os dígitos iguais
    expect(DataGenerator.isValidCpf("111.111.111-11")).toBe(false);
    expect(DataGenerator.isValidCpf("00000000000")).toBe(false);
    expect(DataGenerator.isValidCpf("999.999.999-99")).toBe(false);

    // CPF com dígito verificador incorreto
    expect(DataGenerator.isValidCpf("123.456.789-00")).toBe(false);
    expect(DataGenerator.isValidCpf("")).toBe(false);

    // CNPJs inválidos ou com dígitos iguais
    expect(DataGenerator.isValidCnpj("11.111.111/1111-11")).toBe(false);
    expect(DataGenerator.isValidCnpj("00000000000000")).toBe(false);

    // CNPJ válido adulterado no último dígito
    const validCnpj = DataGenerator.cnpj(false);
    const lastDigit = parseInt(validCnpj.charAt(13), 10);
    const tamperedLastDigit = (lastDigit + 1) % 10;
    const invalidCnpj = validCnpj.slice(0, 13) + tamperedLastDigit;
    expect(DataGenerator.isValidCnpj(invalidCnpj)).toBe(false);
  });
});
