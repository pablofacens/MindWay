import { ChangeDetectionStrategy, Component, computed, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PontoInteresse, CategoriaPOI, CONFIGURACOES_POIS } from '../../modelos/ponto-interesse';
import { WikipediaService } from '../../servicos/wikipedia.service';
import { ImagemWikipedia } from '../../modelos/wikipedia';

const CHAVE_STORAGE = 'mindway-filtros-pois';

@Component({
  selector: 'app-painel-pois',
  template: `
        <section class="painel-pois">
      <div class="painel-pois__cabecalho">
        <h3 class="painel-pois__titulo">📍 Pontos de Apoio ({{ pois().length }})</h3>
        <div class="painel-pois__acoes">
          <button 
            type="button"
            class="painel-pois__toggle"
            (click)="toggleFiltros()"
            [attr.aria-expanded]="mostrarFiltros()">
            {{ mostrarFiltros() ? '▼' : '▶' }} Filtros
          </button>
          <button 
            type="button"
            class="painel-pois__toggle"
            (click)="toggleDetalhes()"
            [attr.aria-expanded]="mostrarDetalhes()">
            {{ mostrarDetalhes() ? '▼' : '▶' }} Detalhes
          </button>
        </div>
      </div>
        
        @if (mostrarFiltros()) {
          <div class="filtros">
            @for (categoria of categorias(); track categoria.tipo) {
              <label class="filtro-item">
                <input 
                  type="checkbox"
                  class="filtro-item__checkbox"
                  [checked]="filtrosAtivos()[categoria.tipo]"
                  (change)="toggleFiltro(categoria.tipo)"
                  [disabled]="categoria.quantidade === 0">
                <span class="filtro-item__icone" [style.color]="categoria.cor">
                  {{ categoria.emoji }}
                </span>
                <span class="filtro-item__label">{{ categoria.label }}</span>
                <span class="filtro-item__contador" 
                      [class.filtro-item__contador--zero]="categoria.quantidade === 0">
                  {{ categoria.quantidade }}
                </span>
              </label>
            }
          </div>
        }

        @if (!mostrarDetalhes()) {
          @if (pois().length === 0) {
            <div class="vazio-mensagem">
              <span class="vazio-icone">🔍</span>
              <p class="vazio-texto">Calcule uma rota para ver pontos de apoio próximos</p>
            </div>
          } @else {
            <div class="categorias-grid">
              @for (categoria of categorias(); track categoria.tipo) {
                @if (categoria.quantidade > 0 && filtrosAtivos()[categoria.tipo]) {
                  <div class="categoria-item">
                    <span class="categoria-item__icone" [style.color]="categoria.cor">
                      {{ categoria.emoji }}
                    </span>
                    <div class="categoria-item__info">
                      <span class="categoria-item__nome">{{ categoria.label }}</span>
                      <span class="categoria-item__badge">{{ categoria.quantidade }}</span>
                    </div>
                  </div>
                }
              }
            </div>
          }
        }

        @if (mostrarDetalhes()) {
          <div class="pois-lista">
            @for (poi of poisFiltrados(); track poi.id) {
              <article class="poi-card">
                                @if (imagens()[poi.id]) {
                  <div class="poi-card__imagem-container">
                    <img 
                      [src]="imagens()[poi.id]!.url" 
                      [alt]="poi.nome"
                      class="poi-card__imagem"
                      loading="lazy">
                    <a 
                      [href]="linkWikipedia(imagens()[poi.id]!.pageTitle!)"
                      target="_blank"
                      rel="noopener"
                      class="poi-card__link-wiki"
                      title="Ver no Wikipedia">
                      📖
                    </a>
                  </div>
                } @else if (carregandoImagens()[poi.id]) {
                  <div class="poi-card__loading">
                    <div class="spinner"></div>
                  </div>
                } @else {
                  <div class="poi-card__sem-imagem">
                    <span class="poi-card__icone-grande">{{ CONFIGURACOES_POIS[poi.categoria].emoji }}</span>
                  </div>
                }

                                <div class="poi-card__corpo">
                  <div class="poi-card__cabecalho">
                    <span class="poi-card__categoria" [style.background-color]="CONFIGURACOES_POIS[poi.categoria].cor">
                      {{ CONFIGURACOES_POIS[poi.categoria].emoji }} {{ CONFIGURACOES_POIS[poi.categoria].label }}
                    </span>
                  </div>
                  
                  <h4 class="poi-card__nome">{{ poi.nome }}</h4>
                  
                  @if (poi.descricao) {
                    <p class="poi-card__descricao-poi">{{ poi.descricao }}</p>
                  }
                  
                  @if (imagens()[poi.id]?.descricao) {
                    <p class="poi-card__descricao">{{ imagens()[poi.id]!.descricao }}</p>
                  }
                  
                  @if (poi.distanciaMetros) {
                    <div class="poi-card__meta">
                      <span class="poi-card__distancia">📏 {{ poi.distanciaMetros.toFixed(0) }}m</span>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
  `,
  styles: `
    .painel-pois {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-top: 12px;
    }

    .painel-pois__titulo {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .categorias-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .categoria-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .categoria-item__icone {
      font-size: 18px;
      line-height: 1;
    }

    .categoria-item__info {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .categoria-item__nome {
      font-size: 12px;
      color: #475569;
      font-weight: 500;
      white-space: nowrap;
    }

    .categoria-item__badge {
      background: #e2e8f0;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: auto;
    }

    .vazio-mensagem {
      padding: 24px 12px;
      text-align: center;
      color: #64748b;
    }

    .vazio-icone {
      font-size: 32px;
      display: block;
      margin-bottom: 8px;
    }

    .vazio-texto {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
    }

    .painel-pois__cabecalho {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .painel-pois__toggle {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      color: #0e7490;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .painel-pois__toggle:hover {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
    }

    .filtros {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      padding: 10px;
      background: rgba(240, 253, 250, 0.5);
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.15);
    }

    .filtro-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .filtro-item:hover {
      background: rgba(16, 185, 129, 0.05);
    }

    .filtro-item__checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #10b981;
    }

    .filtro-item__checkbox:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .filtro-item:has(.filtro-item__checkbox:disabled) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .filtro-item__icone {
      font-size: 16px;
      line-height: 1;
    }

    .filtro-item__label {
      flex: 1;
      font-size: 12px;
      font-weight: 500;
      color: #475569;
    }

    .filtro-item__contador {
      background: #10b981;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 8px;
      min-width: 20px;
      text-align: center;
    }

    .filtro-item__contador--zero {
      background: #cbd5e1;
      color: #64748b;
    }

    
    .painel-pois__acoes {
      display: flex;
      gap: 6px;
    }

    
    .pois-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }

    
    .poi-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .poi-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    
    .poi-card__imagem-container {
      position: relative;
      width: 100%;
      height: 150px;
      overflow: hidden;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .poi-card__imagem {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .poi-card:hover .poi-card__imagem {
      transform: scale(1.05);
    }

    .poi-card__link-wiki {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .poi-card__link-wiki:hover {
      transform: scale(1.1);
      background: white;
    }

    
    .poi-card__loading {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #e2e8f0;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    
    .poi-card__sem-imagem {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    }

    .poi-card__icone-grande {
      font-size: 48px;
      opacity: 0.6;
    }

    
    .poi-card__corpo {
      padding: 12px;
    }

    .poi-card__cabecalho {
      margin-bottom: 8px;
    }

    .poi-card__categoria {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      opacity: 0.9;
    }

    .poi-card__nome {
      margin: 8px 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.3;
    }

    .poi-card__descricao-poi {
      font-size: 12px;
      color: #64748b;
      margin: 6px 0;
      line-height: 1.4;
    }

    .poi-card__descricao {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
      margin: 8px 0;
      padding: 8px;
      background: rgba(16, 185, 129, 0.05);
      border-left: 3px solid #10b981;
      border-radius: 4px;
    }

    .poi-card__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }

    .poi-card__distancia {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .categorias-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class PainelPOIsComponent {
  pois = input.required<PontoInteresse[]>();
  
  
  filtrosAlterados = output<Record<CategoriaPOI, boolean>>();

  
  filtrosAtivos = signal<Record<CategoriaPOI, boolean>>({
    [CategoriaPOI.AGUA]: true,
    [CategoriaPOI.DESCANSO]: true,
    [CategoriaPOI.SAUDE]: true,
    [CategoriaPOI.BANHEIRO]: true,
    [CategoriaPOI.REFERENCIA]: true,
  });

  
  mostrarFiltros = signal(false);
  
  
  mostrarDetalhes = signal(false);
  
  
  private readonly wikipediaService = inject(WikipediaService);
  
  
  imagens = signal<Record<string, ImagemWikipedia>>({});
  
  
  carregandoImagens = signal<Record<string, boolean>>({});
  
  
  readonly CONFIGURACOES_POIS = CONFIGURACOES_POIS;

  constructor() {
    
    this.filtrosAtivos.set(this.carregarFiltros());

    
    effect(() => {
      const filtros = this.filtrosAtivos();
      this.salvarFiltros(filtros);
      this.filtrosAlterados.emit(filtros);
    });
  }

  
  poisPorCategoria = computed(() => {
    const grupos: Record<CategoriaPOI, PontoInteresse[]> = {
      [CategoriaPOI.AGUA]: [],
      [CategoriaPOI.DESCANSO]: [],
      [CategoriaPOI.SAUDE]: [],
      [CategoriaPOI.BANHEIRO]: [],
      [CategoriaPOI.REFERENCIA]: [],
    };

    this.pois().forEach(poi => {
      grupos[poi.categoria].push(poi);
    });

    return grupos;
  });

  
  categorias = computed(() => {
    const grupos = this.poisPorCategoria();
    
    return Object.values(CategoriaPOI).map(tipo => ({
      tipo,
      ...CONFIGURACOES_POIS[tipo],
      quantidade: grupos[tipo].length,
    }));
  });

  
  poisFiltrados = computed(() => {
    const filtros = this.filtrosAtivos();
    return this.pois().filter(poi => filtros[poi.categoria]);
  });

  toggleFiltros(): void {
    this.mostrarFiltros.update(mostrar => !mostrar);
  }
  
  toggleDetalhes(): void {
    const abrindo = !this.mostrarDetalhes();
    this.mostrarDetalhes.set(abrindo);
    
    
    if (abrindo && Object.keys(this.imagens()).length === 0) {
      console.log('🎬 [POIs] Primeira abertura - carregando imagens...');
      this.carregarImagensPOIs();
    }
  }

  toggleFiltro(categoria: CategoriaPOI): void {
    this.filtrosAtivos.update(filtros => ({
      ...filtros,
      [categoria]: !filtros[categoria],
    }));
  }
  
  
  private carregarImagensPOIs(): void {
    const pois = this.poisFiltrados().slice(0, 15); 
    
    console.log(`📚 [POIs] Carregando imagens para ${pois.length} POIs...`);
    
    
    const poisParaBuscar = pois.filter(poi => 
      !this.imagens()[poi.id] && !this.carregandoImagens()[poi.id]
    );
    
    if (poisParaBuscar.length === 0) {
      console.log('✅ [POIs] Todas as imagens já foram carregadas');
      return;
    }
    
    console.log(`🔍 [POIs] Buscando ${poisParaBuscar.length} novas imagens...`);
    
    
    const carregando: Record<string, boolean> = {};
    poisParaBuscar.forEach(poi => {
      carregando[poi.id] = true;
    });
    this.carregandoImagens.update(atual => ({ ...atual, ...carregando }));
    
    
    poisParaBuscar.forEach((poi, index) => {
      setTimeout(() => {
        const tipoBusca = this.extrairTipoPOI(poi);
        
        this.wikipediaService.buscarImagemPOI(poi.nome, tipoBusca).subscribe({
          next: imagem => {
            if (imagem) {
              console.log(`✅ [POI] Imagem carregada: ${poi.nome}`);
              this.imagens.update(atual => ({ ...atual, [poi.id]: imagem }));
            } else {
              console.log(`ℹ️ [POI] Sem imagem: ${poi.nome}`);
            }
            
            
            this.carregandoImagens.update(atual => {
              const novo = { ...atual };
              delete novo[poi.id];
              return novo;
            });
          },
          error: erro => {
            console.error(`❌ [POI] Erro ao carregar ${poi.nome}:`, erro);
            this.carregandoImagens.update(atual => {
              const novo = { ...atual };
              delete novo[poi.id];
              return novo;
            });
          }
        });
      }, index * 300); 
    });
  }
  
  
  private extrairTipoPOI(poi: PontoInteresse): string | undefined {
    
    const mapa: Record<CategoriaPOI, string> = {
      [CategoriaPOI.AGUA]: 'tourism',
      [CategoriaPOI.DESCANSO]: 'park',
      [CategoriaPOI.SAUDE]: 'healthcare',
      [CategoriaPOI.BANHEIRO]: 'amenity',
      [CategoriaPOI.REFERENCIA]: 'tourism', 
    };
    
    return mapa[poi.categoria];
  }
  
  
  linkWikipedia(titulo: string): string {
    return this.wikipediaService.obterLinkArtigo(titulo);
  }

  private carregarFiltros(): Record<CategoriaPOI, boolean> {
    try {
      const salvos = localStorage.getItem(CHAVE_STORAGE);
      if (salvos) {
        return JSON.parse(salvos);
      }
    } catch (erro) {
      console.warn('⚠️ Erro ao carregar filtros POIs do localStorage:', erro);
    }

    
    return {
      [CategoriaPOI.AGUA]: true,
      [CategoriaPOI.DESCANSO]: true,
      [CategoriaPOI.SAUDE]: true,
      [CategoriaPOI.BANHEIRO]: true,
      [CategoriaPOI.REFERENCIA]: true,
    };
  }

  private salvarFiltros(filtros: Record<CategoriaPOI, boolean>): void {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(filtros));
    } catch (erro) {
      console.warn('⚠️ Erro ao salvar filtros POIs no localStorage:', erro);
    }
  }
}
