import { Injectable, inject } from '@angular/core';
import { ServicoChavesApi } from './servicoChavesApi';

interface InfoClima {
  temp: number;
  description: string;
  iconUrl: string;
  sensacao: number;
  umidade: number;
  vento: number;
}

interface InfoQualidadeAr {
  aqi: number;
  nivel: string;
  cor: string;
  descricao: string;
  componentes?: {
    co: number;
    no2: number;
    o3: number;
    pm2_5: number;
    pm10: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ServicoClima {
  private servicoChavesApi = inject(ServicoChavesApi);

  constructor() { }

  async buscarClima(coordenadas: { lat: number; lng: number }): Promise<InfoClima | null> {
    const chaveApi = this.servicoChavesApi.obterChaveApi('openWeatherMap');

    if (!chaveApi || chaveApi.startsWith('SUA_CHAVE')) {
      console.warn('Chave da API OpenWeatherMap não configurada');
      return this.obterClimaMock(coordenadas);
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordenadas.lat}&lon=${coordenadas.lng}&appid=${chaveApi}&units=metric&lang=pt_br`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const dados = await response.json();

      return {
        temp: Math.round(dados.main.temp),
        description: this.capitalizarPrimeira(dados.weather[0].description),
        iconUrl: `https://openweathermap.org/img/wn/${dados.weather[0].icon}@2x.png`,
        sensacao: Math.round(dados.main.feels_like),
        umidade: dados.main.humidity,
        vento: Math.round(dados.wind.speed * 3.6)
      };
    } catch (error) {
      console.error('Erro ao buscar dados climáticos:', error);
      return this.obterClimaMock(coordenadas);
    }
  }

  async buscarQualidadeAr(coordenadas: { lat: number; lng: number }): Promise<InfoQualidadeAr | null> {
    const chaveApi = this.servicoChavesApi.obterChaveApi('openWeatherMap');

    if (!chaveApi || chaveApi.startsWith('SUA_CHAVE')) {
      console.warn('Chave da API OpenWeatherMap não configurada');
      return this.obterQualidadeArMock();
    }

    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coordenadas.lat}&lon=${coordenadas.lng}&appid=${chaveApi}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const dados = await response.json();
      const aqi = dados.list[0].main.aqi;
      const componentes = dados.list[0].components;

      const infoQualidade = this.obterInfoQualidadeAr(aqi);

