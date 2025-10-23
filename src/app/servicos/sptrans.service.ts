

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { firstValueFrom, BehaviorSubject } from 'rxjs';
import {
  StatusSPTrans,
  SentidoLinha,
  Linha,
  Parada,
  VeiculosLinha,
  PrevisaoChegada,
  Corredor,
  ParadasProximas,
  FiltroLinhas,
  ConfiguracaoSPTrans,
  CONFIGURACOES_SPTRANS_PADRAO,
  MENSAGENS_ERRO_SPTRANS,
  calcularDistancia,
  Coordenada
} from '../modelos/sptrans';


const CONFIGURACOES_SPTRANS: ConfiguracaoSPTrans = {
  token: 'xxxxxxxxxxxxxxxxxxxx', 
  ...CONFIGURACOES_SPTRANS_PADRAO
};

@Injectable({
  providedIn: 'root'
})
export class SptransService {
  private readonly http = inject(HttpClient);
  
  
  private readonly statusSubject = new BehaviorSubject<StatusSPTrans>(StatusSPTrans.DESCONECTADO);
  public readonly status$ = this.statusSubject.asObservable();
  public readonly status = signal<StatusSPTrans>(StatusSPTrans.DESCONECTADO);
  
  
  private cookieAutenticacao: string | null = null;
  private ultimaAutenticacao: Date | null = null;
  private cacheLinhas: Linha[] = [];
  private cacheParadas: Map<number, Parada> = new Map();
  private cachePrevisoes: Map<number, { data: PrevisaoChegada; timestamp: Date }> = new Map();
  
  
  private autenticando = false;
  
  
  private readonly TEMPO_EXPIRACAO_SESSAO = 30 * 60 * 1000; 
  private readonly TEMPO_CACHE_PREVISAO = 30 * 1000; 
  
