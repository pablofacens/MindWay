import { Injectable } from '@angular/core';

interface EstacaoBicicleta {
  id: string;
  nome: string;
  cidade: string;
  lat: number;
  lon: number;
  bicicletas_disponiveis: number;
  vagas_disponiveis: number;
  sistema: string;
  tarifa_hora?: number;
  tarifa_diaria?: number;
  tipo: 'publica' | 'privada' | 'compartilhada';
  empresa?: string;
}

interface TarifaBicicleta {
  sistema: string;
  cidade: string;
  primeira_hora: number;
  hora_adicional: number;
  diaria: number;
  mensal?: number;
  anual?: number;
  gratuito_minutos?: number;
  descricao: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicoBicicletas {

  private tarifasSistemasBike: TarifaBicicleta[] = [
    {
      sistema: 'Tembici São Paulo',
      cidade: 'São Paulo',
      primeira_hora: 0,
      hora_adicional: 5.00,
      diaria: 15.00,
      mensal: 29.90,
      anual: 299.00,
      gratuito_minutos: 60,
      descricao: 'Primeiros 60 min gratuitos, depois R$ 5,00/hora'
    },
    {
      sistema: 'CicloSampa',
      cidade: 'São Paulo',
      primeira_hora: 0,
      hora_adicional: 5.00,
      diaria: 12.00,
      gratuito_minutos: 60,
      descricao: 'Sistema público de São Paulo - 60 min gratuitos'
    },
    {
      sistema: 'Bike Sorocaba',
      cidade: 'Sorocaba',
      primeira_hora: 0,
      hora_adicional: 3.00,
      diaria: 10.00,
      mensal: 25.00,
      gratuito_minutos: 45,
      descricao: 'Sistema municipal - 45 min gratuitos'
    },
    {
      sistema: 'Itu Bike',
      cidade: 'Itu',
      primeira_hora: 0,
      hora_adicional: 2.50,
      diaria: 8.00,
      mensal: 20.00,
      gratuito_minutos: 30,
      descricao: 'Sistema municipal - 30 min gratuitos'
    },
    {
      sistema: 'Bike Rio Claro',
      cidade: 'Rio Claro',
      primeira_hora: 0,
      hora_adicional: 2.00,
      diaria: 6.00,
      gratuito_minutos: 30,
      descricao: 'Sistema regional - 30 min gratuitos'
    }
  ];

  constructor() { }

  async buscarEstacoesBicicleta(): Promise<EstacaoBicicleta[]> {
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const gbfsUrl = `${corsProxy}${encodeURIComponent('https://gbfs.tembici.com.br/sampa/gbfs/gbfs.json')}`;

      const response = await fetch(gbfsUrl);
      if (response.ok) {
        const data = await response.json();
        return await this.processarDadosTembici(data);
      }
    } catch (error) {
      console.warn('API Tembici indisponível, usando dados simulados', error);
    }

    return this.obterEstacoesMock();
  }

