import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DadosClima,
  CONFIGURACOES_CLIMA,
  iconeParaEmoji,
  formatarDirecaoVento,
} from '../../modelos/clima';

@Component({
  selector: 'app-widget-clima',
  template: `
    @if (clima(); as c) {
      <div class="widget">
                <div class="widget__header">
          <div class="temperatura">
            <span class="temperatura__emoji">{{ emoji() }}</span>
            <span class="temperatura__valor">{{ c.atual.temperatura.toFixed(0) }}°</span>
          </div>
          <div class="info">
            <div class="info__local">{{ c.local }}</div>
            <div class="info__descricao">{{ c.atual.descricao }}</div>
          </div>
        </div>

                <div class="analise" [class]="'analise--' + c.analise.nivel.toLowerCase()">
          <div class="analise__header">
            <span class="analise__icone">{{ iconeNivel() }}</span>
            <span class="analise__texto">{{ descricaoNivel() }}</span>
            <span class="analise__pontuacao">{{ c.analise.pontuacao }}/100</span>
          </div>
        </div>

                <div class="detalhes">
          <div class="detalhe">
            <span class="detalhe__icone">🌡️</span>
            <span class="detalhe__label">Sensação</span>
            <span class="detalhe__valor">{{ c.atual.sensacaoTermica.toFixed(0) }}°</span>
          </div>
          <div class="detalhe">
            <span class="detalhe__icone">💧</span>
            <span class="detalhe__label">Umidade</span>
            <span class="detalhe__valor">{{ c.atual.umidade }}%</span>
          </div>
          <div class="detalhe">
            <span class="detalhe__icone">💨</span>
            <span class="detalhe__label">Vento</span>
            <span class="detalhe__valor">
              {{ c.atual.velocidadeVento.toFixed(0) }}km/h
              {{ formatarDirecao(c.atual.direcaoVento) }}
            </span>
          </div>
        </div>

                @if (c.previsao.length > 0) {
          <div class="previsao">
            <div class="previsao__titulo">Próximas horas</div>
            <div class="previsao__lista">
              @for (prev of c.previsao; track prev.horario) {
                <div class="previsao__item">
                  <div class="previsao__hora">{{ formatarHora(prev.horario) }}</div>
                  <div class="previsao__emoji">{{ iconeParaEmoji(prev.icone) }}</div>
                  <div class="previsao__temp">{{ prev.temperatura.toFixed(0) }}°</div>
                  @if (prev.probabilidadeChuva > 20) {
                    <div class="previsao__chuva">☔ {{ prev.probabilidadeChuva.toFixed(0) }}%</div>
                  }
                </div>
              }
            </div>
          </div>
        }

                @if (c.analise.alertas.length > 0) {
          <div class="alertas">
            @for (alerta of c.analise.alertas; track $index) {
              <div class="alerta">{{ alerta }}</div>
            }
          </div>
        }

                @if (c.analise.recomendacoes.length > 0) {
          <div class="recomendacoes">
            @for (rec of c.analise.recomendacoes.slice(0, 3); track $index) {
              <div class="recomendacao">{{ rec }}</div>
            }
          </div>
        }

                <div class="atualizacao">
          Atualizado: {{ formatarHorario(c.horarioAtualizacao) }}
        </div>
      </div>
    }
  `,
  styles: `
    .widget {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-width: 420px;
    }

    .widget__header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .temperatura {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .temperatura__emoji {
      font-size: 48px;
      line-height: 1;
    }

    .temperatura__valor {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
    }

    .info {
      flex: 1;
    }

    .info__local {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .info__descricao {
      font-size: 14px;
      color: #64748b;
      text-transform: capitalize;
    }

    .analise {
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid;
    }

    .analise--ideal {
      background: rgba(16, 185, 129, 0.1);
      border-color: #10b981;
    }

    .analise--bom {
      background: rgba(132, 204, 22, 0.1);
      border-color: #84cc16;
    }

    .analise--aceitavel {
      background: rgba(245, 158, 11, 0.1);
      border-color: #f59e0b;
    }

    .analise--ruim {
      background: rgba(249, 115, 22, 0.1);
      border-color: #f97316;
    }

    .analise--perigoso {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }

    .analise__header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .analise__icone {
      font-size: 20px;
    }

    .analise__texto {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      color: #1e293b;
    }

    .analise__pontuacao {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }

    .detalhes {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .detalhe {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .detalhe__icone {
      font-size: 20px;
      margin-bottom: 2px;
    }

    .detalhe__label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 2px;
    }

    .detalhe__valor {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }

    .previsao {
      margin-bottom: 12px;
    }

    .previsao__titulo {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .previsao__lista {
      display: flex;
      gap: 12px;
    }

    .previsao__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #f8fafc;
      border-radius: 6px;
      flex: 1;
      min-width: 0;
    }

    .previsao__hora {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }

    .previsao__emoji {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .previsao__temp {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .previsao__chuva {
      font-size: 10px;
      color: #0ea5e9;
    }

    .alertas {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }

    .alerta {
      padding: 6px 8px;
      background: rgba(249, 115, 22, 0.1);
      border-left: 3px solid #f97316;
      border-radius: 4px;
      font-size: 12px;
      color: #c2410c;
    }

    .recomendacoes {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }

    .recomendacao {
      padding: 6px 8px;
      background: rgba(14, 116, 144, 0.1);
      border-left: 3px solid #0e7490;
      border-radius: 4px;
      font-size: 12px;
      color: #164e63;
    }

    .atualizacao {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class WidgetClimaComponent {
  clima = input.required<DadosClima | null>();

  emoji() {
    const c = this.clima();
    return c ? iconeParaEmoji(c.atual.icone) : '🌤️';
  }

  iconeNivel() {
    const c = this.clima();
    return c ? CONFIGURACOES_CLIMA.icones[c.analise.nivel] : '😊';
  }

  descricaoNivel() {
    const c = this.clima();
    return c ? CONFIGURACOES_CLIMA.descricoes[c.analise.nivel] : 'Carregando...';
  }

  formatarDirecao(graus?: number): string {
    return formatarDirecaoVento(graus);
  }

  formatarHora(timestamp: number): string {
    const data = new Date(timestamp * 1000);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarHorario(data: Date): string {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  
  iconeParaEmoji = iconeParaEmoji;
}
