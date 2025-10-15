import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  PerfilElevacao, 
  AnaliseElevacao, 
  analisarElevacao, 
  CONFIGURACOES_ELEVACAO 
} from '../../modelos/elevacao';

@Component({
  selector: 'app-grafico-elevacao',
  template: `
    @if (perfil(); as p) {
      @if (p.pontos.length > 0) {
        <div class="grafico-container">
          <h3 class="grafico__titulo">⛰️ Perfil de Elevação</h3>
          
                    <div class="analise" [class]="'analise--' + analise().nivel.toLowerCase()">
            <div class="analise__header">
              <span class="analise__icone">{{ icone() }}</span>
              <span class="analise__nivel">{{ nivelTexto() }}</span>
            </div>
            <p class="analise__descricao">{{ analise().descricao }}</p>
          </div>

                    <div class="estatisticas">
            <div class="stat">
              <span class="stat__label">Subida</span>
              <span class="stat__valor">{{ p.ganhoElevacao.toFixed(0) }}m</span>
            </div>
            <div class="stat">
              <span class="stat__label">Descida</span>
              <span class="stat__valor">{{ p.perdaElevacao.toFixed(0) }}m</span>
            </div>
            <div class="stat">
              <span class="stat__label">Mín/Máx</span>
              <span class="stat__valor">
                {{ p.elevacaoMinima.toFixed(0) }}/{{ p.elevacaoMaxima.toFixed(0) }}m
              </span>
            </div>
          </div>

                <svg 
          class="grafico" 
          [attr.viewBox]="'0 0 ' + largura + ' ' + altura"
          preserveAspectRatio="none">
                    <path 
            [attr.d]="caminhoArea()" 
            [attr.fill]="cor()"
            opacity="0.2"/>
                    <path 
            [attr.d]="caminhoLinha()" 
            [attr.stroke]="cor()"
            stroke-width="2"
            fill="none"/>
        </svg>

                @if (analise().alertas.length > 0) {
          <div class="alertas">
            @for (alerta of analise().alertas; track $index) {
              <div class="alerta">{{ alerta }}</div>
            }
          </div>
        }

        @if (analise().recomendacoes.length > 0) {
          <div class="recomendacoes">
            @for (rec of analise().recomendacoes; track $index) {
              <div class="recomendacao">{{ rec }}</div>
            }
          </div>
        }
        </div>
      }
    }
  `,
  styles: `
    .grafico-container {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .grafico__titulo {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .analise {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid;
    }

    .analise--facil {
      background: rgba(16, 185, 129, 0.1);
      border-color: #10b981;
    }

    .analise--moderado {
      background: rgba(245, 158, 11, 0.1);
      border-color: #f59e0b;
    }

    .analise--dificil {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }

    .analise--muito_dificil {
      background: rgba(124, 45, 18, 0.1);
      border-color: #7c2d12;
    }

    .analise__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .analise__icone {
      font-size: 20px;
    }

    .analise__nivel {
      font-weight: 600;
      font-size: 14px;
      color: #1e293b;
    }

    .analise__descricao {
      margin: 0;
      font-size: 13px;
      color: #475569;
      line-height: 1.4;
    }

    .estatisticas {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .stat__label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat__valor {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 2px;
    }

    .grafico {
      width: 100%;
      height: 120px;
      border-radius: 6px;
      background: #f8fafc;
      margin-bottom: 12px;
    }

    .alertas {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }

    .alerta {
      padding: 8px 10px;
      background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
      border-radius: 4px;
      font-size: 12px;
      color: #991b1b;
    }

    .recomendacoes {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .recomendacao {
      padding: 8px 10px;
      background: rgba(14, 116, 144, 0.1);
      border-left: 3px solid #0e7490;
      border-radius: 4px;
      font-size: 12px;
      color: #164e63;
    }

    @media (max-width: 768px) {
      .estatisticas {
        grid-template-columns: 1fr;
      }
    }
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class GraficoElevacaoComponent {
  perfil = input.required<PerfilElevacao | null>();

  
  readonly largura = 400;
  readonly altura = 120;
  readonly padding = 10;

  
  analise = computed(() => {
    const p = this.perfil();
    if (!p || p.pontos.length === 0) {
      return {
        nivel: 'FACIL' as const,
        descricao: '',
        alertas: [],
        recomendacoes: [],
      };
    }
    return analisarElevacao(p);
  });

  
  icone = computed(() => {
    const nivel = this.analise().nivel;
    return CONFIGURACOES_ELEVACAO.icones[nivel];
  });

  
  cor = computed(() => {
    const nivel = this.analise().nivel;
    return CONFIGURACOES_ELEVACAO.cores[nivel];
  });

  
  nivelTexto = computed(() => {
    const niveis = {
      FACIL: 'Fácil',
      MODERADO: 'Moderado',
      DIFICIL: 'Difícil',
      MUITO_DIFICIL: 'Muito Difícil',
    };
    return niveis[this.analise().nivel];
  });

  
  caminhoLinha(): string {
    const p = this.perfil();
    if (!p || p.pontos.length === 0) return '';

    const pontos = p.pontos;
    const larguraUtil = this.largura - 2 * this.padding;
    const alturaUtil = this.altura - 2 * this.padding;
    const escalaX = larguraUtil / (pontos.length - 1);
    const escalaY = alturaUtil / (p.elevacaoMaxima - p.elevacaoMinima || 1);

    let caminho = '';

    pontos.forEach((ponto, i) => {
      const x = this.padding + i * escalaX;
      const y = this.altura - this.padding - (ponto.elevacao - p.elevacaoMinima) * escalaY;

      if (i === 0) {
        caminho += `M ${x} ${y}`;
      } else {
        caminho += ` L ${x} ${y}`;
      }
    });

    return caminho;
  }

  
  caminhoArea(): string {
    const linha = this.caminhoLinha();
    if (!linha) return '';

    const p = this.perfil();
    if (!p) return '';

    const larguraUtil = this.largura - 2 * this.padding;
    const ultimoX = this.padding + larguraUtil;
    const baseY = this.altura - this.padding;

    
    return `${linha} L ${ultimoX} ${baseY} L ${this.padding} ${baseY} Z`;
  }
}
