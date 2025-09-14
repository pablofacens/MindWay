import { Injectable, inject } from '@angular/core';
import { ServicoOnibus } from './servicoOnibus';
import { ServicoBicicletas } from './servicoBicicletas';
import { ServicoChavesApi } from './servicoChavesApi';

type Coordenada = { lat: number, lng: number };


interface OpenRouteServiceResponse {
  routes: OpenRouteServiceRoute[];
}

interface OpenRouteServiceRoute {
  summary: { distance: number; duration: number; };
  segments: OpenRouteServiceSegment[];
  geometry: string;
  instructions: OpenRouteServiceInstruction[];
}

interface OpenRouteServiceSegment {
  distance: number;
  duration: number;
  steps: OpenRouteServiceStep[];
}

interface OpenRouteServiceStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  type: number;
  way_points: number[];
}

interface OpenRouteServiceInstruction {
  distance: number;
  duration: number;
  text: string;
  street_name: string;
  way_points: number[];
}

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
  caminho: Coordenada[];
  corCaminho: string;
  detalhes: {
    distancia: string;
    passos: string[];
    linhasOnibus?: string[];
    custoTransporte?: string;
    distanciaCaminhada?: string;
    tempoTotal: number;
  };
}

interface OpcoesRota {
  origem: Coordenada & { cidade?: string };
  destino: Coordenada & { cidade?: string };
}

@Injectable({
  providedIn: 'root'
})
export class ServicoRotas {
  private servicoOnibus = inject(ServicoOnibus);
  private servicoBicicletas = inject(ServicoBicicletas);
  private servicoChavesApi = inject(ServicoChavesApi);

  private icones = {
    caminhada: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-700"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
    bicicleta: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-700"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8a8 8 0 11-16 0 8 8 0 0116 0zM3.5 19.5l17-17" /></svg>`,
    onibus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-yellow-700"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 012.25 12v-1.5a3.375 3.375 0 003.375-3.375H18a3.375 3.375 0 013.375 3.375v1.5c0 .621-.504 1.125-1.125 1.125h-1.5a3.375 3.375 0 00-3.375 3.375v1.875" /></svg>`,
    metro: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-700"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m-15 0v-3.75a3.375 3.375 0 013.375-3.375h3a3.375 3.375 0 013.375 3.375v3.75m-18.75 0V14.25m18.75 0v3.75a1.125 1.125 0 01-1.125 1.125H3.375A1.125 1.125 0 012.25 18V14.25m18.75 0v-7.5A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v7.5" /></svg>`
  };

  constructor() { }

  async obterRotas(opcoes: OpcoesRota): Promise<Rota[]> {
    const cidadeOrigem = opcoes.origem.cidade || this.detectarCidade(opcoes.origem);
    const cidadeDestino = opcoes.destino.cidade || this.detectarCidade(opcoes.destino);

    const rotas: Rota[] = [];


    const rotaCarroORS = await this.obterCaminhoOpenRouteService(opcoes.origem, opcoes.destino, 'driving-car');
    const rotaCaminhadaORS = await this.obterCaminhoOpenRouteService(opcoes.origem, opcoes.destino, 'foot-walking');


    if (rotaCarroORS && rotaCarroORS.summary) {
      const rotaRapida = this.criarRotaRapida(
        rotaCarroORS.summary.distance / 1000,
        opcoes,
        cidadeOrigem,
        cidadeDestino,
        this.extrairGeometriaORS(rotaCarroORS),
        this.converterDuracaoSegundosParaMinutos(rotaCarroORS.summary.duration),
        this.extrairPassosORS(rotaCarroORS)
      );
      if (rotaRapida) rotas.push(rotaRapida);
    } else {
      console.warn('Rota de carro não pôde ser calculada');
    }


    const rotaTransportePublico = await this.criarRotaTransportePublico(opcoes, cidadeOrigem, cidadeDestino);
    if (rotaTransportePublico) rotas.push(rotaTransportePublico);


    const rotaBicicletaInteligente = await this.criarRotaBicicletaInteligente(opcoes, cidadeOrigem, cidadeDestino);
    if (rotaBicicletaInteligente) rotas.push(rotaBicicletaInteligente);

    return rotas;
  }

  private async obterCaminhoOpenRouteService(origem: Coordenada, destino: Coordenada, perfil: 'driving-car' | 'cycling-regular' | 'foot-walking'): Promise<OpenRouteServiceRoute | null> {
    const chaveApi = this.servicoChavesApi.obterChaveApi('openRouteService');
    if (!chaveApi || chaveApi.startsWith('SUA_CHAVE')) {
      console.warn("Chave da Openrouteservice API não configurada. Usando rota em linha reta.");
      return null;
    }

    const url = `https://api.openrouteservice.org/v2/directions/${perfil}`;
    const cabecalhos = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': chaveApi
    };