  private async processarDadosTembici(gbfsData: any): Promise<EstacaoBicicleta[]> {
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const stationInfoUrl = gbfsData.data.pt.feeds.find((f: any) => f.name === 'station_information').url;
      const stationStatusUrl = gbfsData.data.pt.feeds.find((f: any) => f.name === 'station_status').url;

      const [infoData, statusData] = await Promise.all([
        fetch(`${corsProxy}${encodeURIComponent(stationInfoUrl)}`).then(r => r.json()),
        fetch(`${corsProxy}${encodeURIComponent(stationStatusUrl)}`).then(r => r.json())
      ]);

      interface StationStatus {
        station_id: string;
        num_bikes_available: number;
        num_docks_available: number;
        [key: string]: any;
      }

      const statusMap = new Map<string, StationStatus>(
        statusData.data.stations.map((s: StationStatus) => [s.station_id, s])
      );

      return infoData.data.stations.map((station: any) => {
        const status = statusMap.get(station.station_id);
        return {
          id: station.station_id,
          nome: station.name,
          cidade: 'São Paulo',
          lat: station.lat,
          lon: station.lon,
          bicicletas_disponiveis: status?.num_bikes_available || 0,
          vagas_disponiveis: status?.num_docks_available || 0,
          sistema: 'Tembici São Paulo',
          tarifa_hora: 0,
          tarifa_diaria: 15.00,
          tipo: 'compartilhada',
          empresa: 'Tembici'
        };
      });
    } catch (error) {
      console.error('Erro ao processar dados Tembici:', error);
      return this.obterEstacoesMock();
    }
  }

  obterEstacoesMock(): EstacaoBicicleta[] {
    return [

      {
        id: 'SP001',
        nome: 'Estação MASP',
        cidade: 'São Paulo',
        lat: -23.5613,
        lon: -46.6565,
        bicicletas_disponiveis: 8,
        vagas_disponiveis: 12,
        sistema: 'Tembici São Paulo',
        tarifa_hora: 0,
        tarifa_diaria: 15.00,
        tipo: 'compartilhada',
        empresa: 'Tembici'
      },
      {
        id: 'SP002',
        nome: 'Estação Consolação',
        cidade: 'São Paulo',
        lat: -23.556,
        lon: -46.662,
        bicicletas_disponiveis: 5,
        vagas_disponiveis: 15,
        sistema: 'Tembici São Paulo',
        tarifa_hora: 0,
        tarifa_diaria: 15.00,
        tipo: 'compartilhada',
        empresa: 'Tembici'
      },
      {
        id: 'SP003',
        nome: 'Estação Ibirapuera - Portão 10',
        cidade: 'São Paulo',
        lat: -23.587,
        lon: -46.657,
        bicicletas_disponiveis: 12,
        vagas_disponiveis: 8,
        sistema: 'CicloSampa',
        tarifa_hora: 0,
        tarifa_diaria: 12.00,
        tipo: 'publica',
        empresa: 'Prefeitura SP'
      },
      {
        id: 'SP004',
        nome: 'Estação Faria Lima',
        cidade: 'São Paulo',
        lat: -23.567,
        lon: -46.695,
        bicicletas_disponiveis: 6,
        vagas_disponiveis: 14,
        sistema: 'Tembici São Paulo',
        tarifa_hora: 0,
        tarifa_diaria: 15.00,
        tipo: 'compartilhada',
        empresa: 'Tembici'
      },


      {
        id: 'SOR001',
        nome: 'Terminal Central Sorocaba',
        cidade: 'Sorocaba',
        lat: -23.502,
        lon: -47.458,
        bicicletas_disponiveis: 4,
        vagas_disponiveis: 16,
        sistema: 'Bike Sorocaba',
        tarifa_hora: 0,
        tarifa_diaria: 10.00,
        tipo: 'publica',
        empresa: 'Prefeitura Sorocaba'
      },
      {
        id: 'SOR002',
        nome: 'Parque da Água Vermelha',
        cidade: 'Sorocaba',
        lat: -23.496,
        lon: -47.451,
        bicicletas_disponiveis: 7,
        vagas_disponiveis: 13,
        sistema: 'Bike Sorocaba',
        tarifa_hora: 0,
        tarifa_diaria: 10.00,
        tipo: 'publica',
        empresa: 'Prefeitura Sorocaba'
      },


      {
        id: 'ITU001',
        nome: 'Centro Histórico Itu',
        cidade: 'Itu',
        lat: -23.264,
        lon: -47.299,
        bicicletas_disponiveis: 3,
        vagas_disponiveis: 17,
        sistema: 'Itu Bike',
        tarifa_hora: 0,
        tarifa_diaria: 8.00,
        tipo: 'publica',
        empresa: 'Prefeitura Itu'
      },
      {
        id: 'ITU002',
        nome: 'Praça da Independência',
        cidade: 'Itu',
        lat: -23.258,
        lon: -47.305,
        bicicletas_disponiveis: 5,
        vagas_disponiveis: 15,
        sistema: 'Itu Bike',
        tarifa_hora: 0,
        tarifa_diaria: 8.00,
        tipo: 'publica',
        empresa: 'Prefeitura Itu'
      },

      {
        id: 'RC001',
        nome: 'Estação Central Rio Claro',
        cidade: 'Rio Claro',
        lat: -22.411,
        lon: -47.561,
        bicicletas_disponiveis: 6,
        vagas_disponiveis: 14,
        sistema: 'Bike Rio Claro',
        tarifa_hora: 0,
        tarifa_diaria: 6.00,
        tipo: 'publica',
        empresa: 'Prefeitura Rio Claro'
      }
    ];
  }

  obterEstacoesPorCidade(cidade: string): EstacaoBicicleta[] {
    return this.obterEstacoesMock().filter(estacao =>
      estacao.cidade.toLowerCase().includes(cidade.toLowerCase())
    );
  }

  obterTarifasBicicleta(cidade?: string): TarifaBicicleta[] {
    if (cidade) {
      return this.tarifasSistemasBike.filter(tarifa =>
        tarifa.cidade.toLowerCase().includes(cidade.toLowerCase())
      );
    }
    return this.tarifasSistemasBike;
  }

  calcularCustoBicicleta(sistema: string, minutos: number): {
    custo: number;
    descricao: string;
    gratuito: boolean;
  } {
    const tarifa = this.tarifasSistemasBike.find(t => t.sistema === sistema);
    if (!tarifa) {
      return {
        custo: 0,
        descricao: 'Sistema não encontrado',
        gratuito: false
      };
    }

    if (tarifa.gratuito_minutos && minutos <= tarifa.gratuito_minutos) {
      return {
        custo: 0,
        descricao: `Gratuito (${tarifa.gratuito_minutos} min inclusos)`,
        gratuito: true
      };
    }

    const minutosExcedentes = Math.max(0, minutos - (tarifa.gratuito_minutos || 0));
    const horasExcedentes = Math.ceil(minutosExcedentes / 60);
    const custo = horasExcedentes * tarifa.hora_adicional;

    return {
      custo: custo,
      descricao: `${horasExcedentes}h extras a R$ ${tarifa.hora_adicional.toFixed(2)}/h`,
      gratuito: false
    };
  }

  obterSistemasPorCidade(cidade: string): string[] {
    return this.tarifasSistemasBike
      .filter(t => t.cidade.toLowerCase().includes(cidade.toLowerCase()))
      .map(t => t.sistema);
  }

  obterEstacaoMaisProxima(lat: number, lon: number, cidade?: string): EstacaoBicicleta | null {
    let estacoes = this.obterEstacoesMock();

    if (cidade) {
      estacoes = estacoes.filter(e =>
        e.cidade.toLowerCase().includes(cidade.toLowerCase())
      );
    }

    if (estacoes.length === 0) return null;

    return estacoes.reduce((closest, current) => {
      const currentDistance = this.calcularDistancia(lat, lon, current.lat, current.lon);
      const closestDistance = this.calcularDistancia(lat, lon, closest.lat, closest.lon);

      return currentDistance < closestDistance ? current : closest;
    });
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}