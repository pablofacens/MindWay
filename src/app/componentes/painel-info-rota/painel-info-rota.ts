import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DadosClima, iconeParaEmoji, formatarDirecaoVento } from '../../modelos/clima';
import { PerfilElevacao } from '../../modelos/elevacao';


@Component({
  selector: 'app-painel-info-rota',
  template: `
    <div class="painel-info-landing">
      <div class="landing-conteudo">
        
                @if (clima(); as c) {
          <article class="info-card info-card--clima">
            <div class="card-header">
              <span class="card-emoji">{{ iconeParaEmoji(c.atual.icone) }}</span>
              <h2 class="card-titulo">Condições Climáticas</h2>
            </div>
              
                            <div class="clima-principal">
                <div class="temp-atual">{{ c.atual.temperatura.toFixed(0) }}°</div>
                <div class="temp-info">
                  <div class="temp-desc">{{ c.atual.descricao }}</div>
                  <div class="temp-local">{{ c.local }}</div>
                </div>
              </div>

                            <div class="clima-analise" [class]="'analise--' + c.analise.nivel.toLowerCase()">
                <div class="analise-badge">
                  <span class="analise-emoji">{{ obterEmojiAdequacao(c.analise.nivel) }}</span>
                  <span class="analise-texto">{{ c.analise.nivel }}</span>
                  <span class="analise-pontos">{{ c.analise.pontuacao }}/100</span>
                </div>
              </div>

                            <div class="clima-detalhes">
                <div class="detalhe">
                  <span class="detalhe-icone">🌡️</span>
                  <div class="detalhe-info">
                    <div class="detalhe-label">Sensação Térmica</div>
                    <div class="detalhe-valor">{{ c.atual.sensacaoTermica.toFixed(0) }}°C</div>
                  </div>
                </div>
                <div class="detalhe">
                  <span class="detalhe-icone">💧</span>
                  <div class="detalhe-info">
                    <div class="detalhe-label">Umidade</div>
                    <div class="detalhe-valor">{{ c.atual.umidade }}%</div>
                  </div>
                </div>
                <div class="detalhe">
                  <span class="detalhe-icone">💨</span>
                  <div class="detalhe-info">
                    <div class="detalhe-label">Vento</div>
                    <div class="detalhe-valor">
                      {{ c.atual.velocidadeVento.toFixed(0) }} km/h 
                      {{ c.atual.direcaoVento ? formatarDirecaoVento(c.atual.direcaoVento) : '' }}
                    </div>
                  </div>
                </div>
              </div>

                            @if (c.previsao && c.previsao.length > 0) {
                <div class="clima-previsao">
                  <div class="previsao-titulo">📅 Próximas Horas</div>
                  <div class="previsao-lista">
                    @for (prev of c.previsao.slice(0, 4); track prev.horario) {
                      <div class="previsao-item">
                        <div class="prev-hora">{{ formatarHora(prev.horario) }}</div>
                        <div class="prev-emoji">{{ iconeParaEmoji(prev.icone) }}</div>
                        <div class="prev-temp">{{ prev.temperatura.toFixed(0) }}°</div>
                        @if (prev.probabilidadeChuva > 20) {
                          <div class="prev-chuva">☔ {{ prev.probabilidadeChuva.toFixed(0) }}%</div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

                            @if (c.analise.alertas && c.analise.alertas.length > 0) {
                <div class="clima-alertas">
                  <div class="alertas-titulo">⚠️ Alertas</div>
                  @for (alerta of c.analise.alertas; track $index) {
                    <div class="alerta-item">{{ alerta }}</div>
                  }
                </div>
              }

                            @if (c.analise.recomendacoes && c.analise.recomendacoes.length > 0) {
                <div class="clima-recomendacoes">
                  <div class="recomendacoes-titulo">💡 Recomendações</div>
                  @for (rec of c.analise.recomendacoes; track $index) {
                    <div class="recomendacao-item">{{ rec }}</div>
                  }
                </div>
              }

                            <div class="clima-atualizacao">
                Atualizado: {{ c.horarioAtualizacao.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </article>
          }

                    @if (elevacao(); as e) {
            <article class="info-card info-card--elevacao">
              <div class="card-header">
                <span class="card-emoji">🏔️</span>
                <h2 class="card-titulo">Perfil de Elevação</h2>
              </div>

                            <div class="elevacao-stats">
                <div class="stat-box stat-box--ganho">
                  <div class="stat-label">Ganho</div>
                  <div class="stat-valor">+{{ e.ganhoElevacao.toFixed(0) }}m</div>
                </div>
                <div class="stat-box stat-box--perda">
                  <div class="stat-label">Perda</div>
                  <div class="stat-valor">-{{ e.perdaElevacao.toFixed(0) }}m</div>
                </div>
                <div class="stat-box stat-box--max">
                  <div class="stat-label">Máxima</div>
                  <div class="stat-valor">{{ e.elevacaoMaxima.toFixed(0) }}m</div>
                </div>
                <div class="stat-box stat-box--min">
                  <div class="stat-label">Mínima</div>
                  <div class="stat-valor">{{ e.elevacaoMinima.toFixed(0) }}m</div>
                </div>
              </div>

                            <div class="elevacao-dificuldade" [class]="'dificuldade--' + obterClasseDificuldade(e)">
                <div class="dificuldade-badge">
                  <span class="dificuldade-emoji">{{ obterEmojiDificuldade(e) }}</span>
                  <span class="dificuldade-texto">{{ obterTextoDificuldade(e) }}</span>
                </div>
                              </div>

                            <div class="elevacao-info">
                <div class="info-item">
                  <span class="info-icone">📏</span>
                  <span class="info-texto">Distância total: {{ e.distanciaTotal.toFixed(2) }} km</span>
                </div>
                <div class="info-item">
                  <span class="info-icone">📊</span>
                  <span class="info-texto">{{ e.pontos.length }} pontos de elevação</span>
                </div>
              </div>
            </article>
          }

                    @if (iluminacao()) {
            <article class="info-card info-card--iluminacao">
              <div class="card-header">
                <span class="card-emoji">💡</span>
                <h2 class="card-titulo">Iluminação</h2>
              </div>
              <div class="iluminacao-nivel" [class]="'nivel--' + iluminacao()!.nivel">
                <span class="nivel-emoji">{{ iluminacao()!.emoji }}</span>
                <span class="nivel-texto">{{ iluminacao()!.descricao }}</span>
              </div>
              <div class="iluminacao-dica">{{ iluminacao()!.dica }}</div>
            </article>
          }

                    @if (seguranca()) {
            <article class="info-card info-card--seguranca">
              <div class="card-header">
                <span class="card-emoji">🛡️</span>
                <h2 class="card-titulo">Segurança</h2>
              </div>
              <div class="seguranca-nivel" [class]="'nivel--' + seguranca()!.nivel">
                <span class="nivel-emoji">{{ seguranca()!.emoji }}</span>
                <span class="nivel-texto">{{ seguranca()!.descricao }}</span>
              </div>
              @if (seguranca()!.itens && seguranca()!.itens.length > 0) {
                <ul class="seguranca-lista">
                  @for (item of seguranca()!.itens; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              }
            </article>
          }

                    @if (descricao()) {
            <article class="info-card info-card--descricao">
              <div class="card-header">
                <span class="card-emoji">📝</span>
                <h2 class="card-titulo">Sobre a Rota</h2>
              </div>
              <p class="descricao-texto">{{ descricao() }}</p>
            </article>
          }

                    @if (sustentabilidade(); as sust) {
            <article class="info-card info-card--sustentabilidade">
              <div class="card-header">
                <span class="card-emoji">{{ sust.emoji }}</span>
                <h2 class="card-titulo">Análise Ambiental</h2>
              </div>

                            <div class="sustentabilidade-score" [class]="'score--' + obterClasseScore(sust.score)">
                <div class="score-circular">
                  <div class="score-valor">{{ sust.score }}</div>
                  <div class="score-max">/100</div>
                </div>
                <div class="score-info">
                  <div class="score-nivel">{{ sust.nivel }}</div>
                  <div class="score-desc">{{ sust.descricao }}</div>
                </div>
              </div>

                            <div class="sustentabilidade-metricas">
                @for (metrica of sust.metricas; track metrica.label) {
                  <div class="metrica-item">
                    <span class="metrica-emoji">{{ metrica.emoji }}</span>
                    <div class="metrica-info">
                      <div class="metrica-label">{{ metrica.label }}</div>
                      <div class="metrica-valor">{{ metrica.valor }}</div>
                    </div>
                  </div>
                }
              </div>

                            <div class="sustentabilidade-badge">
                <span class="badge-icone">♻️</span>
                <span class="badge-texto">Rota EQUILIBRADA - Zero Emissões</span>
              </div>
            </article>
          }
      </div>
    </div>
  `,
  styles: `
    
    .painel-info-landing {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .landing-conteudo {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      padding: 24px 0;
      max-width: 100%;
    }

    
    .info-card {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      transition: all 0.3s;
    }

    .info-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }

    .card-emoji {
      font-size: 28px;
    }

    .card-titulo {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.3px;
    }

    
    .info-card--clima {
      border-left: 5px solid #0ea5e9;
    }

    .clima-principal {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 18px;
    }

    .temp-atual {
      font-size: 56px;
      font-weight: 900;
      color: #0ea5e9;
      line-height: 1;
    }

    .temp-info {
      flex: 1;
    }

    .temp-desc {
      font-size: 17px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
    }

    .temp-local {
      font-size: 13px;
      color: #64748b;
    }

    .clima-analise {
      margin-bottom: 18px;
      padding: 14px;
      border-radius: 10px;
      background: #f1f5f9;
    }

    .analise-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .analise-emoji {
      font-size: 28px;
    }

    .analise-texto {
      flex: 1;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .analise-pontos {
      font-size: 18px;
      font-weight: 800;
      color: #0ea5e9;
    }

    .analise--ideal {
      background: #dcfce7;
      color: #15803d;
    }
    .analise--ideal .analise-pontos {
      color: #15803d;
    }

    .analise--bom {
      background: #dbeafe;
      color: #1e40af;
    }
    .analise--bom .analise-pontos {
      color: #1e40af;
    }

    .analise--aceitavel {
      background: #fef3c7;
      color: #a16207;
    }
    .analise--aceitavel .analise-pontos {
      color: #a16207;
    }

    .analise--ruim {
      background: #fed7aa;
      color: #c2410c;
    }
    .analise--ruim .analise-pontos {
      color: #c2410c;
    }

    .analise--perigoso {
      background: #fee2e2;
      color: #b91c1c;
    }
    .analise--perigoso .analise-pontos {
      color: #b91c1c;
    }

    .clima-detalhes {
      display: grid;
      gap: 12px;
      margin-bottom: 18px;
    }

    .detalhe {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .detalhe-icone {
      font-size: 22px;
    }

    .detalhe-info {
      flex: 1;
    }

    .detalhe-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 3px;
      font-weight: 600;
    }

    .detalhe-valor {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
    }

    .clima-previsao {
      margin-bottom: 18px;
      padding: 14px;
      background: #f8fafc;
      border-radius: 10px;
    }

    .previsao-titulo {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    .previsao-lista {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .previsao-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .prev-hora {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }

    .prev-emoji {
      font-size: 28px;
    }

    .prev-temp {
      font-size: 15px;
      font-weight: 800;
      color: #1e293b;
    }

    .prev-chuva {
      font-size: 10px;
      color: #0ea5e9;
      font-weight: 700;
    }

    .clima-alertas {
      margin-bottom: 14px;
      padding: 14px;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 8px;
    }

    .alertas-titulo {
      font-size: 12px;
      font-weight: 800;
      color: #b91c1c;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    .alerta-item {
      font-size: 13px;
      color: #991b1b;
      margin: 8px 0;
      line-height: 1.5;
      font-weight: 500;
    }

    .clima-recomendacoes {
      margin-bottom: 14px;
      padding: 14px;
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      border-radius: 8px;
    }

    .recomendacoes-titulo {
      font-size: 12px;
      font-weight: 800;
      color: #15803d;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    .recomendacao-item {
      font-size: 13px;
      color: #166534;
      margin: 8px 0;
      line-height: 1.5;
      font-weight: 500;
    }

    .clima-atualizacao {
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      margin-top: 10px;
      font-style: italic;
    }

    
    .info-card--elevacao {
      border-left: 5px solid #22c55e;
    }

    .elevacao-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }

    .stat-box {
      padding: 14px;
      border-radius: 10px;
      text-align: center;
    }

    .stat-box--ganho {
      background: #dcfce7;
    }

    .stat-box--perda {
      background: #fee2e2;
    }

    .stat-box--max {
      background: #dbeafe;
    }

    .stat-box--min {
      background: #fef3c7;
    }

    .stat-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      font-weight: 700;
      display: block;
      margin-bottom: 6px;
    }

    .stat-valor {
      font-size: 28px;
      font-weight: 900;
      color: #1e293b;
      display: block;
    }

    .elevacao-dificuldade {
      padding: 16px;
      border-radius: 10px;
      margin-bottom: 18px;
    }

    .dificuldade--facil {
      background: #dcfce7;
    }

    .dificuldade--moderado {
      background: #fef3c7;
    }

    .dificuldade--dificil {
      background: #fed7aa;
    }

    .dificuldade--muito-dificil {
      background: #fee2e2;
    }

    .dificuldade-badge {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
    }

    .dificuldade-emoji {
      font-size: 32px;
    }

    .dificuldade-texto {
      font-size: 20px;
      font-weight: 900;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .dificuldade-descricao {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      font-weight: 500;
    }

    .elevacao-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #475569;
      font-weight: 500;
    }

    .info-icone {
      font-size: 18px;
    }

    
    .info-card--iluminacao {
      border-left: 5px solid #f59e0b;
    }

    .info-card--seguranca {
      border-left: 5px solid #ef4444;
    }

    .info-card--descricao {
      border-left: 5px solid #8b5cf6;
    }

    .iluminacao-nivel,
    .seguranca-nivel {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border-radius: 10px;
      background: #f8fafc;
      margin-bottom: 14px;
    }

    .nivel-emoji {
      font-size: 32px;
    }

    .nivel-texto {
      font-size: 17px;
      font-weight: 800;
      color: #1e293b;
    }

    .iluminacao-dica {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      font-weight: 500;
    }

    .seguranca-lista {
      margin: 0;
      padding-left: 24px;
      font-size: 14px;
      color: #475569;
      line-height: 1.9;
      font-weight: 500;
    }

    .descricao-texto {
      font-size: 14px;
      color: #475569;
      line-height: 1.8;
      margin: 0;
      font-weight: 500;
    }

    
    .info-card--sustentabilidade {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
      border-left: 4px solid #10b981;
    }

    .sustentabilidade-score {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      margin: 16px 0;
    }

    .score-circular {
      display: flex;
      align-items: baseline;
      justify-content: center;
      min-width: 100px;
      height: 100px;
      border-radius: 50%;
      background: conic-gradient(#10b981 0%, #10b981 var(--score-percent), #e5e7eb var(--score-percent), #e5e7eb 100%);
      position: relative;
      padding: 8px;
    }

    .score-circular::before {
      content: '';
      position: absolute;
      inset: 8px;
      background: white;
      border-radius: 50%;
    }

    .score-valor {
      position: relative;
      z-index: 1;
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
    }

    .score-max {
      position: relative;
      z-index: 1;
      font-size: 16px;
      color: #64748b;
      margin-left: 2px;
    }

    .score-info {
      flex: 1;
    }

    .score-nivel {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 4px;
    }

    .score-desc {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }

    
    .score--excelente .score-circular {
      background: conic-gradient(#10b981 0%, #10b981 var(--score-percent), #e5e7eb var(--score-percent));
    }

    .score--excelente .score-valor {
      color: #10b981;
    }

    .score--bom .score-circular {
      background: conic-gradient(#3b82f6 0%, #3b82f6 var(--score-percent), #e5e7eb var(--score-percent));
    }

    .score--bom .score-valor {
      color: #3b82f6;
    }

    .score--moderado .score-circular {
      background: conic-gradient(#f59e0b 0%, #f59e0b var(--score-percent), #e5e7eb var(--score-percent));
    }

    .score--moderado .score-valor {
      color: #f59e0b;
    }

    .score--basico .score-circular {
      background: conic-gradient(#64748b 0%, #64748b var(--score-percent), #e5e7eb var(--score-percent));
    }

    .score--basico .score-valor {
      color: #64748b;
    }

    .sustentabilidade-metricas {
      display: grid;
      gap: 12px;
      margin: 16px 0;
    }

    .metrica-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 8px;
      border-left: 3px solid #10b981;
    }

    .metrica-emoji {
      font-size: 24px;
      min-width: 32px;
      text-align: center;
    }

    .metrica-info {
      flex: 1;
    }

    .metrica-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metrica-valor {
      font-size: 16px;
      color: #1e293b;
      font-weight: 600;
      margin-top: 2px;
    }

    .sustentabilidade-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 8px;
      margin-top: 16px;
    }

    .badge-icone {
      font-size: 20px;
    }

    .badge-texto {
      font-size: 14px;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    
    .painel-info__conteudo::-webkit-scrollbar {
      width: 10px;
    }

    .painel-info__conteudo::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }

    .painel-info__conteudo::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
    }

    .painel-info__conteudo::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class PainelInfoRotaComponent {
  
  clima = input<DadosClima | null>(null);
  elevacao = input<PerfilElevacao | null>(null);
  iluminacao = input<{ nivel: string; emoji: string; descricao: string; dica: string } | null>(null);
  seguranca = input<{ nivel: string; emoji: string; descricao: string; itens: string[] } | null>(null);
  descricao = input<string | null>(null);
  sustentabilidade = input<{ score: number; nivel: string; emoji: string; descricao: string; metricas: { label: string; valor: string; emoji: string }[] } | null>(null);

  
  expandido = true;

  
  iconeParaEmoji(icone: string): string {
    return iconeParaEmoji(icone);
  }

  formatarDirecaoVento(graus: number): string {
    return formatarDirecaoVento(graus);
  }

  obterEmojiAdequacao(nivel: string): string {
    const emojis: Record<string, string> = {
      'IDEAL': '🌟',
      'BOM': '✅',
      'ACEITAVEL': '⚠️',
      'RUIM': '❌',
      'PERIGOSO': '🚫'
    };
    return emojis[nivel] || '❓';
  }

  formatarHora(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatarHorario(timestamp: number): string {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  
  obterEmojiDificuldade(perfil: PerfilElevacao): string {
    const ganho = perfil.ganhoElevacao;
    if (ganho < 50) return '😊';
    if (ganho < 150) return '😅';
    if (ganho < 300) return '😰';
    return '🥵';
  }

  obterTextoDificuldade(perfil: PerfilElevacao): string {
    const ganho = perfil.ganhoElevacao;
    if (ganho < 50) return 'Fácil';
    if (ganho < 150) return 'Moderado';
    if (ganho < 300) return 'Difícil';
    return 'Muito Difícil';
  }

  obterClasseDificuldade(perfil: PerfilElevacao): string {
    return this.obterTextoDificuldade(perfil).toLowerCase().replace(' ', '-');
  }

  obterDescricaoDificuldade(perfil: PerfilElevacao): string {
    const ganho = perfil.ganhoElevacao;
    if (ganho < 50) return 'Rota com pouca inclinação, adequada para iniciantes.';
    if (ganho < 150) return 'Rota com subidas moderadas, requer preparo físico básico.';
    if (ganho < 300) return 'Rota desafiadora com subidas íngremes, recomendado para ciclistas experientes.';
    return 'Rota muito desafiadora com grandes elevações, apenas para ciclistas avançados.';
  }

  
  obterClasseScore(score: number): string {
    if (score >= 80) return 'excelente';
    if (score >= 60) return 'bom';
    if (score >= 40) return 'moderado';
    return 'basico';
  }
}
