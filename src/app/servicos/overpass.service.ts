import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface PontoTransporte {
  id: number;
  tipo: 'onibus' | 'metro' | 'trem';
  nome: string;
  latitude: number;
  longitude: number;
}

interface OverpassElemento {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    'public_transport'?: string;
    railway?: string;
    highway?: string;
    station?: string;
  };
}

interface OverpassResposta {
  elements: OverpassElemento[];
}

@Injectable({ providedIn: 'root' })
export class OverpassService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://overpass-api.de/api/interpreter';

  
  buscarPontosOnibus(latitude: number, longitude: number, raioMetros: number = 500): Observable<PontoTransporte[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["highway"="bus_stop"](around:${raioMetros},${latitude},${longitude});
        node["public_transport"="platform"]["bus"="yes"](around:${raioMetros},${latitude},${longitude});
      );
      out body;
    `;

    return this.http.post<OverpassResposta>(this.endpoint, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      map(resposta => {
        return resposta.elements.map(elemento => ({
          id: elemento.id,
          tipo: 'onibus' as const,
          nome: elemento.tags?.name || 'Ponto de Ônibus',
          latitude: elemento.lat,
          longitude: elemento.lon,
        }));
      })
    );
  }

  
  buscarEstacoesMetro(latitude: number, longitude: number, raioMetros: number = 1000): Observable<PontoTransporte[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["railway"="station"]["station"="subway"](around:${raioMetros},${latitude},${longitude});
        node["railway"="subway_entrance"](around:${raioMetros},${latitude},${longitude});
      );
      out body;
    `;

    return this.http.post<OverpassResposta>(this.endpoint, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      map(resposta => {
        return resposta.elements.map(elemento => ({
          id: elemento.id,
          tipo: 'metro' as const,
          nome: elemento.tags?.name || 'Estação de Metrô',
          latitude: elemento.lat,
          longitude: elemento.lon,
        }));
      })
    );
  }

  
  buscarEstacoesTrem(latitude: number, longitude: number, raioMetros: number = 1000): Observable<PontoTransporte[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["railway"="station"]["station"="light_rail"](around:${raioMetros},${latitude},${longitude});
        node["railway"="halt"](around:${raioMetros},${latitude},${longitude});
      );
      out body;
    `;

    return this.http.post<OverpassResposta>(this.endpoint, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      map(resposta => {
        return resposta.elements.map(elemento => ({
          id: elemento.id,
          tipo: 'trem' as const,
          nome: elemento.tags?.name || 'Estação de Trem',
          latitude: elemento.lat,
          longitude: elemento.lon,
        }));
      })
    );
  }

  
  buscarTransportePublico(latitude: number, longitude: number, raioMetros: number = 500): Observable<PontoTransporte[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["highway"="bus_stop"](around:${raioMetros},${latitude},${longitude});
        node["railway"="station"](around:${raioMetros},${latitude},${longitude});
        node["railway"="subway_entrance"](around:${raioMetros},${latitude},${longitude});
      );
      out body;
    `;

    return this.http.post<OverpassResposta>(this.endpoint, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      map(resposta => {
        return resposta.elements.map(elemento => {
          let tipo: 'onibus' | 'metro' | 'trem' = 'onibus';
          
          if (elemento.tags?.railway === 'station' && elemento.tags?.station === 'subway') {
            tipo = 'metro';
          } else if (elemento.tags?.railway === 'subway_entrance') {
            tipo = 'metro';
          } else if (elemento.tags?.railway === 'station') {
            tipo = 'trem';
          }

          return {
            id: elemento.id,
            tipo,
            nome: elemento.tags?.name || `Ponto de ${tipo}`,
            latitude: elemento.lat,
            longitude: elemento.lon,
          };
        });
      })
    );
  }

  
  encontrarPontoMaisProximo(
    latitude: number,
    longitude: number,
    pontos: PontoTransporte[]
  ): PontoTransporte | null {
    if (pontos.length === 0) return null;

    let pontoMaisProximo = pontos[0];
    let menorDistancia = this.calcularDistancia(
      latitude,
      longitude,
      pontos[0].latitude,
      pontos[0].longitude
    );

    for (const ponto of pontos.slice(1)) {
      const distancia = this.calcularDistancia(
        latitude,
        longitude,
        ponto.latitude,
        ponto.longitude
      );

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        pontoMaisProximo = ponto;
      }
    }

    return pontoMaisProximo;
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
