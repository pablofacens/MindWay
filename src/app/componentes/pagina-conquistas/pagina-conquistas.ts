import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PontosService } from '../../servicos/pontos.service';
import { CONFIGURACOES_NIVEIS, TipoBadge } from '../../modelos/pontos';

@Component({
  selector: 'app-pagina-conquistas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagina-conquistas">
      <div class="container">
        
                <div class="header">
          <h1>🏆 Suas Conquistas</h1>
          <p class="subtitulo">
            Você possui <strong>{{ pontosService.badges().length }}</strong> badges desbloqueados
          </p>
        </div>

                <div class="nivel-card">
          <div class="nivel-info">
            <div class="nivel-emoji">{{ nivelConfig().emoji }}</div>
            <div class="nivel-detalhes">
              <div class="nivel-titulo">{{ nivelConfig().titulo }}</div>
              <div class="nivel-desc">{{ nivelConfig().descricao }}</div>
            </div>
          </div>
          <div class="nivel-pontos">
            <div class="pontos-valor">{{ pontosService.pontos() }}</div>
            <div class="pontos-label">pontos totais</div>
          </div>
        </div>

                @if (pontosService.progressoNivel() < 100) {
          <div class="progresso-card">
            <div class="progresso-header">
              <span>Progresso para {{ proximoNivel() }}</span>
              <span class="progresso-percent">{{ pontosService.progressoNivel() }}%</span>
            </div>
            <div class="progresso-barra">
              <div 
                class="progresso-preenchido"
                [style.width.%]="pontosService.progressoNivel()"
                [style.background]="nivelConfig().cor">
              </div>
            </div>
            <div class="progresso-falta">
              Faltam {{ pontosService.pontosProximoNivel() }} pontos
            </div>
          </div>
        }

                <div class="secao">
          <h2>🎖️ Badges Conquistados</h2>
          
          @if (pontosService.badges().length === 0) {
            <div class="vazio">
              <div class="vazio-icone">🎯</div>
              <h3>Nenhum badge ainda</h3>
              <p>Complete rotas para desbloquear seus primeiros badges!</p>
            </div>
          } @else {
            <div class="badges-grid">
              @for (badge of badgesOrdenados(); track badge.tipo) {
                <div class="badge-card" [class]="'badge-card--' + badge.raridade">
                  <div class="badge-header">
                    <div class="badge-emoji">{{ badge.emoji }}</div>
                    <div class="badge-raridade">{{ obterTextoRaridade(badge.raridade) }}</div>
                  </div>
                  <div class="badge-corpo">
                    <div class="badge-nome">{{ badge.nome }}</div>
                    <div class="badge-desc">{{ badge.descricao }}</div>
                    <div class="badge-requisito">{{ badge.requisito }}</div>
                  </div>
                  <div class="badge-footer">
                    <div class="badge-bonus">+{{ badge.pontosBonus }} pontos</div>
                    @if (badge.desbloqueadoEm) {
                      <div class="badge-data">{{ formatarData(badge.desbloqueadoEm) }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

                <div class="secao">
          <h2>🎯 Desafios Ativos</h2>
          
          @if (desafiosAtivos().length === 0) {
            <div class="vazio">
              <div class="vazio-icone">📅</div>
              <h3>Nenhum desafio ativo</h3>
              <p>Novos desafios chegam toda semana!</p>
            </div>
          } @else {
            <div class="desafios-grid">
              @for (desafio of desafiosAtivos(); track desafio.id) {
                <div class="desafio-card" [class.concluido]="desafio.concluido">
                  <div class="desafio-header">
                    <div class="desafio-emoji">{{ desafio.emoji }}</div>
                    <div class="desafio-tipo">{{ desafio.tipo }}</div>
                  </div>
                  <div class="desafio-corpo">
                    <div class="desafio-nome">{{ desafio.nome }}</div>
                    <div class="desafio-desc">{{ desafio.descricao }}</div>
                  </div>
                  <div class="desafio-progresso">
                    <div class="progresso-barra">
                      <div 
                        class="progresso-preenchido"
                        [style.width.%]="(desafio.progresso / desafio.meta) * 100">
                      </div>
                    </div>
                    <div class="progresso-texto">
                      {{ desafio.progresso }} / {{ desafio.meta }}
                    </div>
                  </div>
                  <div class="desafio-footer">
                    <div class="desafio-recompensa">🎁 {{ desafio.pontosRecompensa }} pontos</div>
                    @if (desafio.expiraEm) {
                      <div class="desafio-expira">⏰ {{ calcularDiasRestantes(desafio.expiraEm) }}d</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
  })
export class PaginaConquistasComponent {
  pontosService = inject(PontosService);

  nivelConfig = computed(() => {
    const nivel = this.pontosService.nivel();
    return CONFIGURACOES_NIVEIS[nivel];
  });

  badgesOrdenados = computed(() => {
    const badges = [...this.pontosService.badges()];
    const ordem: Record<string, number> = {
      'lendario': 0,
      'epico': 1,
      'raro': 2,
      'comum': 3
    };
    return badges.sort((a, b) => ordem[a.raridade] - ordem[b.raridade]);
  });

  desafiosAtivos = computed(() => 
    this.pontosService.desafios().filter(d => !d.concluido)
  );

  proximoNivel(): string {
    const nivelAtual = this.pontosService.nivel();
    const niveis = Object.keys(CONFIGURACOES_NIVEIS);
    const indice = niveis.indexOf(nivelAtual);
    if (indice < niveis.length - 1) {
      const proximaChave = niveis[indice + 1];
      return CONFIGURACOES_NIVEIS[proximaChave as keyof typeof CONFIGURACOES_NIVEIS].titulo;
    }
    return 'Máximo';
  }

  obterTextoRaridade(raridade: string): string {
    const textos: Record<string, string> = {
      'comum': 'Comum',
      'raro': 'Raro',
      'epico': 'Épico',
      'lendario': 'Lendário'
    };
    return textos[raridade] || raridade;
  }

  formatarData(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(data);
  }

  calcularDiasRestantes(dataExpiracao: Date): number {
    const agora = new Date();
    const expira = new Date(dataExpiracao);
    const diff = expira.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
