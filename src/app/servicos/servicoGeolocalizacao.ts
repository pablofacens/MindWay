import { Injectable, inject } from '@angular/core';
import { ServicoChavesApi } from './servicoChavesApi';

interface ResultadoNominatim {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: any;
  boundingbox: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ServicoGeolocalizacao {
  private servicoChavesApi = inject(ServicoChavesApi);
  private urlApiNominatim = 'https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&q=';
  private urlApiNominatimReverso = 'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=';

  constructor() { }

  async buscarEndereco(consulta: string): Promise<ResultadoNominatim[]> {

    const consultaFormatada = this.formatarConsultaParaSP(consulta);

    try {
      const response = await fetch(`${this.urlApiNominatim}${encodeURIComponent(consultaFormatada)}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const dados: ResultadoNominatim[] = await response.json();

      return this.filtrarResultadosSP(dados);

    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return this.obterSugestoesMock(consulta);
    }
  }

  async geocodificacaoReversa(lat: number, lon: number): Promise<ResultadoNominatim | null> {
    try {
      const response = await fetch(`${this.urlApiNominatimReverso}${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }
      const dados: ResultadoNominatim = await response.json();
      return dados;
    } catch (error) {
      console.error('Erro ao fazer geocodificação reversa:', error);
      return null;
    }
  }

  async obterLocalizacaoAtual(): Promise<{ lat: number, lng: number, cidade: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocalização não suportada pelo navegador');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };


          const endereco = await this.geocodificacaoReversa(coords.lat, coords.lng);
          const cidade = this.extrairCidade(endereco);

          resolve({
            ...coords,
            cidade: cidade
          });
        },
        (error) => {
          console.warn('Erro ao obter localização:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  private formatarConsultaParaSP(consulta: string): string {
    const consultaLimpa = consulta.toLowerCase().trim();


    if (consultaLimpa.includes('são paulo') || consultaLimpa.includes('sp, brasil')) {
      return consulta;
    }


    return `${consulta}, São Paulo, Brasil`;
  }

  private filtrarResultadosSP(resultados: ResultadoNominatim[]): ResultadoNominatim[] {

    const resultadosSP = resultados.filter(resultado =>
      resultado.display_name.toLowerCase().includes('são paulo') ||
      resultado.display_name.toLowerCase().includes('sorocaba') ||
      resultado.display_name.toLowerCase().includes('campinas') ||
      resultado.display_name.toLowerCase().includes('santos') ||
      resultado.display_name.toLowerCase().includes('itu') ||
      resultado.display_name.toLowerCase().includes('jundiaí') ||
      this.ehCidadeConhecidaSP(resultado.display_name)
    );


    if (resultadosSP.length > 0) {
      return resultadosSP.slice(0, 6);
    }

    return resultados.slice(0, 6);
  }

  private ehCidadeConhecidaSP(nomeEndereco: string): boolean {
    const cidadesSP = [
      'osasco', 'guarulhos', 'santo andré', 'são bernardo do campo',
      'diadema', 'mauá', 'ribeirão pires', 'são caetano do sul',
      'barueri', 'cotia', 'itaquaquecetuba', 'suzano', 'mogi das cruzes',
      'praia grande', 'são vicente', 'cubatão', 'bertioga',
      'americana', 'piracicaba', 'limeira', 'rio claro'
    ];

    const nomeMinusculo = nomeEndereco.toLowerCase();
    return cidadesSP.some(cidade => nomeMinusculo.includes(cidade));
  }

  private extrairCidade(endereco: ResultadoNominatim | null): string {
    if (!endereco || !endereco.address) {
      return 'São Paulo';
    }


    const address = endereco.address;

    if (address.city) return address.city;
    if (address.town) return address.town;
    if (address.municipality) return address.municipality;
    if (address.village) return address.village;


    const displayName = endereco.display_name.toLowerCase();

    if (displayName.includes('sorocaba')) return 'Sorocaba';
    if (displayName.includes('itu')) return 'Itu';
    if (displayName.includes('campinas')) return 'Campinas';
    if (displayName.includes('santos')) return 'Santos';
    if (displayName.includes('osasco')) return 'Osasco';
    if (displayName.includes('guarulhos')) return 'Guarulhos';

    return 'São Paulo';
  }

  private obterSugestoesMock(consulta: string): ResultadoNominatim[] {
    const consultaMinuscula = consulta.toLowerCase();

    const sugestoesMock: ResultadoNominatim[] = [
      {
        place_id: 1,
        licence: 'mock',
        osm_type: 'way',
        osm_id: 123,
        lat: '-23.5505',
        lon: '-46.6333',
        display_name: 'Praça da Sé, Sé, São Paulo - SP, Brasil',
        address: { city: 'São Paulo', state: 'São Paulo' },
        boundingbox: []
      },
      {
        place_id: 3,
        licence: 'mock',
        osm_type: 'way',
        osm_id: 125,
        lat: '-23.5873',
        lon: '-46.6573',
        display_name: 'Parque Ibirapuera - Vila Mariana, São Paulo - SP, Brasil',
        address: { city: 'São Paulo', state: 'São Paulo' },
        boundingbox: []
      },
      {
        place_id: 4,
        licence: 'mock',
        osm_type: 'way',
        osm_id: 126,
        lat: '-23.502',
        lon: '-47.458',
        display_name: 'Terminal Central, Centro, Sorocaba - SP, Brasil',
        address: { city: 'Sorocaba', state: 'São Paulo' },
        boundingbox: []
      },
      {
        place_id: 5,
        licence: 'mock',
        osm_type: 'way',
        osm_id: 127,
        lat: '-23.264',
        lon: '-47.299',
        display_name: 'Centro Histórico, Itu - SP, Brasil',
        address: { city: 'Itu', state: 'São Paulo' },
        boundingbox: []
      }
    ];

    return sugestoesMock.filter(sugestao =>
      sugestao.display_name.toLowerCase().includes(consultaMinuscula)
    );
  }


  calcularDistancia(
    ponto1: { lat: number, lng: number },
    ponto2: { lat: number, lng: number }
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(ponto2.lat - ponto1.lat);
    const dLng = this.deg2rad(ponto2.lng - ponto1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(ponto1.lat)) * Math.cos(this.deg2rad(ponto2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  ehCoordenadaValidaSP(lat: number, lng: number): boolean {

    const limitesNorte = -19.5;
    const limitesSul = -25.5;
    const limitesLeste = -44.0;
    const limitesOeste = -53.5;

    return lat >= limitesSul && lat <= limitesNorte &&
      lng >= limitesOeste && lng <= limitesLeste;
  }


  obterCidadesPopulares(): { nome: string, lat: number, lng: number }[] {
    return [
      { nome: 'São Paulo - Centro', lat: -23.5505, lng: -46.6333 },
      { nome: 'São Paulo - Paulista', lat: -23.5613, lng: -46.6565 },
      { nome: 'Sorocaba - Centro', lat: -23.502, lng: -47.458 },
      { nome: 'Itu - Centro Histórico', lat: -23.264, lng: -47.299 },
      { nome: 'Campinas - Centro', lat: -22.9056, lng: -47.0608 },
      { nome: 'Santos - Centro', lat: -23.9618, lng: -46.3322 },
      { nome: 'Osasco - Centro', lat: -23.5329, lng: -46.7916 },
      { nome: 'Guarulhos - Centro', lat: -23.4543, lng: -46.5339 }
    ];
  }
}
