import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PontoElevacao, PerfilElevacao } from '../modelos/elevacao';


const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';

interface OpenElevationResponse {
  results: Array<{
    latitude: number;
    longitude: number;
    elevation: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ElevacaoService {
  private readonly http = inject(HttpClient);

  
  buscarElevacao(coordenadas: [number, number][]): Observable<PerfilElevacao> {
    if (!coordenadas || coordenadas.length === 0) {
      return of(this.perfilVazio());
    }

    
    
    const pontosAmostra = this.amostrarPontos(coordenadas, 100);

    const locations = pontosAmostra.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));

    console.log(`🏔️ Elevation: Buscando elevação de ${pontosAmostra.length} pontos...`);

    return this.http.post<OpenElevationResponse>(
      OPEN_ELEVATION_URL,
      { locations }
    ).pipe(
      map(resposta => {
        console.log('✅ Elevation: Dados recebidos', resposta.results.length, 'pontos');
        return this.calcularPerfil(resposta.results, coordenadas);
      }),
      catchError(erro => {
        console.error('❌ Elevation: Erro ao buscar dados', erro);
        
        
        return of(this.perfilVazio());
      })
    );
  }

  
  private amostrarPontos(
    coordenadas: [number, number][],
    maxPontos: number
  ): [number, number][] {
    if (coordenadas.length <= maxPontos) {
      return coordenadas;
    }

    const intervalo = Math.ceil(coordenadas.length / maxPontos);
    const amostra: [number, number][] = [];

    for (let i = 0; i < coordenadas.length; i += intervalo) {
      amostra.push(coordenadas[i]);
    }

    
    if (amostra[amostra.length - 1] !== coordenadas[coordenadas.length - 1]) {
      amostra.push(coordenadas[coordenadas.length - 1]);
    }

    return amostra;
  }

  
  private calcularPerfil(
    resultados: OpenElevationResponse['results'],
    coordenadasOriginais: [number, number][]
  ): PerfilElevacao {
    const pontos: PontoElevacao[] = resultados.map(r => ({
      latitude: r.latitude,
      longitude: r.longitude,
      elevacao: r.elevation,
    }));

    if (pontos.length === 0) {
      return this.perfilVazio();
    }

    
    const elevacoes = pontos.map(p => p.elevacao);
    const elevacaoMinima = Math.min(...elevacoes);
    const elevacaoMaxima = Math.max(...elevacoes);

    
    let ganhoElevacao = 0;
    let perdaElevacao = 0;

    for (let i = 1; i < pontos.length; i++) {
      const diff = pontos[i].elevacao - pontos[i - 1].elevacao;
      
      if (diff > 0) {
        ganhoElevacao += diff;
      } else {
        perdaElevacao += Math.abs(diff);
      }
    }

    
    const distanciaTotal = this.calcularDistanciaTotal(coordenadasOriginais);

    const perfil: PerfilElevacao = {
      pontos,
      elevacaoMinima,
      elevacaoMaxima,
      ganhoElevacao,
      perdaElevacao,
      distanciaTotal,
    };

    console.log('📊 Perfil de Elevação:', {
      pontos: pontos.length,
      min: elevacaoMinima.toFixed(0) + 'm',
      max: elevacaoMaxima.toFixed(0) + 'm',
      subida: ganhoElevacao.toFixed(0) + 'm',
      descida: perdaElevacao.toFixed(0) + 'm',
      distancia: distanciaTotal.toFixed(1) + 'km',
    });

    return perfil;
  }

  
  private calcularDistanciaTotal(coordenadas: [number, number][]): number {
    let distanciaTotal = 0;

    for (let i = 1; i < coordenadas.length; i++) {
      const [lat1, lng1] = coordenadas[i - 1];
      const [lat2, lng2] = coordenadas[i];
      
      distanciaTotal += this.calcularDistanciaHaversine(lat1, lng1, lat2, lng2);
    }

    return distanciaTotal;
  }

  
  private calcularDistanciaHaversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; 
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  
  private perfilVazio(): PerfilElevacao {
    return {
      pontos: [],
      elevacaoMinima: 0,
      elevacaoMaxima: 0,
      ganhoElevacao: 0,
      perdaElevacao: 0,
      distanciaTotal: 0,
    };
  }
}
