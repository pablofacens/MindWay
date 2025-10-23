import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LocalMapa } from '../modelos/local-mapa';

interface NominatimResposta {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class GeocodificacaoService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://nominatim.openstreetmap.org/search';

  buscarSugestoes(consulta: string): Observable<LocalMapa[]> {
    const parametros = new HttpParams()
      .set('format', 'jsonv2')
      .set('q', consulta)
      .set('addressdetails', '1')
      .set('limit', '5')
      .set('dedupe', '1');

    return this.http.get<NominatimResposta[]>(this.endpoint, {
      params: parametros
    }).pipe(
      map(respostas => respostas.map(resposta => ({
        id: String(resposta.place_id),
        titulo: resposta.display_name,
        descricao: this.comporDescricao(resposta),
        latitude: Number(resposta.lat),
        longitude: Number(resposta.lon)
      })))
    );
  }

  private comporDescricao(resposta: NominatimResposta): string {
    if (!resposta.address) {
      return resposta.display_name;
    }

    const partesInteressantes = [
      resposta.address['road'],
      resposta.address['neighbourhood'],
      resposta.address['city'],
      resposta.address['state'],
    ].filter(Boolean);

    if (partesInteressantes.length === 0) {
      return resposta.display_name;
    }

    return partesInteressantes.join(', ');
  }
}
