/**
 * Utilitário para geração e validação de massas de dados dinâmicas e resilientes.
 */
export class DataGenerator {
  /**
   * Gera um CPF válido (com ou sem formatação de máscara).
   * Evita sequências de dígitos iguais e utiliza distribuição uniforme.
   *
   * @param formatted Define se retorna com pontuação (XXX.XXX.XXX-XX) ou apenas números
   * @returns String contendo o CPF gerado
   */
  static cpf(formatted = true): string {
    let digits: number[];

    // Garante que não gere todos os dígitos iguais
    do {
      digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    } while (digits.every((d) => d === digits[0]));

    // Primeiro dígito verificador
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += digits[i] * (10 - i);
    }
    const rest1 = sum1 % 11;
    const dv1 = rest1 < 2 ? 0 : 11 - rest1;
    digits.push(dv1);

    // Segundo dígito verificador
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += digits[i] * (11 - i);
    }
    const rest2 = sum2 % 11;
    const dv2 = rest2 < 2 ? 0 : 11 - rest2;
    digits.push(dv2);

    const cpfStr = digits.join("");
    if (!formatted) {
      return cpfStr;
    }

    return `${cpfStr.slice(0, 3)}.${cpfStr.slice(3, 6)}.${cpfStr.slice(6, 9)}-${cpfStr.slice(9, 11)}`;
  }

  /**
   * Valida se uma string de CPF é matematicamente válida segundo as regras da Receita Federal.
   * Aceita CPF com ou sem máscara.
   *
   * @param cpf CPF com ou sem formatação
   * @returns true se o CPF for válido
   */
  static isValidCpf(cpf: string): boolean {
    if (!cpf) return false;
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) return false;

    // Rejeita sequências de dígitos iguais conhecidas (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validação do primeiro dígito verificador
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(cleanCpf.charAt(i), 10) * (10 - i);
    }
    const rest1 = sum1 % 11;
    const dv1 = rest1 < 2 ? 0 : 11 - rest1;
    if (dv1 !== parseInt(cleanCpf.charAt(9), 10)) return false;

    // Validação do segundo dígito verificador
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(cleanCpf.charAt(i), 10) * (11 - i);
    }
    const rest2 = sum2 % 11;
    const dv2 = rest2 < 2 ? 0 : 11 - rest2;
    return dv2 === parseInt(cleanCpf.charAt(10), 10);
  }

  /**
   * Gera um CNPJ válido (com ou sem formatação de máscara).
   *
   * @param formatted Define se retorna com pontuação (XX.XXX.XXX/0001-XX) ou apenas números
   * @returns String contendo o CNPJ gerado
   */
  static cnpj(formatted = true): string {
    const digits: number[] = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    // Filial padrão 0001
    digits.push(0, 0, 0, 1);

    // Primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1 = 0;
    for (let i = 0; i < 12; i++) {
      sum1 += digits[i] * weights1[i];
    }
    const rest1 = sum1 % 11;
    const dv1 = rest1 < 2 ? 0 : 11 - rest1;
    digits.push(dv1);

    // Segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += digits[i] * weights2[i];
    }
    const rest2 = sum2 % 11;
    const dv2 = rest2 < 2 ? 0 : 11 - rest2;
    digits.push(dv2);

    const cnpjStr = digits.join("");
    if (!formatted) {
      return cnpjStr;
    }

    return `${cnpjStr.slice(0, 2)}.${cnpjStr.slice(2, 5)}.${cnpjStr.slice(5, 8)}/${cnpjStr.slice(8, 12)}-${cnpjStr.slice(12, 14)}`;
  }

  /**
   * Valida se uma string de CNPJ é matematicamente válida segundo as regras oficiais.
   * Aceita CNPJ com ou sem máscara.
   *
   * @param cnpj CNPJ com ou sem formatação
   * @returns true se o CNPJ for válido
   */
  static isValidCnpj(cnpj: string): boolean {
    if (!cnpj) return false;
    const cleanCnpj = cnpj.replace(/\D/g, "");

    if (cleanCnpj.length !== 14) return false;

    // Rejeita sequências de dígitos iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

    // Primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1 = 0;
    for (let i = 0; i < 12; i++) {
      sum1 += parseInt(cleanCnpj.charAt(i), 10) * weights1[i];
    }
    const rest1 = sum1 % 11;
    const dv1 = rest1 < 2 ? 0 : 11 - rest1;
    if (dv1 !== parseInt(cleanCnpj.charAt(12), 10)) return false;

    // Segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += parseInt(cleanCnpj.charAt(i), 10) * weights2[i];
    }
    const rest2 = sum2 % 11;
    const dv2 = rest2 < 2 ? 0 : 11 - rest2;
    return dv2 === parseInt(cleanCnpj.charAt(13), 10);
  }

  /**
   * Gera um e-mail único para evitar colisões em testes paralelos ou repetidos.
   *
   * @param prefix Prefixo do e-mail (padrão: "teste")
   * @returns E-mail com timestamp e hash único
   */
  static email(prefix = "teste"): string {
    const sanitizedPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, "") || "teste";
    const unique = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return `${sanitizedPrefix}_${unique}@exemplo.com`;
  }

  /**
   * Gera um número de celular brasileiro válido com DDD.
   *
   * @param formatted Define se formata como (XX) 9XXXX-XXXX
   * @returns String contendo o telefone celular
   */
  static phone(formatted = true): string {
    const ddd = Math.floor(Math.random() * 89 + 11).toString(); // DDDs de 11 a 99
    const part1 = `9${Math.floor(Math.random() * 9000 + 1000)}`;
    const part2 = Math.floor(Math.random() * 9000 + 1000).toString();

    if (!formatted) {
      return `${ddd}${part1}${part2}`;
    }

    return `(${ddd}) ${part1}-${part2}`;
  }

  /**
   * Gera um nome completo ou rotulado com hash único.
   *
   * @param prefix Prefixo do nome (ex: "Cliente", "Fornecedor")
   * @returns Nome composto com identificador único
   */
  static fullName(prefix = "Usuario"): string {
    return `${prefix} ${this.uniqueHash(6)}`;
  }

  static generateName(prefix = "Usuario"): string {
    return this.fullName(prefix);
  }

  /**
   * Gera um hash alfanumérico aleatório.
   *
   * @param length Tamanho do hash desejado (padrão: 8)
   * @returns Hash aleatório
   */
  static uniqueHash(length = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Normaliza texto removendo acentos, convertendo para minúsculas e eliminando espaços duplicados.
   * Útil para asserções resilientes de texto na interface.
   *
   * @param text Texto a ser normalizado
   * @returns Texto normalizado (ex: "  Ação   Éxito " -> "acao exito")
   */
  static normalizeText(text: string): string {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
}
