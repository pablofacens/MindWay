import { Injectable, inject } from '@angular/core';
import { ServicoOnibus } from './servicoOnibus';
import { ServicoBicicletas } from './servicoBicicletas';

export interface Rota {
  id: number;
  tipo: 'Rápida' | 'Econômica' | 'Verde';
  duracao: string;
  custo: string;
  sustentabilidade: {
    pontuacao: number;
    descricao: string;
  };
  modais: {
    icone: string;
    nome: string;
  }[];
  classesCor: string;
  caminho: { lat: number, lng: number }[];
  corCaminho: string;
  detalhes: {
    distancia: string;
    passos: string[];
    linhasOnibus?: string[];
    custoTransporte?: string;
    distanciaCaminhada?: string;
    tempoTotal: number; 
    emissaoCO2?: string;
    calorias?: number;
  };
}

interface OpcoesRota {
  origem: { lat: number, lng: number, cidade?: string };
  destino: { lat: number, lng: number, cidade?: string };
}

@Injectable({
  providedIn: 'root'
})
export class ServicoRotas {

  private servicoOnibus = inject(ServicoOnibus);
  private servicoBicicletas = inject(ServicoBicicletas);

  private icones = {
    caminhada: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-700"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
    bicicleta: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-700"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8a8 8 0 11-16 0 8 8 0 0116 0zM3.5 19.5l17-17" /></svg>`,
    onibus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-yellow-700"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 012.25 12v-1.5a3.375 3.375 0 003.375-3.375H18a3.375 3.375 0 013.375 3.375v1.5c0 .621-.504 1.125-1.125 1.125h-1.5a3.375 3.375 0 00-3.375 3.375v1.875" /></svg>`,
    metro: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-700"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m-15 0v-3.75a3.375 3.375 0 013.375-3.375h3a3.375 3.375 0 013.375 3.375v3.75m-18.75 0V14.25m18.75 0v3.75a1.125 1.125 0 01-1.125 1.125H3.375A1.125 1.125 0 012.25 18V14.25m18.75 0v-7.5A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v7.5" /></svg>`
  };

  constructor() { }

  async obterRotas(opcoes: OpcoesRota): Promise<Rota[]> {
    const distancia = this.calcularDistancia(opcoes.origem, opcoes.destino);
    const cidadeOrigem = opcoes.origem.cidade || this.detectarCidade(opcoes.origem);
    const cidadeDestino = opcoes.destino.cidade || this.detectarCidade(opcoes.destino);
    
    
    const latMedio = (opcoes.origem.lat + opcoes.destino.lat) / 2;
    const lngMedio = (opcoes.origem.lng + opcoes.destino.lng) / 2;

    const intermediarioEconomico = { lat: latMedio + 0.005, lng: lngMedio - 0.005 };
    const intermediarioVerde = { lat: latMedio - 0.005, lng: lngMedio + 0.005 };

    const rotas: Rota[] = [];

    
    const rotaRapida = await this.criarRotaRapida(distancia, opcoes, cidadeOrigem, cidadeDestino);
    if (rotaRapida) rotas.push(rotaRapida);

    
    const rotaEconomica = await this.criarRotaEconomica(
      distancia, opcoes, cidadeOrigem, cidadeDestino, intermediarioEconomico
    );
    if (rotaEconomica) rotas.push(rotaEconomica);

    
    const rotaVerde = await this.criarRotaVerde(
      distancia, opcoes, cidadeOrigem, cidadeDestino, intermediarioVerde
    );
    if (rotaVerde) rotas.push(rotaVerde);

    return rotas;
  }

  private async criarRotaRapida(
    distancia: number, 
    opcoes: OpcoesRota, 
    cidadeOrigem: string, 
    cidadeDestino: string
  ): Promise<Rota | null> {
    
    const tarifaOnibus = this.servicoOnibus.calcularTarifaViagem(cidadeOrigem, cidadeDestino);
    const tarifaMetro = cidadeOrigem === 'São Paulo' ? 5.00 : 0; 
    const custoTotal = tarifaOnibus.tarifa + tarifaMetro;
    
    const tempoBase = Math.max(20, distancia * 4 + 12);
    const modais = tarifaMetro > 0 
      ? [{ nome: 'Metrô', icone: this.icones.metro }, { nome: 'Ônibus', icone: this.icones.onibus }]
      : [{ nome: 'Ônibus Expresso', icone: this.icones.onibus }];

    const passos = tarifaMetro > 0 
      ? [
          'Caminhada até estação de metrô (5 min)',
          'Viagem de metrô (12 min)',
          'Transferência para ônibus (3 min)',
          `Ônibus ${tarifaOnibus.linhasSugeridas[0]?.numero || 'municipal'} (${Math.round(tempoBase * 0.6)} min)`,
          'Caminhada final (3 min)'
        ]
      : [
          'Caminhada até ponto de ônibus (4 min)',
          `Ônibus ${tarifaOnibus.linhasSugeridas[0]?.numero || 'expresso'} (${Math.round(tempoBase * 0.8)} min)`,
          'Caminhada final (3 min)'
        ];

    return {
      id: 1,
      tipo: 'Rápida',
      duracao: this.formatarDuracao(tempoBase),
      custo: `R$ ${custoTotal.toFixed(2)}`,
      sustentabilidade: { pontuacao: 6, descricao: 'Médio Impacto' },
      modais: modais,
      classesCor: 'border-blue-300 ring-blue-400',
      corCaminho: '#3b82f6',
      caminho: [opcoes.origem, opcoes.destino],
      detalhes: {
        distancia: `${distancia.toFixed(1)} km`,
        passos: passos,
        linhasOnibus: tarifaOnibus.linhasSugeridas.map(l => l.numero),
        custoTransporte: `${tarifaOnibus.tipo}: R$ ${custoTotal.toFixed(2)}`,
        distanciaCaminhada: '400m',
        tempoTotal: Math.round(tempoBase),
        emissaoCO2: `${(distancia * 0.12).toFixed(2)} kg`,
        calorias: 45
      }
    };
  }

  private async criarRotaEconomica(
    distancia: number, 
    opcoes: OpcoesRota, 
    cidadeOrigem: string, 
    cidadeDestino: string,
    intermediario: { lat: number, lng: number }
  ): Promise<Rota | null> {
    
    const tarifaInfo = this.servicoOnibus.calcularTarifaViagem(cidadeOrigem, cidadeDestino);
    const tempoBase = Math.max(35, distancia * 7 + 20);
    
    const passos = [
      'Caminhada até ponto de ônibus (6 min)',
      `Ônibus ${tarifaInfo.linhasSugeridas[0]?.numero || 'municipal'} (${Math.round(tempoBase * 0.6)} min)`,
    ];

    
    if (tarifaInfo.linhasSugeridas.length > 1) {
      passos.push(`Transferência - ${tarifaInfo.linhasSugeridas[1].numero} (${Math.round(tempoBase * 0.25)} min)`);
    }
    
    passos.push('Caminhada final (8 min)');

    return {
      id: 2,
      tipo: 'Econômica',
      duracao: this.formatarDuracao(tempoBase),
      custo: `R$ ${tarifaInfo.tarifa.toFixed(2)}`,
      sustentabilidade: { pontuacao: 8, descricao: 'Baixo Impacto' },
      modais: [{ nome: 'Ônibus', icone: this.icones.onibus }],
      classesCor: 'border-yellow-300 ring-yellow-400',
      corCaminho: '#f59e0b',
      caminho: [opcoes.origem, intermediario, opcoes.destino],
      detalhes: {
        distancia: `${(distancia * 1.15).toFixed(1)} km`,
        passos: passos,
        linhasOnibus: tarifaInfo.linhasSugeridas.map(l => l.numero),
        custoTransporte: `${tarifaInfo.tipo}: R$ ${tarifaInfo.tarifa.toFixed(2)}`,
        distanciaCaminhada: '750m',
        tempoTotal: Math.round(tempoBase),
        emissaoCO2: `${(distancia * 0.08).toFixed(2)} kg`,
        calorias: 85
      }
    };
  }

  private async criarRotaVerde(
    distancia: number, 
    opcoes: OpcoesRota, 
    cidadeOrigem: string, 
    cidadeDestino: string,
    intermediario: { lat: number, lng: number }
  ): Promise<Rota | null> {
    
    const tarifasBike = this.servicoBicicletas.obterTarifasBicicleta(cidadeOrigem);
    const tempoViagem = Math.max(45, distancia * 10 + 25);
    const tempoBase = Math.round(tempoViagem);
    
    
    let custoBike = 0;
    let descricaoCusto = 'Gratuito';
    
    if (tarifasBike.length > 0) {
      const sistemaPreferido = tarifasBike[0];
      const custocalc = this.servicoBicicletas.calcularCustoBicicleta(
        sistemaPreferido.sistema, 
        tempoBase
      );
      custoBike = custocalc.custo;
      descricaoCusto = custocalc.gratuito ? 'Gratuito' : `R$ ${custoBike.toFixed(2)}`;
    }

    const estacaoProxima = this.servicoBicicletas.obterEstacaoMaisProxima(
      opcoes.origem.lat, 
      opcoes.origem.lng, 
      cidadeOrigem
    );

    const passos = [
      `Caminhada até estação ${estacaoProxima?.nome || 'de bikes'} (4 min)`,
      `Bicicleta pela ciclovia (${Math.round(tempoBase * 0.75)} min)`,
      'Devolução da bicicleta (2 min)',
      'Caminhada final (12 min)'
    ];

    return {
      id: 3,
      tipo: 'Verde',
      duracao: this.formatarDuracao(tempoBase),
      custo: descricaoCusto,
      sustentabilidade: { pontuacao: 10, descricao: 'Zero Emissão' },
      modais: [
        { nome: 'Bicicleta', icone: this.icones.bicicleta }, 
        { nome: 'Caminhada', icone: this.icones.caminhada }
      ],
      classesCor: 'border-green-300 ring-green-400',
      corCaminho: '#22c55e',
      caminho: [opcoes.origem, intermediario, opcoes.destino],
      detalhes: {
        distancia: `${(distancia * 1.08).toFixed(1)} km`,
        passos: passos,
        custoTransporte: `Sistema: ${tarifasBike[0]?.sistema || 'Municipal'}`,
        distanciaCaminhada: '850m',
        tempoTotal: tempoBase,
        emissaoCO2: '0.00 kg',
        calorias: Math.round(distancia * 45 + 120) 
      }
    };
  }

  private calcularDistancia(origem: { lat: number, lng: number }, destino: { lat: number, lng: number }): number {
    const R = 6371; 
    const dLat = this.deg2rad(destino.lat - origem.lat);
    const dLng = this.deg2rad(destino.lng - origem.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(origem.lat)) * Math.cos(this.deg2rad(destino.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private formatarDuracao(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    
    if (horas > 0) {
      return `${horas}h ${mins}min`;
    }
    return `${mins} min`;
  }

  private detectarCidade(coords: { lat: number, lng: number }): string {
    
    
    
    if (coords.lat >= -23.7 && coords.lat <= -23.4 && 
        coords.lng >= -46.8 && coords.lng <= -46.4) {
      return 'São Paulo';
    }
    
    
    if (coords.lat >= -23.6 && coords.lat <= -23.4 && 
        coords.lng >= -47.6 && coords.lng <= -47.3) {
      return 'Sorocaba';
    }
    
    
    if (coords.lat >= -23.4 && coords.lat <= -23.1 && 
        coords.lng >= -47.4 && coords.lng <= -47.1) {
      return 'Itu';
    }
    
    
    if (coords.lat >= -22.95 && coords.lat <= -22.8 && 
        coords.lng >= -47.2 && coords.lng <= -46.9) {
      return 'Campinas';
    }
    
    
    return 'São Paulo';
  }

  
  obterInformacoesCidade(cidade: string): {
    transporte: string[];
    bicicletas: boolean;
    tarifasDisponiveis: string[];
  } {
    const linhasOnibus = this.servicoOnibus.obterLinhasPorCidade(cidade);
    const sistemasBike = this.servicoBicicletas.obterSistemasPorCidade(cidade);
    const tarifasOnibus = this.servicoOnibus.obterTarifasPorCidade(cidade);
    
    return {
      transporte: linhasOnibus.map(l => l.numero),
      bicicletas: sistemasBike.length > 0,
      tarifasDisponiveis: tarifasOnibus.map(t => t.tipo)
    };
  }

  obterEstatisticasRota(rota: Rota): {
    eficiencia: string;
    sustentabilidade: string;
    economia: string;
  } {
    const tempoHoras = rota.detalhes.tempoTotal / 60;
    const custoPorKm = parseFloat(rota.custo.replace('R$ ', '').replace(',', '.')) / parseFloat(rota.detalhes.distancia);
    
    return {
      eficiencia: `${(parseFloat(rota.detalhes.distancia) / tempoHoras).toFixed(1)} km/h média`,
      sustentabilidade: `${rota.detalhes.emissaoCO2 || '0'} CO₂ • ${rota.detalhes.calorias || 0} cal`,
      economia: isNaN(custoPorKm) ? 'Gratuito' : `R$ ${custoPorKm.toFixed(2)}/km`
    };
  }
}