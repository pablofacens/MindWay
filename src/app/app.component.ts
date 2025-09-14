import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { ServicoGeolocalizacao } from './servicos/servicoGeolocalizacao';
import { ServicoClima } from './servicos/servicoClima';
import { ServicoRotas, Rota } from './servicos/servicoRotas';
import { ServicoMapa } from './servicos/servicoMapa';
import { ServicoBicicletas } from './servicos/servicoBicicletas';
import { ServicoOnibus } from './servicos/servicoOnibus';


import { FormularioBuscaComponent } from './componentes/formularioBusca';
import { CartaoRotaComponent } from './componentes/cartaoRota';
import { AlternadorCamadasComponent } from './componentes/alternadorCamadas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormularioBuscaComponent, CartaoRotaComponent, AlternadorCamadasComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  
  private servicoGeolocalizacao = inject(ServicoGeolocalizacao);
  private servicoClima = inject(ServicoClima);
  private servicoRotas = inject(ServicoRotas);
  public servicoMapa = inject(ServicoMapa); 
  private servicoBicicletas = inject(ServicoBicicletas);
  private servicoOnibus = inject(ServicoOnibus);

  
  estaCarregando = signal<boolean>(false);
  rotas = signal<Rota[]>([]);
  rotaSelecionada = signal<Rota | null>(null);
  erroBusca = signal<string | null>(null);
  clima = signal<any | null>(null);
  qualidadeAr = signal<any | null>(null);

  
  mostrarEstacoesBicicleta = signal<boolean>(false);
  private estacoesBicicleta = signal<any[]>([]);
  mostrarTransito = signal<boolean>(false);
  mostrarOnibus = signal<boolean>(false);
  mostrarPontosInteresse = signal<boolean>(false);

  
  contadorBikes = signal<number>(0);
  contadorOnibus = signal<number>(0);

  
  private coordenadasOrigem: { lat: number, lng: number, cidade: string } | null = null;
  private coordenadasDestino: { lat: number, lng: number, cidade: string } | null = null;

  constructor() {
    this.servicoMapa.mapaInicializado$.subscribe(inicializado => {
      if (inicializado) {
        console.log('Mapa inicializado com sucesso');
      }
    });
  }

  ngAfterViewInit(): void {
    this.servicoMapa.inicializarMapa('map');
  }

  ngOnDestroy(): void {
    this.servicoMapa.removerMapa();
  }

  
  async aoBuscarRotas(evento: { 
    origem: { lat: number, lng: number, cidade: string }, 
    destino: { lat: number, lng: number, cidade: string } 
  }): Promise<void> {
    
    this.coordenadasOrigem = evento.origem;
    this.coordenadasDestino = evento.destino;

    this.estaCarregando.set(true);
    this.erroBusca.set(null);
    this.rotas.set([]);
    this.servicoMapa.limparRota();
    this.servicoMapa.limparMarcadores();

    try {
      
      const [rotas, clima, qualidadeAr] = await Promise.all([
        this.servicoRotas.obterRotas({
          origem: this.coordenadasOrigem,
          destino: this.coordenadasDestino
        }),
        this.servicoClima.buscarClima(this.coordenadasDestino),
        this.servicoClima.buscarQualidadeAr(this.coordenadasDestino)
      ]);

      this.rotas.set(rotas);
      this.clima.set(clima);
      this.qualidadeAr.set(qualidadeAr);

      
      this.servicoMapa.adicionarMarcador('marcador-origem', this.coordenadasOrigem);
      this.servicoMapa.adicionarMarcador('marcador-destino', this.coordenadasDestino);
      this.servicoMapa.ajustarVisao(this.coordenadasOrigem, this.coordenadasDestino);

      
      if (rotas.length > 0) {
        this.selecionarRota(rotas[0]);
      }

      
      console.log(`Encontradas ${rotas.length} rotas de ${evento.origem.cidade} para ${evento.destino.cidade}`);

    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      this.erroBusca.set('Ocorreu um erro ao buscar as rotas. Verifique os endereços e tente novamente.');
    } finally {
      this.estaCarregando.set(false);
    }
  }

  selecionarRota(rota: Rota): void {
    this.rotaSelecionada.set(rota);
    this.servicoMapa.desenharRota(rota.caminho, rota.corCaminho);
    
    console.log(`Rota selecionada: ${rota.tipo} - ${rota.custo} - ${rota.duracao}`);
  }

  
  async alternarEstacoesBicicleta(): Promise<void> {
    this.mostrarEstacoesBicicleta.update(atual => !atual);
    
    if (this.mostrarEstacoesBicicleta()) {
      if (this.estacoesBicicleta().length === 0) {
        try {
          const estacoes = await this.servicoBicicletas.buscarEstacoesBicicleta();
          this.estacoesBicicleta.set(estacoes);
        } catch (error) {
          console.warn('Erro ao carregar estações de bicicleta:', error);
          const estacoesMock = this.servicoBicicletas.obterEstacoesMock();
          this.estacoesBicicleta.set(estacoesMock);
        }
      }
      
      this.servicoMapa.alternarCamadaEstacoesBicicleta(true, this.estacoesBicicleta());
      this.contadorBikes.set(this.estacoesBicicleta().length);
    } else {
      this.servicoMapa.alternarCamadaEstacoesBicicleta(false);
      this.contadorBikes.set(0);
    }
  }

  alternarTransito(): void {
    this.mostrarTransito.update(atual => !atual);
    this.servicoMapa.alternarCamadaTransito(this.mostrarTransito());
    
    if (this.mostrarTransito()) {
      console.log('Camada de trânsito ativada');
    }
  }

  alternarOnibus(): void {
    this.mostrarOnibus.update(atual => !atual);
    
    if (this.mostrarOnibus()) {
      
      const cidade = this.coordenadasOrigem?.cidade || 'São Paulo';
      const onibusProximos = this.servicoOnibus.obterOnibusProximosMock(cidade);
      
      this.servicoMapa.alternarCamadaOnibus(true, onibusProximos);
      this.contadorOnibus.set(onibusProximos.length);
      
      
      if (!this.erroBusca()) {
        this.erroBusca.set(`Mostrando ${onibusProximos.length} linhas de ônibus em ${cidade} (simulação)`);
        
        
        setTimeout(() => {
          if (this.erroBusca()?.includes('simulação')) {
            this.erroBusca.set(null);
          }
        }, 5000);
      }
    } else {
      this.servicoMapa.alternarCamadaOnibus(false, []);
      this.contadorOnibus.set(0);
      
      
      if (this.erroBusca()?.includes('simulação')) {
        this.erroBusca.set(null);
      }
    }
  }

  alternarPontosInteresse(): void {
    this.mostrarPontosInteresse.update(atual => !atual);
    
    if (this.mostrarPontosInteresse()) {
      
      
      console.log('Camada de pontos de interesse ativada');
    }
  }

  
  obterInformacoesCidadeAtual(): string {
    if (!this.coordenadasOrigem) return '';
    
    const info = this.servicoRotas.obterInformacoesCidade(this.coordenadasOrigem.cidade);
    return `${this.coordenadasOrigem.cidade}: ${info.transporte.length} linhas • ${info.bicicletas ? 'Bikes disponíveis' : 'Sem bikes'} • ${info.tarifasDisponiveis.length} tarifas`;
  }

  obterEstatisticasGerais(): {
    totalRotas: number;
    rotaMaisRapida?: string;
    rotaMaisEconomica?: string;
    rotaMaisSustentavel?: string;
  } {
    const rotas = this.rotas();
    
    if (rotas.length === 0) {
      return { totalRotas: 0 };
    }

    const rotaRapida = rotas.reduce((prev, current) => 
      prev.detalhes.tempoTotal < current.detalhes.tempoTotal ? prev : current
    );

    const rotaEconomica = rotas.reduce((prev, current) => {
      const custoPrev = parseFloat(prev.custo.replace('R$ ', '').replace(',', '.')) || 0;
      const custoCurrent = parseFloat(current.custo.replace('R$ ', '').replace(',', '.')) || 0;
      return custoPrev < custoCurrent ? prev : current;
    });

    const rotaSustentavel = rotas.reduce((prev, current) => 
      prev.sustentabilidade.pontuacao > current.sustentabilidade.pontuacao ? prev : current
    );

    return {
      totalRotas: rotas.length,
      rotaMaisRapida: `${rotaRapida.tipo} (${rotaRapida.duracao})`,
      rotaMaisEconomica: `${rotaEconomica.tipo} (${rotaEconomica.custo})`,
      rotaMaisSustentavel: `${rotaSustentavel.tipo} (${rotaSustentavel.sustentabilidade.pontuacao}/10)`
    };
  }
}