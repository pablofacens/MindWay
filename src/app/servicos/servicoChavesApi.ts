import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicoChavesApi {
  private chavesApi = {
    mapTiler: 'SUA_CHAVE_AQUI',
    openWeatherMap: 'SUA_CHAVE_AQUI',
    openRouteService: 'SUA_CHAVE_AQUI',
  };

  constructor() { }


  obterChaveApi(servico: 'mapTiler' | 'openWeatherMap' | 'openRouteService'): string {
    return this.chavesApi[servico];
  }


  definirChaveApi(servico: 'mapTiler' | 'openWeatherMap' | 'openRouteService', chave: string): void {
    this.chavesApi[servico] = chave;
  }



  verificarChavesConfiguradas(): {
    mapTiler: boolean;
    openWeatherMap: boolean;
    openRouteService: boolean;
  } {
    return {
      mapTiler: !this.chavesApi.mapTiler.startsWith('SUA_CHAVE'),
      openWeatherMap: !this.chavesApi.openWeatherMap.startsWith("SUA_CHAVE"),
      openRouteService: !this.chavesApi.openRouteService.startsWith("SUA_CHAVE"),
    };
  }


  obterUrlsRegistro(): {
    mapTiler: string;
    openWeatherMap: string;
  } {
    return {
      mapTiler: 'https://www.maptiler.com/cloud/',
      openWeatherMap: 'https://openweathermap.org/api',
    };
  }


  obterLimitesGratuitos(): {
    mapTiler: string;
    openWeatherMap: string;
  } {
    return {
      mapTiler: '100.000 requisições/mês',
      openWeatherMap: '1.000 chamadas/dia',
    };
  }
}
