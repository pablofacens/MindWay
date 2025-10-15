import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoritosService } from '../../servicos/favoritos.service';
import {
  RotaFavorita,
  EstatisticasFavoritos,
  formatarDistancia,
  formatarDuracao,
  formatarData,
  CONFIGURACOES_FAVORITOS,
} from '../../modelos/favorito';

@Component({
  selector: 'app-painel-favoritos',
  template: `
    <div class="painel">
            <div class="header">
        <button
          class="aba"
          [class.aba--ativa]="abaAtiva() === 'favoritos'"
          (click)="abaAtiva.set('favoritos')">
          ⭐ Favoritos ({{ favoritos().length }})
        </button>
        <button
          class="aba"
          [class.aba--ativa]="abaAtiva() === 'estatisticas'"
          (click)="abaAtiva.set('estatisticas')">
          📊 Estatísticas
        </button>
      </div>

            @if (abaAtiva() === 'favoritos') {
        <div class="conteudo">
                    <div class="busca">
            <input
              type="text"
              class="busca__input"
              placeholder="🔍 Buscar favoritos..."
              [(ngModel)]="termoBusca"
              (ngModelChange)="buscar()">
          </div>

                    <div class="ordenacao">
            <select class="ordenacao__select" [(ngModel)]="criterioOrdenacao" (ngModelChange)="ordenar()">
              <option value="recente">Mais recentes</option>
              <option value="uso">Mais usados</option>
              <option value="nome">Nome (A-Z)</option>
              <option value="distancia">Distância</option>
            </select>
          </div>

                    @if (favoritosFiltrados().length === 0) {
            <div class="vazio">
              @if (favoritos().length === 0) {
                <div class="vazio__icone">⭐</div>
                <div class="vazio__titulo">Nenhum favorito ainda</div>
                <div class="vazio__texto">
                  Clique no botão ⭐ ao calcular uma rota para salvá-la
                </div>
              } @else {
                <div class="vazio__icone">🔍</div>
                <div class="vazio__titulo">Nenhum resultado</div>
                <div class="vazio__texto">Tente outro termo de busca</div>
              }
            </div>
          } @else {
            <div class="lista">
              @for (fav of favoritosFiltrados(); track fav.id) {
                <div class="item" (click)="selecionar(fav)">
                  <div class="item__header">
                    <div class="item__nome">{{ fav.nome }}</div>
                    <button
                      class="item__remover"
                      (click)="removerFavorito($event, fav.id)"
                      title="Remover favorito">
                      🗑️
                    </button>
                  </div>

                  <div class="item__rota">
                    <span class="item__local">{{ fav.origem.nome }}</span>
                    <span class="item__seta">→</span>
                    <span class="item__local">{{ fav.destino.nome }}</span>
                  </div>

                  @if (fav.descricao) {
                    <div class="item__descricao">{{ fav.descricao }}</div>
                  }

                  <div class="item__detalhes">
                    <span class="detalhe">
                      <span class="detalhe__icone">{{ emojiTipoRota(fav.tipoRota) }}</span>
                      {{ formatarDistancia(fav.distanciaMetros) }}
                    </span>
                    <span class="detalhe">
                      <span class="detalhe__icone">⏱️</span>
                      {{ formatarDuracao(fav.duracaoSegundos) }}
                    </span>
                    @if (fav.vezesUsada > 0) {
                      <span class="detalhe">
                        <span class="detalhe__icone">🔄</span>
                        {{ fav.vezesUsada }}x
                      </span>
                    }
                  </div>

                  @if (fav.tags && fav.tags.length > 0) {
                    <div class="item__tags">
                      @for (tag of fav.tags; track $index) {
                        <span class="tag">{{ tag }}</span>
                      }
                    </div>
                  }

                  <div class="item__footer">
                    <span class="item__data">
                      {{ formatarData(fav.ultimoUso || fav.dataCriacao) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }

                    @if (favoritos().length > 0) {
            <div class="acoes">
              <button class="botao botao--secundario" (click)="exportarFavoritos()">
                📤 Exportar
              </button>
              <button class="botao botao--secundario" (click)="importarFavoritos()">
                📥 Importar
              </button>
              <button class="botao botao--perigo" (click)="limparTodos()">
                🗑️ Limpar Todos
              </button>
            </div>
          }
        </div>
      }

            @if (abaAtiva() === 'estatisticas') {
        <div class="conteudo">
          @if (estatisticas().totalRotas === 0) {
            <div class="vazio">
              <div class="vazio__icone">📊</div>
              <div class="vazio__titulo">Sem estatísticas</div>
              <div class="vazio__texto">Use suas rotas favoritas para acumular dados</div>
            </div>
          } @else {
            <div class="estatisticas">
              <div class="stat-card">
                <div class="stat-card__icone">⭐</div>
                <div class="stat-card__valor">{{ estatisticas().totalRotas }}</div>
                <div class="stat-card__label">Rotas Favoritas</div>
              </div>

              <div class="stat-card">
                <div class="stat-card__icone">🚴</div>
                <div class="stat-card__valor">{{ estatisticas().totalViagens }}</div>
                <div class="stat-card__label">Viagens Realizadas</div>
              </div>

              <div class="stat-card">
                <div class="stat-card__icone">📏</div>
                <div class="stat-card__valor">{{ estatisticas().totalKmPercorridos.toFixed(1) }}km</div>
                <div class="stat-card__label">Distância Total</div>
              </div>

              <div class="stat-card stat-card--destaque">
                <div class="stat-card__icone">🌱</div>
                <div class="stat-card__valor">{{ estatisticas().totalCO2Evitado.toFixed(1) }}kg</div>
                <div class="stat-card__label">CO₂ Evitado</div>
              </div>

              <div class="stat-card stat-card--destaque">
                <div class="stat-card__icone">💰</div>
                <div class="stat-card__valor">R$ {{ estatisticas().totalEconomizado.toFixed(2) }}</div>
                <div class="stat-card__label">Economizado</div>
              </div>

              @if (estatisticas().rotaMaisUsada) {
                <div class="stat-card stat-card--grande">
                  <div class="stat-card__titulo">🏆 Rota Mais Usada</div>
                  <div class="stat-card__nome">{{ estatisticas().rotaMaisUsada?.nome }}</div>
                  <div class="stat-card__info">
                    {{ estatisticas().rotaMaisUsada?.vezesUsada }} viagens
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

            <input
        #inputImportar
        type="file"
        accept=".json"
        style="display: none"
        (change)="processarImportacaoArquivo($event)">
    </div>
  `,
  styles: `
    .painel {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-width: 420px;
      max-height: 600px;
      display: flex;
      flex-direction: column;
    }

    .header {
      display: flex;
      border-bottom: 2px solid #f1f5f9;
    }

    .aba {
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
    }

    .aba:hover {
      background: #f8fafc;
      color: #1e293b;
    }

    .aba--ativa {
      color: #0e7490;
      border-bottom-color: #0e7490;
    }

    .conteudo {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .busca {
      margin-bottom: 12px;
    }

    .busca__input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .busca__input:focus {
      border-color: #0e7490;
    }

    .ordenacao {
      margin-bottom: 12px;
    }

    .ordenacao__select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
      background: white;
      cursor: pointer;
    }

    .vazio {
      text-align: center;
      padding: 48px 24px;
      color: #94a3b8;
    }

    .vazio__icone {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .vazio__titulo {
      font-size: 18px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 8px;
    }

    .vazio__texto {
      font-size: 14px;
      line-height: 1.5;
    }

    .lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item {
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .item:hover {
      border-color: #0e7490;
      box-shadow: 0 2px 8px rgba(14, 116, 144, 0.1);
    }

    .item__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .item__nome {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .item__remover {
      padding: 4px 8px;
      border: none;
      background: transparent;
      font-size: 16px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .item__remover:hover {
      opacity: 1;
    }

    .item__rota {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #64748b;
    }

    .item__local {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item__seta {
      color: #94a3b8;
    }

    .item__descricao {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 8px;
      font-style: italic;
    }

    .item__detalhes {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }

    .detalhe {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #475569;
    }

    .detalhe__icone {
      font-size: 14px;
    }

    .item__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .tag {
      padding: 3px 8px;
      background: #f1f5f9;
      border-radius: 12px;
      font-size: 11px;
      color: #475569;
    }

    .item__footer {
      display: flex;
      justify-content: flex-end;
    }

    .item__data {
      font-size: 11px;
      color: #94a3b8;
    }

    .acoes {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .botao {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .botao--secundario {
      background: white;
      color: #0e7490;
      border-color: #0e7490;
    }

    .botao--secundario:hover {
      background: #ecfeff;
    }

    .botao--perigo {
      background: white;
      color: #dc2626;
      border-color: #dc2626;
    }

    .botao--perigo:hover {
      background: #fef2f2;
    }

    .estatisticas {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-card {
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
    }

    .stat-card--destaque {
      background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
    }

    .stat-card--grande {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }

    .stat-card__icone {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .stat-card__valor {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .stat-card__label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-card__titulo {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }

    .stat-card__nome {
      font-size: 16px;
      font-weight: 600;
      color: #78350f;
      margin-bottom: 4px;
    }

    .stat-card__info {
      font-size: 13px;
      color: #92400e;
    }
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class PainelFavoritosComponent {
  private favoritosService = inject(FavoritosService);

  favoritos = signal<RotaFavorita[]>([]);
  estatisticas = signal<EstatisticasFavoritos>(this.estatisticasVazias());
  favoritosFiltrados = signal<RotaFavorita[]>([]);
  abaAtiva = signal<'favoritos' | 'estatisticas'>('favoritos');
  termoBusca = '';
  criterioOrdenacao: 'nome' | 'distancia' | 'uso' | 'recente' = 'recente';

  favoritoSelecionado = output<RotaFavorita>();

  constructor() {
    
    effect(() => {
      this.favoritosService.favoritos$.subscribe(favs => {
        this.favoritos.set(favs);
        this.favoritosFiltrados.set(favs);
        this.ordenar();
      });

      this.favoritosService.estatisticas$.subscribe(stats => {
        this.estatisticas.set(stats);
      });
    }, { allowSignalWrites: true });
  }

  buscar(): void {
    const resultados = this.favoritosService.buscar(this.termoBusca);
    this.favoritosFiltrados.set(resultados);
    this.ordenar();
  }

  ordenar(): void {
    const ordenados = this.favoritosService.ordenar(this.criterioOrdenacao);
    this.favoritosFiltrados.set(ordenados);
  }

  selecionar(favorito: RotaFavorita): void {
    this.favoritoSelecionado.emit(favorito);
    this.favoritosService.registrarUso(favorito.id);
  }

  removerFavorito(event: Event, id: string): void {
    event.stopPropagation();
    if (confirm('Deseja realmente remover este favorito?')) {
      this.favoritosService.remover(id);
    }
  }

  exportarFavoritos(): void {
    const json = this.favoritosService.exportar();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindway-favoritos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importarFavoritos(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => this.processarImportacaoArquivo(e);
    input.click();
  }

  processarImportacaoArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const resultado = this.favoritosService.importar(json);
      
      if (resultado.sucesso) {
        alert(`✅ Importados ${resultado.importados} favoritos com sucesso!`);
      } else {
        alert(`❌ Erro ao importar: ${resultado.erro}`);
      }
    };
    reader.readAsText(file);
  }

  limparTodos(): void {
    if (confirm('⚠️ Deseja realmente remover TODOS os favoritos? Esta ação não pode ser desfeita.')) {
      this.favoritosService.limparTodos();
    }
  }

  emojiTipoRota(tipo: string): string {
    const emojis = CONFIGURACOES_FAVORITOS.emojisTipoRota as any;
    return emojis[tipo] || '🚴';
  }

  formatarDistancia = formatarDistancia;
  formatarDuracao = formatarDuracao;
  formatarData = formatarData;

  private estatisticasVazias(): EstatisticasFavoritos {
    return {
      totalRotas: 0,
      totalKmPercorridos: 0,
      totalCO2Evitado: 0,
      totalEconomizado: 0,
      mediaDistancia: 0,
      totalViagens: 0,
    };
  }
}
