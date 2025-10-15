import { Component, computed, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PontosService } from '../../servicos/pontos.service';
import { AuthService } from '../../servicos/auth.service';
import { LoginComponent } from '../login/login';
import { CONFIGURACOES_NIVEIS } from '../../modelos/pontos';

@Component({
  selector: 'app-dashboard-pontos',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  template: `
    <app-login #modalLogin></app-login>
    
    <div class="dashboard-pontos" [class.minimizado]="minimizado()">
            <button class="toggle-btn" (click)="minimizado.set(!minimizado())">
        @if (minimizado()) {
          <span class="emoji">🏆</span>
        } @else {
          <span class="icone">×</span>
        }
      </button>

      @if (!minimizado()) {
        <div class="conteudo">
          
                    <div class="auth-section">
            @if (authService.estaAutenticado()) {
              <div class="usuario-info">
                @if (authService.usuario()?.foto) {
                  <img [src]="authService.usuario()!.foto!" alt="Foto" class="avatar">
                } @else {
                  <div class="avatar-placeholder">
                    {{ authService.usuario()?.nome?.charAt(0) || '?' }}
                  </div>
                }
                <div class="usuario-dados">
                  <div class="usuario-nome">{{ authService.usuario()?.nome || 'Usuário' }}</div>
                  <div class="usuario-email">{{ authService.usuario()?.email }}</div>
                </div>
                <button class="btn-logout" (click)="logout()" title="Sair">
                  🚪
                </button>
              </div>
              @if (authService.usuario() && !authService.usuario()!.emailVerificado) {
                <div class="alerta-verificacao">
                  ⚠️ Verifique seu email
                </div>
              }
              <div class="sync-status">
                <span class="sync-icone">☁️</span>
                <span class="sync-texto">Sincronizado na nuvem</span>
              </div>
            } @else {
              <div class="auth-btns">
                <button class="btn-auth btn-auth--login" (click)="abrirLogin()">
                  🔐 Entrar
                </button>
                <button class="btn-auth btn-auth--registro" (click)="abrirRegistro()">
                  ✨ Criar Conta
                </button>
              </div>
              <div class="sync-status sync-status--offline">
                <span class="sync-icone">📱</span>
                <span class="sync-texto">Dados apenas locais</span>
              </div>
            }
          </div>

                    <div class="header">
            <div class="pontos-display">
              <div class="emoji-nivel">{{ nivelConfig().emoji }}</div>
              <div class="info">
                <div class="pontos">{{ pontosService.pontos() }}</div>
                <div class="label">pontos</div>
              </div>
            </div>
            <div class="nivel-badge">
              <div class="nivel-nome">{{ nivelConfig().titulo }}</div>
              <div class="nivel-cor" [style.background]="nivelConfig().cor"></div>
            </div>
          </div>

                    @if (pontosService.progressoNivel() < 100) {
            <div class="progresso-nivel">
              <div class="barra-container">
                <div 
                  class="barra-preenchida" 
                  [style.width.%]="pontosService.progressoNivel()"
                  [style.background]="nivelConfig().cor">
                </div>
              </div>
              <div class="progresso-texto">
                <span>{{ pontosService.progressoNivel() }}%</span>
                <span class="faltam">{{ pontosService.pontosProximoNivel() }} pts para próximo nível</span>
              </div>
            </div>
          } @else {
            <div class="nivel-maximo">
              <span class="emoji">👑</span>
              <span>NÍVEL MÁXIMO ALCANÇADO!</span>
            </div>
          }

                    <div class="tabs">
            <button 
              class="tab" 
              [class.active]="abaAtiva() === 'badges'"
              (click)="abaAtiva.set('badges')">
              Badges ({{ pontosService.badges().length }})
            </button>
            <button 
              class="tab" 
              [class.active]="abaAtiva() === 'desafios'"
              (click)="abaAtiva.set('desafios')">
              Desafios ({{ desafiosAtivos().length }})
            </button>
            <button 
              class="tab" 
              [class.active]="abaAtiva() === 'stats'"
              (click)="abaAtiva.set('stats')">
              Stats
            </button>
          </div>

                    <div class="tab-conteudo">
                        @if (abaAtiva() === 'badges') {
              <div class="badges-grid">
                @if (pontosService.badges().length === 0) {
                  <div class="vazio">
                    <span class="emoji">🎯</span>
                    <p>Complete rotas para desbloquear badges!</p>
                  </div>
                } @else {
                  @for (badge of pontosService.badges(); track badge.tipo) {
                    <div class="badge-card" [class.raro]="badge.raridade === 'raro'" 
                         [class.epico]="badge.raridade === 'epico'"
                         [class.lendario]="badge.raridade === 'lendario'">
                      <div class="badge-emoji">{{ badge.emoji }}</div>
                      <div class="badge-info">
                        <div class="badge-nome">{{ badge.nome }}</div>
                        <div class="badge-desc">{{ badge.descricao }}</div>
                        <div class="badge-bonus">+{{ badge.pontosBonus }} pts</div>
                      </div>
                    </div>
                  }
                }
              </div>
            }

                        @if (abaAtiva() === 'desafios') {
              <div class="desafios-lista">
                @if (desafiosAtivos().length === 0) {
                  <div class="vazio">
                    <span class="emoji">📅</span>
                    <p>Novos desafios chegando em breve!</p>
                  </div>
                } @else {
                  @for (desafio of desafiosAtivos(); track desafio.id) {
                    <div class="desafio-card" [class.concluido]="desafio.concluido">
                      <div class="desafio-header">
                        <span class="desafio-emoji">{{ desafio.emoji }}</span>
                        <div class="desafio-info">
                          <div class="desafio-nome">{{ desafio.nome }}</div>
                          <div class="desafio-tipo">{{ desafio.tipo }}</div>
                        </div>
                        <div class="desafio-recompensa">{{ desafio.pontosRecompensa }} pts</div>
                      </div>
                      <div class="desafio-progresso">
                        <div class="barra-container">
                          <div 
                            class="barra-preenchida" 
                            [style.width.%]="(desafio.progresso / desafio.meta) * 100">
                          </div>
                        </div>
                        <div class="progresso-texto">
                          {{ desafio.progresso }} / {{ desafio.meta }}
                        </div>
                      </div>
                      @if (desafio.expiraEm) {
                        <div class="desafio-expira">
                          Expira em {{ calcularDiasRestantes(desafio.expiraEm) }} dias
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            }

                        @if (abaAtiva() === 'stats') {
              <div class="stats-grid">
                @if (stats(); as s) {
                  <div class="stat-card">
                    <div class="stat-emoji">🚶</div>
                    <div class="stat-valor">{{ s.kmCaminhada.toFixed(1) }} km</div>
                    <div class="stat-label">Caminhada</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🚴</div>
                    <div class="stat-valor">{{ s.kmBike.toFixed(1) }} km</div>
                    <div class="stat-label">Bicicleta</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🚲</div>
                    <div class="stat-valor">{{ s.kmBikeCompartilhada.toFixed(1) }} km</div>
                    <div class="stat-label">Bike Compartilhada</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🌍</div>
                    <div class="stat-valor">{{ s.kmTotal.toFixed(1) }} km</div>
                    <div class="stat-label">Total</div>
                  </div>
                  <div class="stat-card destaque">
                    <div class="stat-emoji">🍃</div>
                    <div class="stat-valor">{{ s.co2Evitado.toFixed(2) }} kg</div>
                    <div class="stat-label">CO₂ Evitado</div>
                  </div>
                  <div class="stat-card destaque">
                    <div class="stat-emoji">💰</div>
                    <div class="stat-valor">R$ {{ s.economiaFinanceira.toFixed(2) }}</div>
                    <div class="stat-label">Economia</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🌳</div>
                    <div class="stat-valor">{{ s.areasVerdesVisitadas.size }}</div>
                    <div class="stat-label">Áreas Verdes</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🏛️</div>
                    <div class="stat-valor">{{ s.pontosReferenciaVisitados.size }}</div>
                    <div class="stat-label">Pontos Turísticos</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">⛰️</div>
                    <div class="stat-valor">{{ s.ganhoElevacaoTotal.toFixed(0) }} m</div>
                    <div class="stat-label">Elevação Total</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🎯</div>
                    <div class="stat-valor">{{ s.rotasCompletadas }}</div>
                    <div class="stat-label">Rotas Completadas</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">🔥</div>
                    <div class="stat-valor">{{ s.streakDias }}</div>
                    <div class="stat-label">Dias Consecutivos</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-emoji">📊</div>
                    <div class="stat-valor">{{ s.scoreMedioSustentabilidade.toFixed(0) }}</div>
                    <div class="stat-label">Score Médio Sustent.</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  })
export class DashboardPontosComponent {
  pontosService = inject(PontosService);
  authService = inject(AuthService);
  
  @ViewChild('modalLogin') modalLogin!: LoginComponent;
  
  minimizado = signal(false);
  abaAtiva = signal<'badges' | 'desafios' | 'stats'>('badges');

  nivelConfig = computed(() => {
    const nivel = this.pontosService.nivel();
    return CONFIGURACOES_NIVEIS[nivel];
  });

  stats = computed(() => this.pontosService.estatisticas());

  desafiosAtivos = computed(() => 
    this.pontosService.desafios().filter(d => !d.concluido)
  );

  calcularDiasRestantes(dataExpiracao: Date): number {
    const agora = new Date();
    const expira = new Date(dataExpiracao);
    const diff = expira.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  abrirLogin() {
    this.modalLogin.abrir(false);
  }

  abrirRegistro() {
    this.modalLogin.abrir(true);
  }

  async logout() {
    if (confirm('Deseja realmente sair?')) {
      await this.authService.logout();
    }
  }
}