      return {
        ...infoQualidade,
        componentes: {
          co: componentes.co,
          no2: componentes.no2,
          o3: componentes.o3,
          pm2_5: componentes.pm2_5,
          pm10: componentes.pm10
        }
      };
    } catch (error) {
      console.error('Erro ao buscar qualidade do ar:', error);
      return this.obterQualidadeArMock();
    }
  }

  private obterInfoQualidadeAr(aqi: number): InfoQualidadeAr {
    switch (aqi) {
      case 1:
        return {
          aqi,
          nivel: 'Boa',
          cor: '#79bc6a',
          descricao: 'Qualidade do ar satisfatória'
        };
      case 2:
        return {
          aqi,
          nivel: 'Razoável',
          cor: '#bbcf4c',
          descricao: 'Qualidade do ar aceitável'
        };
      case 3:
        return {
          aqi,
          nivel: 'Moderada',
          cor: '#f7d460',
          descricao: 'Pessoas sensíveis podem sentir desconforto'
        };
      case 4:
        return {
          aqi,
          nivel: 'Ruim',
          cor: '#f89a6a',
          descricao: 'Qualidade do ar inadequada'
        };
      case 5:
        return {
          aqi,
          nivel: 'Muito Ruim',
          cor: '#f76972',
          descricao: 'Qualidade do ar muito inadequada'
        };
      default:
        return {
          aqi,
          nivel: 'Desconhecido',
          cor: '#a0a0a0',
          descricao: 'Dados não disponíveis'
        };
    }
  }

  private obterClimaMock(coordenadas: { lat: number; lng: number }): InfoClima {
    const temperaturas = {
      'saopaulo': 22,
      'sorocaba': 21,
      'itu': 20,
      'campinas': 23,
      'santos': 25
    };

    const cidade = this.detectarCidadePorCoordenada(coordenadas);
    const temp = temperaturas[cidade as keyof typeof temperaturas] || 22;

    return {
      temp: temp + Math.round(Math.random() * 4 - 2),
      description: this.obterDescricaoClimaAleatoria(),
      iconUrl: 'https://openweathermap.org/img/wn/02d@2x.png',
      sensacao: temp + Math.round(Math.random() * 3 - 1),
      umidade: Math.round(60 + Math.random() * 30),
      vento: Math.round(5 + Math.random() * 15)
    };
  }

  private obterQualidadeArMock(): InfoQualidadeAr {

    const aqiSimulado = Math.floor(Math.random() * 3) + 2;
    return this.obterInfoQualidadeAr(aqiSimulado);
  }

  private detectarCidadePorCoordenada(coords: { lat: number, lng: number }): string {

    if (coords.lat >= -23.7 && coords.lat <= -23.4 &&
      coords.lng >= -46.8 && coords.lng <= -46.4) {
      return 'saopaulo';
    }


    if (coords.lat >= -23.6 && coords.lat <= -23.4 &&
      coords.lng >= -47.6 && coords.lng <= -47.3) {
      return 'sorocaba';
    }


    if (coords.lat >= -23.4 && coords.lat <= -23.1 &&
      coords.lng >= -47.4 && coords.lng <= -47.1) {
      return 'itu';
    }


    if (coords.lat >= -22.95 && coords.lat <= -22.8 &&
      coords.lng >= -47.2 && coords.lng <= -46.9) {
      return 'campinas';
    }


    if (coords.lat >= -24.1 && coords.lat <= -23.9 &&
      coords.lng >= -46.5 && coords.lng <= -46.2) {
      return 'santos';
    }

    return 'saopaulo';
  }

  private obterDescricaoClimaAleatoria(): string {
    const descricoes = [
      'céu limpo',
      'parcialmente nublado',
      'nublado',
      'céu claro',
      'algumas nuvens',
      'nuvens dispersas'
    ];

    return descricoes[Math.floor(Math.random() * descricoes.length)];
  }

  private capitalizarPrimeira(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  obterPrevisaoSemana(): Promise<Array<{
    dia: string;
    tempMax: number;
    tempMin: number;
    descricao: string;
    icone: string;
  }>> {
    return new Promise((resolve) => {
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const hoje = new Date();

      const previsao = Array.from({ length: 7 }, (_, index) => {
        const data = new Date(hoje);
        data.setDate(data.getDate() + index);

        return {
          dia: index === 0 ? 'Hoje' : diasSemana[data.getDay()],
          tempMax: Math.round(20 + Math.random() * 10),
          tempMin: Math.round(15 + Math.random() * 8),
          descricao: this.obterDescricaoClimaAleatoria(),
          icone: ['01d', '02d', '03d', '04d'][Math.floor(Math.random() * 4)]
        };
      });

      setTimeout(() => resolve(previsao), 500);
    });
  }

  obterAlertasClimaticos(): Promise<Array<{
    tipo: string;
    severidade: 'baixa' | 'media' | 'alta';
    titulo: string;
    descricao: string;
    dataInicio: Date;
    dataFim: Date;
  }>> {
    return new Promise((resolve) => {

      const alertasPossiveis = [
        {
          tipo: 'chuva',
          severidade: 'media' as const,
          titulo: 'Chuva forte prevista',
          descricao: 'Possibilidade de chuva intensa nas próximas horas. Evite áreas de alagamento.',
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 6 * 60 * 60 * 1000)
        },
        {
          tipo: 'qualidade_ar',
          severidade: 'alta' as const,
          titulo: 'Qualidade do ar inadequada',
          descricao: 'Níveis elevados de poluição. Evite exercícios ao ar livre.',
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];


      const alertas = Math.random() < 0.3 ?
        [alertasPossiveis[Math.floor(Math.random() * alertasPossiveis.length)]] :
        [];

      setTimeout(() => resolve(alertas), 300);
    });
  }


  avaliarCondicoesBicicleta(clima: InfoClima | null, qualidadeAr: InfoQualidadeAr | null): {
    recomendado: boolean;
    motivo: string;
    pontuacao: number;
  } {
    if (!clima || !qualidadeAr) {
      return {
        recomendado: false,
        motivo: 'Dados climáticos indisponíveis',
        pontuacao: 5
      };
    }

    let pontuacao = 10;
    const motivos = [];


    if (clima.temp < 10 || clima.temp > 35) {
      pontuacao -= 3;
      motivos.push(clima.temp < 10 ? 'muito frio' : 'muito quente');
    }


    if (clima.vento > 25) {
      pontuacao -= 2;
      motivos.push('vento forte');
    }


    if (qualidadeAr.aqi >= 4) {
      pontuacao -= 4;
      motivos.push('ar poluído');
    } else if (qualidadeAr.aqi >= 3) {
      pontuacao -= 2;
      motivos.push('qualidade do ar moderada');
    }


    if (clima.description.includes('chuv')) {
      pontuacao -= 5;
      motivos.push('chuva');
    }

    const recomendado = pontuacao >= 7;
    const motivo = recomendado ?
      'Condições favoráveis para pedalar!' :
      `Não recomendado: ${motivos.join(', ')}.`;

    return {
      recomendado,
      motivo,
      pontuacao: Math.max(0, pontuacao)
    };
  }
}