  constructor() {
    console.log('🚌 SPTrans Service inicializado');
    
    
    if (!CONFIGURACOES_SPTRANS.token || CONFIGURACOES_SPTRANS.token.length < 20) {
      console.warn('⚠️ Token SPTrans não configurado');
      this.atualizarStatus(StatusSPTrans.SEM_TOKEN);
    }
  }
  
  
  private atualizarStatus(novoStatus: StatusSPTrans): void {
    this.status.set(novoStatus);
    this.statusSubject.next(novoStatus);
    console.log(`🚌 Status SPTrans: ${novoStatus}`);
  }
  
  
  public estaAutenticado(): boolean {
    if (!this.cookieAutenticacao || !this.ultimaAutenticacao) {
      return false;
    }
    
    const tempoDecorrido = Date.now() - this.ultimaAutenticacao.getTime();
    return tempoDecorrido < this.TEMPO_EXPIRACAO_SESSAO;
  }
  
  
  public async autenticar(): Promise<boolean> {
    
    if (this.autenticando) {
      console.log('⏳ Autenticação já em andamento...');
      return false;
    }
    
    console.log('🔐 Autenticando na API SPTrans...');
    
    if (!CONFIGURACOES_SPTRANS.token || CONFIGURACOES_SPTRANS.token.length < 20) {
      console.error('❌ Token SPTrans não configurado');
      this.atualizarStatus(StatusSPTrans.SEM_TOKEN);
      throw new Error(MENSAGENS_ERRO_SPTRANS.SEM_TOKEN);
    }
    
    this.autenticando = true;
    this.atualizarStatus(StatusSPTrans.CONECTANDO);
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Login/Autenticar?token=${CONFIGURACOES_SPTRANS.token}`;
      
      const response = await firstValueFrom(
        this.http.post<boolean>(url, {}, {
          observe: 'response',
          withCredentials: true
        })
      ) as HttpResponse<boolean>;
      
      if (response.body === true) {
        
        const cookies = response.headers.get('Set-Cookie');
        if (cookies) {
          this.cookieAutenticacao = cookies;
        }
        
        this.ultimaAutenticacao = new Date();
        this.atualizarStatus(StatusSPTrans.CONECTADO);
        console.log('✅ Autenticação SPTrans bem-sucedida');
        return true;
      } else {
        throw new Error('Resposta de autenticação inválida');
      }
    } catch (error) {
      console.error('❌ Erro na autenticação SPTrans:', error);
      this.atualizarStatus(StatusSPTrans.ERRO);
      throw new Error(MENSAGENS_ERRO_SPTRANS.AUTENTICACAO_FALHOU);
    } finally {
      this.autenticando = false;
    }
  }
  
  
  private async garantirAutenticacao(): Promise<void> {
    if (!this.estaAutenticado()) {
      await this.autenticar();
    }
  }
  
  
  private obterHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (this.cookieAutenticacao) {
      headers = headers.set('Cookie', this.cookieAutenticacao);
    }
    
    return headers;
  }
  
  
  public async buscarLinhas(): Promise<Linha[]> {
    await this.garantirAutenticacao();
    
    
    if (this.cacheLinhas.length > 0) {
      console.log(`🚌 Retornando ${this.cacheLinhas.length} linhas do cache`);
      return this.cacheLinhas;
    }
    
    console.log('🔍 Buscando linhas...');
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Linha/Buscar?termosBusca=`;
      
      const linhas = await firstValueFrom(
        this.http.get<Linha[]>(url, {
          headers: this.obterHeaders(),
          withCredentials: true
        })
      ) as Linha[];
      
      this.cacheLinhas = linhas;
      console.log(`✅ ${linhas.length} linhas encontradas`);
      return linhas;
    } catch (error) {
      console.error('❌ Erro ao buscar linhas:', error);
      throw new Error(MENSAGENS_ERRO_SPTRANS.ERRO_REDE);
    }
  }
  
  
  public async buscarLinhaPorTermo(termo: string): Promise<Linha[]> {
    await this.garantirAutenticacao();
    
    console.log(`🔍 Buscando linhas com termo: "${termo}"`);
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Linha/Buscar?termosBusca=${encodeURIComponent(termo)}`;
      
      const linhas = await firstValueFrom(
        this.http.get<Linha[]>(url, {
          headers: this.obterHeaders(),
          withCredentials: true
        })
      ) as Linha[];
      
      console.log(`✅ ${linhas.length} linhas encontradas`);
      return linhas;
    } catch (error) {
      console.error('❌ Erro ao buscar linhas:', error);
      throw new Error(MENSAGENS_ERRO_SPTRANS.ERRO_REDE);
    }
  }
  
  
  public async buscarParadasProximas(lat: number, lng: number, raio: number = 500): Promise<ParadasProximas> {
    await this.garantirAutenticacao();
    
    console.log(`🔍 Buscando paradas próximas a (${lat}, ${lng}) raio ${raio}m`);
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Parada/Buscar?termosBusca=`;
      
      
      const todasParadas = await firstValueFrom(
        this.http.get<Parada[]>(url, {
          headers: this.obterHeaders(),
          withCredentials: true
        })
      ) as Parada[];
      
      
      const centro: Coordenada = { lat, lng };
      const paradasProximas: Parada[] = [];
      const distancias: { [codigoParada: number]: number } = {};
      
      for (const parada of todasParadas) {
        const coordParada: Coordenada = { lat: parada.py, lng: parada.px };
        const distancia = calcularDistancia(centro, coordParada);
        
        if (distancia <= raio) {
          paradasProximas.push(parada);
          distancias[parada.cp] = Math.round(distancia);
        }
      }
      
      
      paradasProximas.sort((a, b) => distancias[a.cp] - distancias[b.cp]);
      
      console.log(`✅ ${paradasProximas.length} paradas encontradas dentro de ${raio}m`);
      
      return {
        paradas: paradasProximas,
        distancias,
        centro,
        raio
      };
    } catch (error) {
      console.error('❌ Erro ao buscar paradas:', error);
      throw new Error(MENSAGENS_ERRO_SPTRANS.ERRO_REDE);
    }
  }
  
  
  public async buscarPosicaoVeiculos(codigoLinha: number): Promise<VeiculosLinha | null> {
    await this.garantirAutenticacao();
    
    console.log(`🚌 Buscando posições de veículos da linha ${codigoLinha}...`);
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Posicao/Linha?codigoLinha=${codigoLinha}`;
      
      const resultado = await firstValueFrom(
        this.http.get<{ l: VeiculosLinha[] }>(url, {
          headers: this.obterHeaders(),
          withCredentials: true
        })
      ) as { l: VeiculosLinha[] };
      
      if (resultado.l && resultado.l.length > 0) {
        const veiculosLinha = resultado.l[0];
        console.log(`✅ ${veiculosLinha.vs.length} veículos encontrados`);
        return veiculosLinha;
      }
      
      console.log('ℹ️ Nenhum veículo encontrado para esta linha');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar posições:', error);
      throw new Error(MENSAGENS_ERRO_SPTRANS.ERRO_REDE);
    }
  }
  
  
  public async buscarPrevisaoChegada(codigoParada: number): Promise<PrevisaoChegada | null> {
    await this.garantirAutenticacao();
    
    
    const cache = this.cachePrevisoes.get(codigoParada);
    if (cache) {
      const tempoDecorrido = Date.now() - cache.timestamp.getTime();
      if (tempoDecorrido < this.TEMPO_CACHE_PREVISAO) {
        console.log(`🚌 Retornando previsão do cache (parada ${codigoParada})`);
        return cache.data;
      }
    }
    
    console.log(`🔍 Buscando previsão de chegada na parada ${codigoParada}...`);
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Previsao/Parada?codigoParada=${codigoParada}`;
      
      const resultado = await firstValueFrom(
        this.http.get<{ p: PrevisaoChegada }>(url, {
          headers: this.obterHeaders(),
          withCredentials: true
        })
      ) as { p: PrevisaoChegada };
      
      if (resultado.p) {
        
        this.cachePrevisoes.set(codigoParada, {
          data: resultado.p,
          timestamp: new Date()
        });
        
        const totalLinhas = resultado.p.l?.length || 0;
        console.log(`✅ Previsão obtida: ${totalLinhas} linhas`);
        return resultado.p;
      }
      
      console.log('ℹ️ Nenhuma previsão disponível para esta parada');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar previsão:', error);
      throw new Error(MENSAGENS_ERRO_SPTRANS.ERRO_REDE);
    }
  }
  
  
  public async buscarCorredores(): Promise<Corredor[]> {
    await this.garantirAutenticacao();
    
    console.log('🔍 Buscando corredores...');
    
    try {
      const url = `${CONFIGURACOES_SPTRANS.urlBase}/Corredor`;
      
      const corredores = await firstValueFrom(
        this.http.get<Corredor[]>(url, {
          headers: this.obterHeaders(),
          withCredentials: true
        })
      ) as Corredor[];
      
      console.log(`✅ ${corredores.length} corredores encontrados`);
      return corredores;
    } catch (error) {
      console.error('❌ Erro ao buscar corredores:', error);
      throw new Error(MENSAGENS_ERRO_SPTRANS.ERRO_REDE);
    }
  }
  
  
  public limparCachePrevisoes(): void {
    this.cachePrevisoes.clear();
    console.log('🗑️ Cache de previsões limpo');
  }
  
  
  public limparTodoCache(): void {
    this.cacheLinhas = [];
    this.cacheParadas.clear();
    this.cachePrevisoes.clear();
    console.log('🗑️ Todo cache limpo');
  }
  
  
  public estaDisponivel(): boolean {
    return this.status() !== StatusSPTrans.SEM_TOKEN;
  }
}
