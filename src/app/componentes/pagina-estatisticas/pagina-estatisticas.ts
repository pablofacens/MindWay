import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PontosService } from '../../servicos/pontos.service';
import { NivelUsuario } from '../../modelos/pontos';

interface EstatisticaPorModal {
  modal: string;
  emoji: string;
  distancia: number;
  percentual: number;
  pontos: number;
}

interface RecordePessoal {
  titulo: string;
  valor: string;
  icone: string;
  descricao: string;
}

@Component({
  selector: 'app-pagina-estatisticas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagina-estatisticas">
      <div class="container">
        
                <div class="header">
          <h1>📊 Estatísticas Detalhadas</h1>
          <p>Visualize seu progresso e conquistas ao longo do tempo</p>
        </div>

                <div class="secao">
          <h2>🎯 Resumo Geral</h2>
          <div class="resumo-grid">
            <div class="resumo-card">
              <div class="resumo-icone">🏆</div>
              <div class="resumo-valor">{{ pontosTotal() }}</div>
              <div class="resumo-label">Pontos Totais</div>
            </div>
            <div class="resumo-card">
              <div class="resumo-icone">📏</div>
              <div class="resumo-valor">{{ distanciaTotal() }}</div>
              <div class="resumo-label">Km Percorridos</div>
            </div>
            <div class="resumo-card">
              <div class="resumo-icone">🌳</div>
              <div class="resumo-valor">{{ co2Evitado() }}</div>
              <div class="resumo-label">kg CO₂ Evitado</div>
            </div>
            <div class="resumo-card">
              <div class="resumo-icone">🏅</div>
              <div class="resumo-valor">{{ totalBadges() }}</div>
              <div class="resumo-label">Badges Conquistadas</div>
            </div>
          </div>
        </div>

                <div class="secao">
          <h2>🚶 Distância por Modo de Transporte</h2>
          <div class="modal-stats">
            @for (modal of estatisticasPorModal(); track modal.modal) {
              <div class="modal-item">
                <div class="modal-header">
                  <span class="modal-emoji">{{ modal.emoji }}</span>
                  <span class="modal-nome">{{ modal.modal }}</span>
                </div>
                <div class="modal-barra-container">
                  <div 
                    class="modal-barra"
                    [style.width.%]="modal.percentual"
                  ></div>
                </div>
                <div class="modal-stats-row">
                  <span>{{ modal.distancia.toFixed(1) }} km</span>
                  <span>{{ modal.percentual.toFixed(0) }}%</span>
                  <span>{{ modal.pontos }} pts</span>
                </div>
              </div>
            }
          </div>
        </div>

                <div class="secao">
          <h2>✨ Badges por Raridade</h2>
          <div class="raridade-grid">
            @for (raridade of raridades; track raridade.tipo) {
              <div class="raridade-card" [class]="'raridade-card--' + raridade.tipo">
                <div class="raridade-icone">{{ raridade.icone }}</div>
                <div class="raridade-nome">{{ raridade.nome }}</div>
                <div class="raridade-valor">{{ contarBadgesRaridade(raridade.tipo) }}</div>
                <div class="raridade-total">de {{ totalBadgesPorRaridade(raridade.tipo) }}</div>
              </div>
            }
          </div>
        </div>

                <div class="secao">
          <h2>🎯 Progresso em Desafios</h2>
          <div class="desafios-stats">
            <div class="desafio-stat">
              <div class="desafio-stat-valor">{{ totalDesafios() }}</div>
              <div class="desafio-stat-label">Desafios Ativos</div>
            </div>
            <div class="desafio-stat">
              <div class="desafio-stat-valor">{{ desafiosCompletados() }}</div>
              <div class="desafio-stat-label">Completados</div>
            </div>
            <div class="desafio-stat">
              <div class="desafio-stat-valor">{{ taxaConclusao() }}%</div>
              <div class="desafio-stat-label">Taxa de Conclusão</div>
            </div>
          </div>
        </div>

                <div class="secao">
          <h2>🏆 Recordes Pessoais</h2>
          <div class="recordes-grid">
            @for (recorde of recordesPessoais(); track recorde.titulo) {
              <div class="recorde-card">
                <div class="recorde-icone">{{ recorde.icone }}</div>
                <div class="recorde-conteudo">
                  <div class="recorde-titulo">{{ recorde.titulo }}</div>
                  <div class="recorde-valor">{{ recorde.valor }}</div>
                  <div class="recorde-desc">{{ recorde.descricao }}</div>
                </div>
              </div>
            }
          </div>
        </div>

                <div class="secao">
          <h2>⭐ Progressão de Nível</h2>
          @if (usuario(); as user) {
            <div class="nivel-card">
              <div class="nivel-atual">
                <div class="nivel-emoji">{{ obterEmojiNivel(user.nivel) }}</div>
                <div class="nivel-info">
                  <div class="nivel-titulo">{{ obterNomeNivel(user.nivel) }}</div>
                  <div class="nivel-desc">{{ user.pontos }} pontos totais</div>
                </div>
              </div>
              <div class="nivel-progresso">
                <div class="progresso-barra-container">
                  <div 
                    class="progresso-barra"
                    [style.width.%]="progressoNivel()"
                  ></div>
                </div>
                <div class="progresso-info">
                  <span>{{ progressoNivel().toFixed(0) }}% para o próximo nível</span>
                  <span>{{ pontosParaProximoNivel() }} pts restantes</span>
                </div>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  })
export class PaginaEstatisticasComponent {
  private pontosService = inject(PontosService);
  
  usuario = this.pontosService.usuario;

  pontosTotal = computed(() => this.usuario()?.pontos ?? 0);
  
  distanciaTotal = computed(() => {
    const km = this.usuario()?.estatisticas?.kmTotal ?? 0;
    return km.toFixed(1) + ' km';
  });

  co2Evitado = computed(() => {
    const kg = this.usuario()?.estatisticas?.co2Evitado ?? 0;
    return kg.toFixed(1) + ' kg';
  });

  totalBadges = computed(() => this.usuario()?.badges.length ?? 0);

  estatisticasPorModal = computed((): EstatisticaPorModal[] => {
    const usuario = this.usuario();
    if (!usuario) return [];

    const stats = usuario.estatisticas;
    const total = stats.kmTotal;

    const modais = [
      {
        modal: 'Bicicleta',
        emoji: '🚴',
        distancia: stats.kmBike,
        percentual: total > 0 ? (stats.kmBike / total) * 100 : 0,
        pontos: Math.round(stats.kmBike * 10) 
      },
      {
        modal: 'Caminhada',
        emoji: '🚶',
        distancia: stats.kmCaminhada,
        percentual: total > 0 ? (stats.kmCaminhada / total) * 100 : 0,
        pontos: Math.round(stats.kmCaminhada * 8) 
      },
      {
        modal: 'Bike Compartilhada',
        emoji: '🚲',
        distancia: stats.kmBikeCompartilhada,
        percentual: total > 0 ? (stats.kmBikeCompartilhada / total) * 100 : 0,
        pontos: Math.round(stats.kmBikeCompartilhada * 10) 
      }
    ];

    return modais.filter(m => m.distancia > 0)
      .sort((a, b) => b.distancia - a.distancia);
  });

  raridades = [
    { tipo: 'comum', nome: 'Comum', icone: '⚪' },
    { tipo: 'raro', nome: 'Raro', icone: '🔵' },
    { tipo: 'epico', nome: 'Épico', icone: '🟣' },
    { tipo: 'lendario', nome: 'Lendário', icone: '🟠' }
  ];

  contarBadgesRaridade(raridade: string): number {
    const usuario = this.usuario();
    if (!usuario) return 0;
    
    return usuario.badges.filter(badge => badge.raridade === raridade).length;
  }

  totalBadgesPorRaridade(raridade: string): number {
    
    const totais: Record<string, number> = {
      comum: 6,
      raro: 6,
      epico: 4,
      lendario: 4
    };
    return totais[raridade] || 0;
  }

  totalDesafios = computed(() => this.usuario()?.desafios.length ?? 0);
  
  desafiosCompletados = computed(() => 
    this.usuario()?.desafios.filter(d => d.concluido).length ?? 0
  );

  taxaConclusao = computed(() => {
    const total = this.totalDesafios();
    if (total === 0) return 0;
    const completados = this.desafiosCompletados();
    return Math.round((completados / total) * 100);
  });

  recordesPessoais = computed((): RecordePessoal[] => {
    const usuario = this.usuario();
    if (!usuario) return [];

    const stats = usuario.estatisticas;
    
    
    const maiorViagem = Math.max(stats.kmBike, stats.kmCaminhada, stats.kmBikeCompartilhada);

    return [
      {
        titulo: 'Maior Distância',
        valor: maiorViagem.toFixed(1) + ' km',
        icone: '🏃',
        descricao: 'Maior percurso registrado'
      },
      {
        titulo: 'Total de Rotas',
        valor: stats.rotasCompletadas.toString(),
        icone: '🗓️',
        descricao: 'Rotas completadas'
      },
      {
        titulo: 'Badge Mais Rara',
        valor: this.badgeMaisRara(),
        icone: '💎',
        descricao: 'Conquista mais valiosa'
      },
      {
        titulo: 'Pontos por Km',
        valor: this.mediaPontosPorKm().toFixed(1),
        icone: '⚡',
        descricao: 'Média de eficiência'
      },
      {
        titulo: 'Economia Total',
        valor: 'R$ ' + stats.economiaFinanceira.toFixed(2),
        icone: '💰',
        descricao: 'Economizado vs carro'
      },
      {
        titulo: 'Sequência Atual',
        valor: stats.streakDias + ' dias',
        icone: '🔥',
        descricao: 'Dias consecutivos ativos'
      }
    ];
  });

  badgeMaisRara(): string {
    const usuario = this.usuario();
    if (!usuario || usuario.badges.length === 0) return 'Nenhuma';
    
    const raridadeValor: Record<string, number> = {
      lendario: 4,
      epico: 3,
      raro: 2,
      comum: 1
    };

    let maisRara = '';
    let maiorValor = 0;

    usuario.badges.forEach(badge => {
      const valor = raridadeValor[badge.raridade] || 0;
      if (valor > maiorValor) {
        maiorValor = valor;
        maisRara = badge.raridade.charAt(0).toUpperCase() + badge.raridade.slice(1);
      }
    });

    return maisRara || 'Nenhuma';
  }

  mediaPontosPorKm = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return 0;
    
    const km = usuario.estatisticas.kmTotal;
    if (km === 0) return 0;
    return usuario.pontos / km;
  });

  obterNomeNivel(nivel: NivelUsuario): string {
    const configs: Record<NivelUsuario, string> = {
      [NivelUsuario.INICIANTE]: 'Iniciante Verde',
      [NivelUsuario.EXPLORADOR]: 'Explorador Urbano',
      [NivelUsuario.CICLISTA]: 'Ciclista Consciente',
      [NivelUsuario.CAMPEAO]: 'Campeão Verde',
      [NivelUsuario.LENDA]: 'Lenda Sustentável'
    };
    return configs[nivel] || 'Desconhecido';
  }

  obterEmojiNivel(nivel: NivelUsuario): string {
    const emojis: Record<NivelUsuario, string> = {
      [NivelUsuario.INICIANTE]: '🌱',
      [NivelUsuario.EXPLORADOR]: '🌿',
      [NivelUsuario.CICLISTA]: '🚴',
      [NivelUsuario.CAMPEAO]: '🏆',
      [NivelUsuario.LENDA]: '🌟'
    };
    return emojis[nivel] || '❓';
  }

  progressoNivel = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return 0;
    
    const pontos = usuario.pontos;
    const nivel = usuario.nivel;

    const pontosConfig: Record<NivelUsuario, number> = {
      [NivelUsuario.INICIANTE]: 0,
      [NivelUsuario.EXPLORADOR]: 500,
      [NivelUsuario.CICLISTA]: 1500,
      [NivelUsuario.CAMPEAO]: 3000,
      [NivelUsuario.LENDA]: 6000
    };

    const niveis = [
      NivelUsuario.INICIANTE,
      NivelUsuario.EXPLORADOR,
      NivelUsuario.CICLISTA,
      NivelUsuario.CAMPEAO,
      NivelUsuario.LENDA
    ];
    
    const indiceAtual = niveis.indexOf(nivel);
    if (indiceAtual === niveis.length - 1) return 100; 

    const pontosNivelAtual = pontosConfig[nivel];
    const pontosProximoNivel = pontosConfig[niveis[indiceAtual + 1]];
    
    const pontosNecessarios = pontosProximoNivel - pontosNivelAtual;
    const pontosObtidos = pontos - pontosNivelAtual;

    return Math.min(100, (pontosObtidos / pontosNecessarios) * 100);
  });

  pontosParaProximoNivel = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return 0;

    const pontos = usuario.pontos;
    const nivel = usuario.nivel;

    const pontosConfig: Record<NivelUsuario, number> = {
      [NivelUsuario.INICIANTE]: 0,
      [NivelUsuario.EXPLORADOR]: 500,
      [NivelUsuario.CICLISTA]: 1500,
      [NivelUsuario.CAMPEAO]: 3000,
      [NivelUsuario.LENDA]: 6000
    };

    const niveis = [
      NivelUsuario.INICIANTE,
      NivelUsuario.EXPLORADOR,
      NivelUsuario.CICLISTA,
      NivelUsuario.CAMPEAO,
      NivelUsuario.LENDA
    ];
    
    const indiceAtual = niveis.indexOf(nivel);
    if (indiceAtual === niveis.length - 1) return 0; 

    const pontosProximoNivel = pontosConfig[niveis[indiceAtual + 1]];
    return Math.max(0, pontosProximoNivel - pontos);
  });
}
