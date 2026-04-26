// ===========================================
// Cliente HTTP para API BillEasy (Java Backend)
// Usado para operações de ESCRITA (segurança + audit)
// ===========================================

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

interface CreateDevedorDTO {
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  empresaId: string;
}

interface CreateDividaDTO {
  descricao: string;
  valorPrincipal: number;
  multaPercentual?: number;
  jurosMensalPercentual?: number;
  dataVencimento?: string;
  devedorId: string;
  empresaId: string;
}

interface CreateParcelaDTO {
  numero: number;
  valor: number;
  dataVencimento: string;
  dividaId: string;
}

class BillEasyApiClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = config.billeasyApi.url;
    this.serviceToken = config.billeasyApi.serviceToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Service-Token': this.serviceToken,
      ...(options.headers as Record<string, string> | undefined),
    };

    try {
      logger.debug('Requisição para API BillEasy', {
        method: options.method || 'GET',
        endpoint,
      });

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const statusCode = response.status;

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Erro na API BillEasy', {
          statusCode,
          endpoint,
          error: errorText,
        });

        return {
          success: false,
          error: errorText || `HTTP ${statusCode}`,
          statusCode,
        };
      }

      const data = (await response.json()) as T;

      logger.debug('Resposta da API BillEasy', {
        endpoint,
        statusCode,
      });

      return {
        success: true,
        data,
        statusCode,
      };
    } catch (error) {
      logger.error('Falha na comunicação com API BillEasy', {
        endpoint,
        error: error instanceof Error ? error.message : error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
        statusCode: 0,
      };
    }
  }

  // ============================================
  // Devedores
  // ============================================

  async createDevedor(data: CreateDevedorDTO): Promise<ApiResponse<{ id: string }>> {
    logger.info('Criando devedor via API Java', { nome: data.nome });

    return this.request<{ id: string }>('/api/devedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDevedor(
    id: string,
    data: Partial<CreateDevedorDTO>
  ): Promise<ApiResponse<{ id: string }>> {
    logger.info('Atualizando devedor via API Java', { id });

    return this.request<{ id: string }>(`/api/devedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Dívidas
  // ============================================

  async createDivida(data: CreateDividaDTO): Promise<ApiResponse<{ id: string }>> {
    logger.info('Criando dívida via API Java', {
      descricao: data.descricao,
      valor: data.valorPrincipal,
    });

    return this.request<{ id: string }>('/api/dividas', {
      method: 'POST',
      body: JSON.stringify({
        descricao: data.descricao,
        valorPrincipal: data.valorPrincipal,
        multaPercentual: data.multaPercentual,
        jurosMensalPercentual: data.jurosMensalPercentual,
        dataVencimento: data.dataVencimento,
        devedorId: data.devedorId,
        empresaId: data.empresaId,
      }),
    });
  }

  async updateDivida(
    id: string,
    data: Partial<CreateDividaDTO>
  ): Promise<ApiResponse<{ id: string }>> {
    logger.info('Atualizando dívida via API Java', { id });

    return this.request<{ id: string }>(`/api/dividas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateDividaStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<{ id: string }>> {
    logger.info('Atualizando status da dívida', { id, status });

    return this.request<{ id: string }>(`/api/dividas/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ============================================
  // Parcelas
  // ============================================

  async createParcelas(
    dividaId: string,
    parcelas: Omit<CreateParcelaDTO, 'dividaId'>[]
  ): Promise<ApiResponse<{ ids: string[] }>> {
    logger.info('Criando parcelas via API Java', {
      dividaId,
      quantidade: parcelas.length,
    });

    return this.request<{ ids: string[] }>(`/api/dividas/${dividaId}/parcelas`, {
      method: 'POST',
      body: JSON.stringify({ parcelas }),
    });
  }

  async updateParcelaStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<{ id: string }>> {
    logger.info('Atualizando status da parcela', { id, status });

    return this.request<{ id: string }>(`/api/parcelas/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ============================================
  // Contratos
  // ============================================

  async createContrato(data: {
    titulo: string;
    descricao?: string;
    valorTotal: number;
    credorEmpresaId: string;
    devedorId: string;
  }): Promise<ApiResponse<{ id: string }>> {
    logger.info('Criando contrato via API Java', { titulo: data.titulo });

    return this.request<{ id: string }>('/api/contratos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Validação de Saúde
  // ============================================

  async healthCheck(): Promise<boolean> {
    const response = await this.request<{ status: string }>('/actuator/health');
    return response.success && response.data?.status === 'UP';
  }
}

// Singleton export
export const billeasyApi = new BillEasyApiClient();

// Export types for external use
export type { CreateDevedorDTO, CreateDividaDTO, CreateParcelaDTO, ApiResponse };