    const corpo = {
      coordinates: [
        [origem.lng, origem.lat],
        [destino.lng, destino.lat]
      ],
      instructions: true,
      instructions_format: "text",
      preference: "fastest",
      units: "km",
      language: "pt"
    };

    try {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: cabecalhos,
        body: JSON.stringify(corpo)
      });

      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        console.error(`Erro na Openrouteservice API (${resposta.status}): ${dadosErro.error?.message || 'Erro desconhecido'}`);
        return null;
      }

      const dados: OpenRouteServiceResponse = await resposta.json();
      if (dados.routes && dados.routes.length > 0) {
        return dados.routes[0];
      }
      return null;
    } catch (erro) {
      console.error("Erro ao buscar caminho real da Openrouteservice API:", erro);
      return null;
    }
  }


  private extrairGeometriaORS(rotaORS: OpenRouteServiceRoute): Coordenada[] {

    if (!rotaORS) {
      console.warn('Rota ORS não fornecida');
      return [];
    }


    if (typeof rotaORS.geometry === 'string' && rotaORS.geometry.length > 0) {
      return this.decodificarPolylineORS(rotaORS.geometry);
    } else if (rotaORS.geometry && Array.isArray((rotaORS.geometry as any).coordinates)) {

      const coordenadas = (rotaORS.geometry as any).coordinates;
      return coordenadas.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
    } else {

      console.warn('Geometria da rota não encontrada, usando pontos dos segmentos');


      if (rotaORS.segments && Array.isArray(rotaORS.segments)) {
        const coordenadas: Coordenada[] = [];
        rotaORS.segments.forEach(segmento => {
          if (segmento.steps && Array.isArray(segmento.steps)) {
            segmento.steps.forEach(passo => {
              if (passo.way_points && Array.isArray(passo.way_points)) {



              }
            });
          }
        });
      }

      return [];
    }
  }


  private decodificarPolylineORS(stringCodificada: string): Coordenada[] {
    let indice = 0, lat = 0, lng = 0, coordenadas: Coordenada[] = [];
    let deslocamento = 0, resultado = 0, byte = null;

    while (indice < stringCodificada.length) {
      byte = null;
      deslocamento = 0;
      resultado = 0;
      do {
        byte = stringCodificada.charCodeAt(indice++) - 63;
        resultado |= (byte & 0x1f) << deslocamento;
        deslocamento += 5;
      } while (byte >= 0x20);
      const dLat = ((resultado & 1) ? ~(resultado >> 1) : (resultado >> 1));
      lat += dLat;

      deslocamento = 0;
      resultado = 0;
      do {
        byte = stringCodificada.charCodeAt(indice++) - 63;
        resultado |= (byte & 0x1f) << deslocamento;
        deslocamento += 5;
      } while (byte >= 0x20);
      const dLng = ((resultado & 1) ? ~(resultado >> 1) : (resultado >> 1));
      lng += dLng;

      coordenadas.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return coordenadas;
  }

  private extrairPassosORS(rotaORS: OpenRouteServiceRoute): string[] {
    const passos: string[] = [];


    if (rotaORS.instructions && Array.isArray(rotaORS.instructions)) {
      rotaORS.instructions.forEach(instrucao => {
        if (instrucao && instrucao.text) {
          passos.push(instrucao.text);
        }
      });
    } else if (rotaORS.segments && Array.isArray(rotaORS.segments)) {

      rotaORS.segments.forEach(segmento => {
        if (segmento.steps && Array.isArray(segmento.steps)) {
          segmento.steps.forEach(passo => {
            if (passo && passo.instruction) {
              passos.push(passo.instruction);
            }
          });
        }
      });
    }


    if (passos.length === 0) {
      passos.push('Siga a rota indicada no mapa');
      passos.push('Continue até o destino');
    }

    return passos;
  }

  private converterDuracaoSegundosParaMinutos(segundos: number): number {
    return Math.round(segundos / 60);
  }

  private criarRotaRapida(distanciaKm: number, opcoes: OpcoesRota, cidadeOrigem: string, cidadeDestino: string, caminho: Coordenada[], duracaoMinutos: number, passos: string[]): Rota | null {
    const tarifaInfo = this.servicoOnibus.calcularTarifaViagem(cidadeOrigem, cidadeDestino);
    const custoTotal = tarifaInfo.tarifa + (cidadeOrigem === 'São Paulo' ? 5.00 : 0);

    return {
      id: 1,
      tipo: 'Rápida',
      duracao: this.formatarDuracao(duracaoMinutos),
      custo: `R$ ${custoTotal.toFixed(2)}`,
      sustentabilidade: {
        pontuacao: 6,
        descricao: 'Médio Impacto'
      },
      modais: cidadeOrigem === 'São Paulo' ? [
        { nome: 'Metrô', icone: this.icones.metro },
        { nome: 'Ônibus', icone: this.icones.onibus }
      ] : [
        { nome: 'Ônibus Expresso', icone: this.icones.onibus }
      ],
      classesCor: 'border-blue-300 ring-blue-400',
      corCaminho: '#3b82f6',
      caminho: caminho,
      detalhes: {
        distancia: `${distanciaKm.toFixed(1)} km`,
        passos: passos,
        linhasOnibus: tarifaInfo.linhasSugeridas.map(l => l.numero),
        custoTransporte: `${tarifaInfo.tipo}: R$ ${custoTotal.toFixed(2)}`,
        distanciaCaminhada: '400m',
        tempoTotal: duracaoMinutos,
      }
    };
  }

  private criarRotaVerde(distanciaKm: number, opcoes: OpcoesRota, cidadeOrigem: string, cidadeDestino: string, caminho: Coordenada[], duracaoMinutos: number, passos: string[]): Rota | null {
    return {
      id: 3,
      tipo: 'Verde',
      duracao: this.formatarDuracao(duracaoMinutos),
      custo: 'Gratuito',
      sustentabilidade: {
        pontuacao: 10,
        descricao: 'Zero Emissão'
      },
      modais: [
        { nome: 'Bicicleta', icone: this.icones.bicicleta },
        { nome: 'Caminhada', icone: this.icones.caminhada }
      ],
      classesCor: 'border-green-300 ring-green-400',
      corCaminho: '#22c55e',
      caminho: caminho,
      detalhes: {
        distancia: `${(distanciaKm * 1.08).toFixed(1)} km`,
        passos: passos,
        custoTransporte: 'Sistema de bikes compartilhadas',
        distanciaCaminhada: '850m',
        tempoTotal: duracaoMinutos
      }
    };
  }


  private async criarRotaBicicletaInteligente(opcoes: OpcoesRota, cidadeOrigem: string, cidadeDestino: string): Promise<Rota | null> {
    try {

      const estacoesBike = await this.servicoBicicletas.obterEstacoesMock();
      const estacaoOrigem = this.encontrarEstacaoProxima(opcoes.origem, estacoesBike);

      if (!estacaoOrigem) {

        const rotaBikeDireta = await this.obterCaminhoOpenRouteService(opcoes.origem, opcoes.destino, 'cycling-regular');
        if (rotaBikeDireta && rotaBikeDireta.summary) {
          return this.criarRotaVerde(
            rotaBikeDireta.summary.distance / 1000,
            opcoes,
            cidadeOrigem,
            cidadeDestino,
            this.extrairGeometriaORS(rotaBikeDireta),
            this.converterDuracaoSegundosParaMinutos(rotaBikeDireta.summary.duration),
            ['Rota direta de bicicleta']
          );
        }
        return null;
      }


      const rotaParaEstacao = await this.obterCaminhoOpenRouteService(opcoes.origem, { lat: estacaoOrigem.lat, lng: estacaoOrigem.lng || estacaoOrigem.lon }, 'foot-walking');
      const rotaDeBike = await this.obterCaminhoOpenRouteService({ lat: estacaoOrigem.lat, lng: estacaoOrigem.lng || estacaoOrigem.lon }, opcoes.destino, 'cycling-regular');

      if (!rotaParaEstacao || !rotaDeBike || !rotaParaEstacao.summary || !rotaDeBike.summary) {
        return null;
      }


      const caminhoCompleto = [
        ...this.extrairGeometriaORS(rotaParaEstacao),
        ...this.extrairGeometriaORS(rotaDeBike)
      ];

      const distanciaTotal = (rotaParaEstacao.summary.distance + rotaDeBike.summary.distance) / 1000;
      const duracaoTotal = this.converterDuracaoSegundosParaMinutos(rotaParaEstacao.summary.duration + rotaDeBike.summary.duration);

      const passosMultimodais = [
        `Caminhe ${(rotaParaEstacao.summary.distance / 1000).toFixed(1)}km até a estação ${estacaoOrigem.nome}`,
        `Retire uma bicicleta da estação`,
        `Pedale ${(rotaDeBike.summary.distance / 1000).toFixed(1)}km até o destino`,
        'Devolva a bicicleta em uma estação próxima ao destino'
      ];

      return {
        id: 3,
        tipo: 'Verde',
        duracao: this.formatarDuracao(duracaoTotal),
        custo: 'R$ 4,50/30min',
        sustentabilidade: {
          pontuacao: 10,
          descricao: 'Zero Emissão'
        },
        modais: [
          { nome: 'Caminhada', icone: this.icones.caminhada },
          { nome: 'Bicicleta', icone: this.icones.bicicleta }
        ],
        classesCor: 'border-green-300 ring-green-400',
        corCaminho: '#22c55e',
        caminho: caminhoCompleto,
        detalhes: {
          distancia: `${distanciaTotal.toFixed(1)} km`,
          passos: passosMultimodais,
          custoTransporte: 'Sistema de bikes compartilhadas',
          distanciaCaminhada: `${(rotaParaEstacao.summary.distance / 1000).toFixed(1)}km`,
          tempoTotal: duracaoTotal
        }
      };

    } catch (erro) {
      console.error('Erro ao criar rota de bicicleta inteligente:', erro);
      return null;
    }
  }


  private async criarRotaTransportePublico(opcoes: OpcoesRota, cidadeOrigem: string, cidadeDestino: string): Promise<Rota | null> {
    try {

      const rotaCaminhada = await this.obterCaminhoOpenRouteService(opcoes.origem, opcoes.destino, 'foot-walking');

      if (!rotaCaminhada || !rotaCaminhada.summary) {
        return null;
      }


      const linhasDisponiveis = this.servicoOnibus.calcularTarifaViagem(cidadeOrigem, cidadeDestino);


      const distanciaTotal = rotaCaminhada.summary.distance / 1000;
      const duracaoEstimada = Math.round((distanciaTotal / 15) * 60) + 20;

      const passosTransportePublico = [
        'Caminhe até o ponto de ônibus mais próximo (5-10 min)',
        `Embarque na linha ${linhasDisponiveis.linhasSugeridas[0]?.numero || 'XXX'}`,
        `Viaje por aproximadamente ${Math.round(distanciaTotal * 0.8)} km`,
        'Desembarque no ponto mais próximo do destino',
        'Caminhe até o destino final (5-10 min)'
      ];

      return {
        id: 2,
        tipo: 'Econômica',
        duracao: this.formatarDuracao(duracaoEstimada),
        custo: `R$ ${linhasDisponiveis.tarifa.toFixed(2)}`,
        sustentabilidade: {
          pontuacao: 8,
          descricao: 'Baixo Impacto'
        },
        modais: [
          { nome: 'Caminhada', icone: this.icones.caminhada },
          { nome: 'Ônibus', icone: this.icones.onibus }
        ],
        classesCor: 'border-yellow-300 ring-yellow-400',
        corCaminho: '#f59e0b',
        caminho: this.extrairGeometriaORS(rotaCaminhada),
        detalhes: {
          distancia: `${distanciaTotal.toFixed(1)} km`,
          passos: passosTransportePublico,
          linhasOnibus: linhasDisponiveis.linhasSugeridas.map(l => l.numero),
          custoTransporte: `${linhasDisponiveis.tipo}: R$ ${linhasDisponiveis.tarifa.toFixed(2)}`,
          distanciaCaminhada: '0.8km',
          tempoTotal: duracaoEstimada
        }
      };

    } catch (erro) {
      console.error('Erro ao criar rota de transporte público:', erro);
      return null;
    }
  }


  private encontrarEstacaoProxima(coordenada: Coordenada, estacoes: any[]): any | null {
    if (!estacoes || estacoes.length === 0) {
      return null;
    }

    let estacaoMaisProxima = null;
    let menorDistancia = Infinity;

    for (const estacao of estacoes) {
      const lat = estacao.lat;
      const lng = estacao.lng || estacao.lon;

      if (lat && lng) {
        const distancia = this.calcularDistancia(coordenada, { lat, lng });
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          estacaoMaisProxima = estacao;
        }
      }
    }


    return menorDistancia <= 2.0 ? estacaoMaisProxima : null;
  }

  private calcularDistancia(origem: Coordenada, destino: Coordenada): number {
    const R = 6371;
    const dLat = this.grausParaRadianos(destino.lat - origem.lat);
    const dLng = this.grausParaRadianos(destino.lng - origem.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.grausParaRadianos(origem.lat)) * Math.cos(this.grausParaRadianos(destino.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private grausParaRadianos(graus: number): number {
    return graus * (Math.PI / 180);
  }

  private formatarDuracao(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    if (horas > 0) {
      return `${horas}h ${mins}min`;
    }
    return `${mins} min`;
  }

  private detectarCidade(coords: Coordenada): string {

    if (coords.lat >= -23.7 && coords.lat <= -23.4 && coords.lng >= -46.8 && coords.lng <= -46.4) {
      return 'São Paulo';
    }

    if (coords.lat >= -23.6 && coords.lat <= -23.4 && coords.lng >= -47.6 && coords.lng <= -47.3) {
      return 'Sorocaba';
    }

    if (coords.lat >= -23.4 && coords.lat <= -23.1 && coords.lng >= -47.4 && coords.lng <= -47.1) {
      return 'Itu';
    }

    if (coords.lat >= -22.95 && coords.lat <= -22.8 && coords.lng >= -47.2 && coords.lng <= -46.9) {
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
    economia: string;
  } {
    const tempoHoras = rota.detalhes.tempoTotal / 60;
    const custoPorKm = parseFloat(rota.custo.replace('R$ ', '').replace(',', '.')) / parseFloat(rota.detalhes.distancia);

    return {
      eficiencia: `${(parseFloat(rota.detalhes.distancia) / tempoHoras).toFixed(1)} km/h média`,
      economia: isNaN(custoPorKm) ? 'Gratuito' : `R$ ${custoPorKm.toFixed(2)}/km`
    };
  }
}

