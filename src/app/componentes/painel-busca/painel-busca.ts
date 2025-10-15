import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeocodificacaoService } from '../../servicos/geocodificacao.service';
import { LocalMapa } from '../../modelos/local-mapa';
import { TipoRota, CONFIGURACOES_ROTAS } from '../../modelos/tipo-rota';

@Component({
  selector: 'app-painel-busca',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="painel">
      <header class="painel__cabecalho">
        <h1 class="painel__titulo">MindWay</h1>
        <p class="painel__subtitulo">Mobilidade inteligente com dados abertos</p>
      </header>

      <form class="painel__formulario" [formGroup]="formulario" (ngSubmit)="aoEnviarFormulario()">
        <fieldset class="campo">
          <label class="campo__rotulo" for="campo-origem">Origem</label>
          <div class="campo__controle">
            <input
              id="campo-origem"
              type="search"
              class="campo__entrada"
              formControlName="origem"
              placeholder="Digite um endereço ou ponto de interesse"
              autocomplete="off"
            />
            @if (carregandoOrigem()) {
              <span class="campo__indicador">Buscando...</span>
            }
          </div>
          @if (erroOrigem()) {
            <p class="campo__erro">{{ erroOrigem() }}</p>
          }
          @if (sugestoesOrigem().length > 0) {
            <ul class="sugestoes" role="listbox" aria-label="Sugestões de origem">
              @for (sugestao of sugestoesOrigem(); track sugestao.id) {
                <li class="sugestoes__item">
                  <button type="button" class="sugestoes__botao" (click)="selecionarOrigem(sugestao)">
                    <span class="sugestoes__principal">{{ sugestao.titulo }}</span>
                    @if (sugestao.descricao && sugestao.descricao !== sugestao.titulo) {
                      <span class="sugestoes__descricao">{{ sugestao.descricao }}</span>
                    }
                  </button>
                </li>
              }
            </ul>
          }
        </fieldset>

        <fieldset class="campo">
          <label class="campo__rotulo" for="campo-destino">Destino</label>
          <div class="campo__controle">
            <input
              id="campo-destino"
              type="search"
              class="campo__entrada"
              formControlName="destino"
              placeholder="Digite o destino desejado"
              autocomplete="off"
            />
            @if (carregandoDestino()) {
              <span class="campo__indicador">Buscando...</span>
            }
          </div>
          @if (erroDestino()) {
            <p class="campo__erro">{{ erroDestino() }}</p>
          }
          @if (sugestoesDestino().length > 0) {
            <ul class="sugestoes" role="listbox" aria-label="Sugestões de destino">
              @for (sugestao of sugestoesDestino(); track sugestao.id) {
                <li class="sugestoes__item">
                  <button type="button" class="sugestoes__botao" (click)="selecionarDestino(sugestao)">
                    <span class="sugestoes__principal">{{ sugestao.titulo }}</span>
                    @if (sugestao.descricao && sugestao.descricao !== sugestao.titulo) {
                      <span class="sugestoes__descricao">{{ sugestao.descricao }}</span>
                    }
                  </button>
                </li>
              }
            </ul>
          }
        </fieldset>

        <fieldset class="campo">
          <legend class="campo__rotulo">Tipo de Rota</legend>
          <div class="tipos-rota">
            @for (tipo of tiposRotaDisponiveis; track tipo) {
              <button
                type="button"
                class="tipo-rota"
                [class.tipo-rota--ativo]="tipoRotaSelecionado() === tipo"
                (click)="selecionarTipoRota(tipo)"
              >
                <span class="tipo-rota__icone">{{ configuracaoRota(tipo).icone }}</span>
                <span class="tipo-rota__titulo">{{ configuracaoRota(tipo).titulo }}</span>
                <span class="tipo-rota__descricao">{{ configuracaoRota(tipo).descricao }}</span>
              </button>
            }
          </div>
        </fieldset>

        <button type="submit" class="painel__botao" [disabled]="botaoDesabilitado()">
          @if (carregandoRota()) {
            Procurando melhor rota...
          } @else {
            Procurar rota
          }
        </button>

        @if (erroRota()) {
          <p class="painel__mensagem painel__mensagem--erro">{{ erroRota() }}</p>
        }
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'painel-container'
  }
})
export class PainelBuscaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly geocodificacao = inject(GeocodificacaoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly carregandoRota = input<boolean>(false);
  readonly erroRota = input<string | null>(null);

  readonly aoSelecionarOrigem = output<LocalMapa>();
  readonly aoSelecionarDestino = output<LocalMapa>();
  readonly aoProcurarRota = output<{ origem: LocalMapa | null; destino: LocalMapa | null; tipoRota: TipoRota }>();

  readonly formulario = this.fb.nonNullable.group({
    origem: '',
    destino: '',
  });

  private readonly controleOrigem = this.formulario.controls.origem as FormControl<string>;
  private readonly controleDestino = this.formulario.controls.destino as FormControl<string>;

  readonly sugestoesOrigem = signal<LocalMapa[]>([]);
  readonly sugestoesDestino = signal<LocalMapa[]>([]);

  readonly carregandoOrigem = signal(false);
  readonly carregandoDestino = signal(false);

  readonly erroOrigem = signal<string | null>(null);
  readonly erroDestino = signal<string | null>(null);

  private readonly origemSelecionada = signal<LocalMapa | null>(null);
  private readonly destinoSelecionada = signal<LocalMapa | null>(null);

  readonly tipoRotaSelecionado = signal<TipoRota>(TipoRota.RAPIDO);
  readonly tiposRotaDisponiveis = [TipoRota.RAPIDO, TipoRota.ECONOMICO, TipoRota.VERDE];

  readonly botaoDesabilitado = computed(() => !this.origemSelecionada() || !this.destinoSelecionada() || this.carregandoRota());

  constructor() {
    this.configurarAutoCompletar(
      this.controleOrigem,
      this.sugestoesOrigem,
      this.origemSelecionada,
      this.carregandoOrigem,
      this.erroOrigem
    );

    this.configurarAutoCompletar(
      this.controleDestino,
      this.sugestoesDestino,
      this.destinoSelecionada,
      this.carregandoDestino,
      this.erroDestino
    );
  }

  aoEnviarFormulario(): void {
    if (this.botaoDesabilitado()) {
      return;
    }

    const origem = this.origemSelecionada();
    const destino = this.destinoSelecionada();

    this.aoProcurarRota.emit({
      origem,
      destino,
      tipoRota: this.tipoRotaSelecionado(),
    });
  }

  selecionarOrigem(local: LocalMapa): void {
    this.preencherCampo(this.controleOrigem, this.sugestoesOrigem, this.origemSelecionada, local);
    this.aoSelecionarOrigem.emit(local);
  }

  selecionarDestino(local: LocalMapa): void {
    this.preencherCampo(this.controleDestino, this.sugestoesDestino, this.destinoSelecionada, local);
    this.aoSelecionarDestino.emit(local);
  }

  selecionarTipoRota(tipo: TipoRota): void {
    this.tipoRotaSelecionado.set(tipo);
  }

  configuracaoRota(tipo: TipoRota) {
    return CONFIGURACOES_ROTAS[tipo];
  }

  private configurarAutoCompletar(
    controle: FormControl<string>,
    listaSugestoes: WritableSignal<LocalMapa[]>,
    selecionado: WritableSignal<LocalMapa | null>,
    carregando: WritableSignal<boolean>,
    erro: WritableSignal<string | null>
  ): void {
    controle.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(valorAtual => {
          if (!valorAtual || valorAtual !== selecionado()?.titulo) {
            selecionado.set(null);
          }
        }),
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(valor => {
          const consulta = valor.trim();

          if (consulta.length < 3) {
            listaSugestoes.set([]);
            carregando.set(false);
            erro.set(null);
            return of<LocalMapa[]>([]);
          }

          carregando.set(true);
          erro.set(null);

          return this.geocodificacao.buscarSugestoes(consulta).pipe(
            catchError(() => {
              carregando.set(false);
              erro.set('Não foi possível carregar sugestões no momento.');
              return of<LocalMapa[]>([]);
            })
          );
        })
      )
      .subscribe(sugestoes => {
        carregando.set(false);
        listaSugestoes.set(sugestoes);
      });
  }

  private preencherCampo(
    controle: FormControl<string>,
    listaSugestoes: WritableSignal<LocalMapa[]>,
    selecionado: WritableSignal<LocalMapa | null>,
    local: LocalMapa
  ): void {
    selecionado.set(local);
    controle.setValue(local.titulo, { emitEvent: false });
    listaSugestoes.set([]);
  }
}
