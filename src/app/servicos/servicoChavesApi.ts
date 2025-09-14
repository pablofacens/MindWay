import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicoChavesApi {
  private chavesApi = {
    mapTiler: '44EhVhrFiQ8fyVN991SG',
    openWeatherMap: '55f41cd3c577ec0a4dffc18e6c927e99',
    hereMaps: 'P_SoVppA4s8_JaKdQpncOUmIscYD3'
  };

  constructor() { }

  obterChaveApi(servico: 'mapTiler' | 'openWeatherMap' | 'hereMaps'): string {
    return this.chavesApi[servico];
  }

  definirChaveApi(servico: 'mapTiler' | 'openWeatherMap' | 'hereMaps', chave: string): void {
    this.chavesApi[servico] = chave;
  }


  verificarChavesConfiguradas(): {
    mapTiler: boolean;
    openWeatherMap: boolean;
    hereMaps: boolean;
  } {
    return {
      mapTiler: !this.chavesApi.mapTiler.startsWith('SUA_CHAVE'),
      openWeatherMap: !this.chavesApi.openWeatherMap.startsWith('SUA_CHAVE'),
      hereMaps: !this.chavesApi.hereMaps.startsWith('SUA_CHAVE')
    };
  }

  obterUrlsRegistro(): {
    mapTiler: string;
    openWeatherMap: string;
    hereMaps: string;
  } {
    return {
      mapTiler: 'https://www.maptiler.com/cloud/',
      openWeatherMap: 'https://openweathermap.org/api',
      hereMaps: 'https://developer.here.com/'
    };
  }

  obterLimitesGratuitos(): {
    mapTiler: string;
    openWeatherMap: string;
    hereMaps: string;
  } {
    return {
      mapTiler: '100.000 requisições/mês',
      openWeatherMap: '1.000 chamadas/dia',
      hereMaps: '250.000 transações/mês'
    };
  }
}