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
      <!-- Botão toggle -->
      <button class="toggle-btn" (click)="minimizado.set(!minimizado())">
        @if (minimizado()) {
          <span class="emoji">🏆</span>
        } @else {
          <span class="icone">×</span>
        }
      </button>

      @if (!minimizado()) {
        <div class="conteudo">

          <!-- Botão de Login/Perfil -->
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

          <!-- Cabeçalho com pontos e nível -->
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

          <!-- Barra de progresso para próximo nível -->
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

          <!-- Abas: Badges / Desafios / Estatísticas -->
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

          <!-- Conteúdo das abas -->
          <div class="tab-conteudo">
            <!-- ABA BADGES -->
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

            <!-- ABA DESAFIOS -->
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

            <!-- ABA ESTATÍSTICAS -->
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
  styles: [`
    .dashboard-pontos {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      max-width: 100%;
      width: 100%;
    }

    .dashboard-pontos.minimizado {
      width: auto;
      max-width: none;
    }

    .toggle-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 20px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
      z-index: 1;
    }

    .toggle-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      transform: scale(1.1);
    }

    .toggle-btn .emoji {
      font-size: 28px;
      display: block;
    }

    .toggle-btn .icone {
      font-size: 32px;
      line-height: 1;
      color: #666;
    }

    .conteudo {
      padding: 24px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }

    .pontos-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .emoji-nivel {
      font-size: 48px;
      line-height: 1;
    }

    .pontos-display .info .pontos {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1;
    }

    .pontos-display .info .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nivel-badge {
      text-align: right;
    }

    .nivel-nome {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .nivel-cor {
      height: 4px;
      width: 80px;
      border-radius: 2px;
      margin-left: auto;
    }

    .progresso-nivel {
      margin-bottom: 20px;
    }

    .barra-container {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .barra-preenchida {
      height: 100%;
      transition: width 0.5s ease;
      border-radius: 4px;
    }

    .progresso-texto {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
    }

    .progresso-texto span:first-child {
      font-weight: 600;
      color: #333;
    }

    .faltam {
      font-size: 11px;
      color: #999;
    }

    .nivel-maximo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: 600;
      color: #333;
      animation: pulse 2s infinite;
    }

    .nivel-maximo .emoji {
      font-size: 24px;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }

    .tab {
      flex: 1;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: all 0.2s ease;
      margin-bottom: -2px;
    }

    .tab:hover {
      color: #333;
      background: rgba(0, 0, 0, 0.02);
    }

    .tab.active {
      color: #10b981;
      border-bottom-color: #10b981;
      font-weight: 600;
    }

    .tab-conteudo {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .tab-conteudo::-webkit-scrollbar {
      width: 6px;
    }

    .tab-conteudo::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 3px;
    }

    .tab-conteudo::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }

    .tab-conteudo::-webkit-scrollbar-thumb:hover {
      background: #999;
    }

    .badges-grid {
      display: grid;
      gap: 12px;
    }

    .badge-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: linear-gradient(135deg, #f8f9fa, #ffffff);
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .badge-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .badge-card.raro {
      background: linear-gradient(135deg, #e3f2fd, #ffffff);
      border-color: #2196f3;
    }

    .badge-card.epico {
      background: linear-gradient(135deg, #f3e5f5, #ffffff);
      border-color: #9c27b0;
    }

    .badge-card.lendario {
      background: linear-gradient(135deg, #fff8e1, #ffffff);
      border-color: #ffa000;
      box-shadow: 0 0 20px rgba(255, 160, 0, 0.3);
    }

    .badge-emoji {
      font-size: 36px;
      line-height: 1;
    }

    .badge-info {
      flex: 1;
    }

    .badge-nome {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .badge-desc {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .badge-bonus {
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
    }

    .desafios-lista {
      display: grid;
      gap: 12px;
    }

    .desafio-card {
      padding: 16px;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .desafio-card:hover {
      border-color: #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
    }

    .desafio-card.concluido {
      background: linear-gradient(135deg, #d1fae5, #ffffff);
      border-color: #10b981;
    }

    .desafio-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .desafio-emoji {
      font-size: 32px;
      line-height: 1;
    }

    .desafio-info {
      flex: 1;
    }

    .desafio-nome {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .desafio-tipo {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .desafio-recompensa {
      font-size: 14px;
      font-weight: 600;
      color: #10b981;
    }

    .desafio-progresso {
      margin-bottom: 8px;
    }

    .desafio-progresso .barra-container {
      height: 6px;
      margin-bottom: 6px;
    }

    .desafio-progresso .barra-preenchida {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .desafio-progresso .progresso-texto {
      font-size: 12px;
      color: #666;
      text-align: right;
    }

    .desafio-expira {
      font-size: 11px;
      color: #f59e0b;
      font-weight: 500;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-card {
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa, #ffffff);
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-card.destaque {
      background: linear-gradient(135deg, #d1fae5, #ffffff);
      border-color: #10b981;
    }

    .stat-emoji {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .stat-valor {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .vazio {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .vazio .emoji {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .vazio p {
      margin: 0;
      font-size: 14px;
    }

    .auth-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }

    .usuario-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: linear-gradient(135deg, #f8f9fa, #ffffff);
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
    }

    .usuario-dados {
      flex: 1;
      min-width: 0;
    }

    .usuario-nome {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .usuario-email {
      font-size: 11px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-logout {
      background: transparent;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.1);
      transform: scale(1.1);
    }

    .alerta-verificacao {
      padding: 8px 12px;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      font-size: 11px;
      color: #856404;
      text-align: center;
      margin-bottom: 8px;
    }

    .sync-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 11px;
      color: #10b981;
      padding: 8px;
    }

    .sync-status--offline {
      color: #999;
    }

    .sync-icone {
      font-size: 14px;
    }

    .sync-texto {
      font-weight: 500;
    }

    .auth-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .btn-auth {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-auth--login {
      background: white;
      color: #10b981;
      border: 2px solid #10b981;
    }

    .btn-auth--login:hover {
      background: #10b981;
      color: white;
      transform: translateY(-1px);
    }

    .btn-auth--registro {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .btn-auth--registro:hover {
      background: linear-gradient(135deg, #059669, #047857);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    @media (max-width: 768px) {
      .dashboard-pontos {
        border-radius: 0;
      }

      .conteudo {
        padding: 12px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .auth-section {
        font-size: 13px;
      }

      .avatar {
        width: 32px;
        height: 32px;
      }
    }
  `]
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