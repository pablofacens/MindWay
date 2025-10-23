import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface EstacaoBike {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  bikesDisponiveis: number;
  vagasLivres: number;
  capacidadeTotal: number;
}

interface CityBikesResposta {
  network: {
    stations: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      free_bikes: number;
      empty_slots: number;
    }>;
  };
}

interface CityBikesNetworksResposta {
  networks: Array<{
    id: string;
    name: string;
    location: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
    };
    href: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class CityBikesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.citybik.es/v2';

  
  buscarRedeProxima(latitude: number, longitude: number): Observable<string | null> {
    return this.http.get<CityBikesNetworksResposta>(`${this.baseUrl}/networks`).pipe(
      map(resposta => {
        
        let redeMaisProxima: string | null = null;
        let menorDistancia = Infinity;

        for (const network of resposta.networks) {
          const distancia = this.calcularDistancia(
            latitude,
            longitude,
            network.location.latitude,
            network.location.longitude
          );

          if (distancia < menorDistancia && distancia < 50) { 
            menorDistancia = distancia;
            redeMaisProxima = network.id;
          }
        }

        return redeMaisProxima;
      })
    );
  }

  
  buscarEstacoes(redeId: string): Observable<EstacaoBike[]> {
    return this.http.get<CityBikesResposta>(`${this.baseUrl}/networks/${redeId}`).pipe(
      map(resposta => {
        return resposta.network.stations.map(estacao => ({
          id: estacao.id,
          nome: estacao.name,
          latitude: estacao.latitude,
          longitude: estacao.longitude,
          bikesDisponiveis: estacao.free_bikes,
          vagasLivres: estacao.empty_slots,
          capacidadeTotal: estacao.free_bikes + estacao.empty_slots,
        }));
      })
    );
  }

  
  encontrarEstacaoMaisProxima(
    latitude: number,
    longitude: number,
    estacoes: EstacaoBike[]
  ): EstacaoBike | null {
    let estacaoMaisProxima: EstacaoBike | null = null;
    let menorDistancia = Infinity;

    for (const estacao of estacoes) {
      
      if (estacao.bikesDisponiveis > 0) {
        const distancia = this.calcularDistancia(
          latitude,
          longitude,
          estacao.latitude,
          estacao.longitude
        );

        if (distancia < menorDistancia && distancia < 2) { 
          menorDistancia = distancia;
          estacaoMaisProxima = estacao;
        }
      }
    }

    return estacaoMaisProxima;
  }

  
  encontrarEstacaoParaDevolucao(
    latitude: number,
    longitude: number,
    estacoes: EstacaoBike[]
  ): EstacaoBike | null {
    let estacaoMaisProxima: EstacaoBike | null = null;
    let menorDistancia = Infinity;

    for (const estacao of estacoes) {
      
      if (estacao.vagasLivres > 0) {
        const distancia = this.calcularDistancia(
          latitude,
          longitude,
          estacao.latitude,
          estacao.longitude
        );

        if (distancia < menorDistancia && distancia < 2) { 
          menorDistancia = distancia;
          estacaoMaisProxima = estacao;
        }
      }
    }

    return estacaoMaisProxima;
  }

  
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(graus: number): number {
    return graus * (Math.PI / 180);
  }
}
