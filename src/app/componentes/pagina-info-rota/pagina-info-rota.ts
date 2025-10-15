import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PainelInfoRotaComponent } from '../painel-info-rota/painel-info-rota';
import { RotaCalculada } from '../../modelos/rota-calculada';
import { DadosClima } from '../../modelos/clima';
import { PerfilElevacao } from '../../modelos/elevacao';

@Component({
  selector: 'app-pagina-info-rota',
  standalone: true,
  imports: [CommonModule, PainelInfoRotaComponent],
  template: `
    <div class="pagina-info-rota">
      @if (rota(); as rotaDados) {
        <div class="container">
          <div class="header">
            <h1>📍 Informações da Rota</h1>
            <p>Rota de {{ (rotaDados.distanciaMetros / 1000).toFixed(1) }} km</p>
          </div>

          <app-painel-info-rota
            [clima]="clima()"
            [elevacao]="elevacao()"
            [iluminacao]="iluminacao()"
            [seguranca]="seguranca()"
            [descricao]="descricao()"
            [sustentabilidade]="sustentabilidade()">
          </app-painel-info-rota>
        </div>
      } @else {
        <div class="container">
          <div class="vazio">
            <div class="vazio-icone">🗺️</div>
            <h2>Nenhuma rota calculada</h2>
            <p>Vá para o mapa e calcule uma rota para ver as informações detalhadas.</p>
          </div>
        </div>
      }
    </div>
  `,
  })
export class PaginaInfoRotaComponent {
  rota = input<RotaCalculada | null>(null);
  clima = input<DadosClima | null>(null);
  elevacao = input<PerfilElevacao | null>(null);
  iluminacao = input<{ nivel: string; emoji: string; descricao: string; dica: string } | null>(null);
  seguranca = input<{ nivel: string; emoji: string; descricao: string; itens: string[] } | null>(null);
  descricao = input<string | null>(null);
  sustentabilidade = input<{ score: number; nivel: string; emoji: string; descricao: string; metricas: { label: string; valor: string; emoji: string }[] } | null>(null);
}
