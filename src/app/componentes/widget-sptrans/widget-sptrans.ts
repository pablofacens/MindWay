

import { Component, signal, computed, effect, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SptransService } from '../../servicos/sptrans.service';
import {
  Parada,
  PrevisaoChegada,
  PrevisaoLinha,
  VeiculoPrevisao,
  StatusSPTrans,
  formatarTempoChegada,
  veiculoEstaProximo,
  iconeAcessibilidade,
  formatarDistanciaSPTrans
} from '../../modelos/sptrans';

@Component({
  selector: 'app-widget-sptrans',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="widget-sptrans" *ngIf="mostrar()">
            <div class="widget-sptrans__status" [class.widget-sptrans__status--erro]="temErro()">
        @if (status() === 'sem_token') {
          <span class="status-badge status-badge--warning">⚠️ SPTrans não configurado</span>
        } @else if (status() === 'conectando') {
          <span class="status-badge status-badge--info">🔄 Conectando...</span>
        } @else if (status() === 'conectado') {
          <span class="status-badge status-badge--success">✅ SPTrans Online</span>
        } @else if (status() === 'erro') {
          <span class="status-badge status-badge--error">❌ Erro de conexão</span>
        }
      </div>

            @if (status() === 'conectado' || status() === 'desconectado') {
        <div class="widget-sptrans__acoes">
          <button 
            class="btn-buscar-paradas" 
            (click)="buscarParadasProximas()"
            [disabled]="buscandoParadas()">
            @if (buscandoParadas()) {
              🔄 Buscando...
            } @else {
              🚏 Buscar Paradas Próximas
            }
          </button>
        </div>
      }

            @if (paradasProximas().length > 0) {
        <div class="widget-sptrans__paradas">
          <h3 class="widget-sptrans__titulo">
            🚏 Paradas próximas ({{ paradasProximas().length }})
          </h3>
          
          <div class="paradas-lista">
            @for (parada of paradasProximas(); track parada.cp) {
              <div 
                class="parada-card" 
                [class.parada-card--selecionada]="paradaSelecionada() === parada.cp"
                (click)="selecionarParada(parada)">
                
                <div class="parada-card__header">
                  <span class="parada-card__nome">{{ parada.np }}</span>
                  <span class="parada-card__distancia">
                    📍 {{ formatarDistancia(obterDistanciaParada(parada.cp)) }}
                  </span>
                </div>
                
                <div class="parada-card__endereco">{{ parada.ed }}</div>
                
                @if (carregandoPrevisao() && paradaSelecionada() === parada.cp) {
                  <div class="parada-card__carregando">
                    <span class="spinner">⏳</span> Buscando previsões...
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-state">
                <p>📍 Nenhuma parada encontrada próxima à rota</p>
              </div>
            }
          </div>
        </div>
      }

            @if (previsaoAtual()) {
        <div class="widget-sptrans__previsoes">
          <div class="previsoes-header">
            <h3 class="widget-sptrans__titulo">
              ⏱️ Previsões de chegada
            </h3>
            <button class="btn-atualizar" (click)="atualizarPrevisoes()" [disabled]="carregandoPrevisao()">
              🔄 Atualizar
            </button>
          </div>
          
          <div class="parada-info">
            <strong>{{ previsaoAtual()!.np }}</strong>
            <small>{{ previsaoAtual()!.ed }}</small>
          </div>

          @if (previsaoAtual()!.l && previsaoAtual()!.l.length > 0) {
            <div class="linhas-lista">
              @for (linha of previsaoAtual()!.l; track linha.cl) {
                <div class="linha-card">
                  <div class="linha-card__header">
                    <span class="linha-card__numero">{{ linha.c }}</span>
                    <span class="linha-card__destino">
                      {{ linha.lt0 }} → {{ linha.lt1 }}
                    </span>
                  </div>

                  @if (linha.vs && linha.vs.length > 0) {
                    <div class="veiculos-lista">
                      @for (veiculo of linha.vs.slice(0, 3); track veiculo.p) {
                        <div 
                          class="veiculo-previsao"
                          [class.veiculo-previsao--proximo]="estaProximo(veiculo.t)">
                          <span class="veiculo-previsao__tempo">
                            {{ formatarTempo(veiculo.t) }}
                          </span>
                          @if (veiculo.a) {
                            <span class="veiculo-previsao__acessivel" title="Veículo acessível">
                              ♿
                            </span>
                          }
                        </div>
                      }
                      
                      @if (linha.vs.length > 3) {
                        <span class="mais-veiculos">
                          +{{ linha.vs.length - 3 }} mais
                        </span>
                      }
                    </div>
                  } @else {
                    <div class="sem-previsao">
                      <span>⏱️ Sem previsão no momento</span>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <p>⏱️ Nenhuma linha com previsão disponível</p>
            </div>
          }
        </div>
      }

            @if (status() === 'sem_token') {
        <div class="widget-sptrans__config">
          <div class="config-aviso">
            <h4>🚌 Configure a API SPTrans</h4>
            <p>Para ver previsões de ônibus em tempo real, configure seu token:</p>
            <ol>
              <li>Acesse <a href="https://www.sptrans.com.br/desenvolvedores/" target="_blank">SPTrans Desenvolvedores</a></li>
              <li>Cadastre-se e obtenha seu token</li>
              <li>Configure em <code>src/app/servicos/sptrans.service.ts</code></li>
            </ol>
          </div>
        </div>
      }
    </div>
  `,
  })
export class WidgetSptransComponent {
  private readonly sptransService = inject(SptransService);
  
  
  readonly latitude = input<number>(0);
  readonly longitude = input<number>(0);
  readonly mostrar = input<boolean>(true);
  
  
  readonly status = signal<StatusSPTrans>(StatusSPTrans.DESCONECTADO);
  readonly paradasProximas = signal<Parada[]>([]);
  readonly distanciasParadas = signal<{ [key: number]: number }>({});
  readonly paradaSelecionada = signal<number | null>(null);
  readonly previsaoAtual = signal<PrevisaoChegada | null>(null);
  readonly carregandoPrevisao = signal<boolean>(false);
  readonly buscandoParadas = signal<boolean>(false);
  
  
  private ultimasBuscaCoords: { lat: number; lng: number } | null = null;
  
  
  readonly temErro = computed(() => 
    this.status() === StatusSPTrans.ERRO || this.status() === StatusSPTrans.SEM_TOKEN
  );
  
  constructor() {
    
    this.sptransService.status$.subscribe((status: StatusSPTrans) => {
      this.status.set(status);
    });
    
    
    
    
  }
  
  
  async buscarParadasProximas(): Promise<void> {
    const lat = this.latitude();
    const lng = this.longitude();
    
    
    if (this.buscandoParadas()) {
      console.log('⏳ Busca de paradas já em andamento...');
      return;
    }
    
    
    if (this.ultimasBuscaCoords && 
        this.ultimasBuscaCoords.lat === lat && 
        this.ultimasBuscaCoords.lng === lng) {
      console.log('ℹ️ Paradas já buscadas para estas coordenadas');
      return;
    }
    
    this.buscandoParadas.set(true);
    this.ultimasBuscaCoords = { lat, lng };
    
    try {
      const resultado = await this.sptransService.buscarParadasProximas(lat, lng, 500);
      
      this.paradasProximas.set(resultado.paradas);
      this.distanciasParadas.set(resultado.distancias);
      
      console.log(`🚏 ${resultado.paradas.length} paradas encontradas`);
    } catch (error) {
      console.error('❌ Erro ao buscar paradas:', error);
      
      this.ultimasBuscaCoords = null;
    } finally {
      this.buscandoParadas.set(false);
    }
  }
  
  
  async selecionarParada(parada: Parada): Promise<void> {
    this.paradaSelecionada.set(parada.cp);
    this.carregandoPrevisao.set(true);
    
    try {
      const previsao = await this.sptransService.buscarPrevisaoChegada(parada.cp);
      this.previsaoAtual.set(previsao);
      console.log(`✅ Previsão obtida para parada ${parada.cp}`);
    } catch (error) {
      console.error('❌ Erro ao buscar previsão:', error);
      this.previsaoAtual.set(null);
    } finally {
      this.carregandoPrevisao.set(false);
    }
  }
  
  
  async atualizarPrevisoes(): Promise<void> {
    const codigoParada = this.paradaSelecionada();
    if (!codigoParada) return;
    
    this.carregandoPrevisao.set(true);
    this.sptransService.limparCachePrevisoes();
    
    try {
      const previsao = await this.sptransService.buscarPrevisaoChegada(codigoParada);
      this.previsaoAtual.set(previsao);
      console.log('✅ Previsões atualizadas');
    } catch (error) {
      console.error('❌ Erro ao atualizar previsões:', error);
    } finally {
      this.carregandoPrevisao.set(false);
    }
  }
  
  
  obterDistanciaParada(codigoParada: number): number {
    return this.distanciasParadas()[codigoParada] || 0;
  }
  
  
  formatarDistancia(metros: number): string {
    return formatarDistanciaSPTrans(metros);
  }
  
  
  formatarTempo(tempo: string): string {
    return formatarTempoChegada(tempo);
  }
  
  
  estaProximo(tempo: string): boolean {
    return veiculoEstaProximo(tempo);
  }
}
