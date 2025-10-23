import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, timeout, retry, delay } from 'rxjs/operators';
import { PontoInteresse, CategoriaPOI } from '../modelos/ponto-interesse';


@Injectable({
  providedIn: 'root'
})
export class POIService {
  private readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
  private readonly BUFFER_METROS = 200; 
  private readonly TIMEOUT_MS = 15000; 
  private readonly MAX_BBOX_SIZE = 0.02; 

  private http = inject(HttpClient);
  
  
  private cachePOIs = new Map<string, { pois: PontoInteresse[], timestamp: number }>();
  private readonly CACHE_DURATION = 300000; 
  
  
  private ultimaRequisicao = 0;
  private readonly MIN_INTERVALO = 2000; 

  
  buscarPOIsAoLongoRota(coordenadasRota: [number, number][]): Observable<PontoInteresse[]> {
    if (!coordenadasRota || coordenadasRota.length === 0) {
      return of([]);
    }

    
    const bbox = this.calcularBoundingBox(coordenadasRota);

    
    const cacheKey = bbox;
    const cached = this.cachePOIs.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('✅ POIs do cache (5min)');
      return of(cached.pois);
    }

    
    if (!this.validarBBox(bbox)) {
      console.warn('⚠️ Área de busca muito grande, limitando POIs...');
      return of([]); 
    }
    
    
    const agora = Date.now();
    const tempoDesdeUltima = agora - this.ultimaRequisicao;
    if (tempoDesdeUltima < this.MIN_INTERVALO) {
      console.warn(`⏳ Aguardando ${this.MIN_INTERVALO - tempoDesdeUltima}ms (rate limit)...`);
      return of([]);
    }
    
    this.ultimaRequisicao = agora;

    console.log('🔍 Iniciando busca de POIs...');

    
    return forkJoin({
      agua: this.buscarPOIsAgua(bbox).pipe(delay(100)),
      descanso: this.buscarPOIsDescanso(bbox).pipe(delay(200)),
      saude: this.buscarPOIsSaude(bbox).pipe(delay(300)),
      banheiro: this.buscarPOIsBanheiro(bbox).pipe(delay(400)),
      referencia: this.buscarPOIsReferencia(bbox).pipe(delay(500)),
    }).pipe(
      map(resultado => {
        const total = [
          ...resultado.agua,
          ...resultado.descanso,
          ...resultado.saude,
          ...resultado.banheiro,
          ...resultado.referencia,
        ];
        console.log(`✅ Total de POIs encontrados: ${total.length}`);
        
        
        this.cachePOIs.set(cacheKey, { pois: total, timestamp: Date.now() });
        
        return total;
      }),
      catchError(erro => {
        console.error('❌ Erro ao buscar POIs:', erro);
        return of([]);
      })
    );
  }

  
  private validarBBox(bbox: string): boolean {
    const [minLat, minLon, maxLat, maxLon] = bbox.split(',').map(Number);
    const diffLat = maxLat - minLat;
    const diffLon = maxLon - minLon;
    
    return diffLat <= this.MAX_BBOX_SIZE && diffLon <= this.MAX_BBOX_SIZE;
  }

  
  private buscarPOIsAgua(bbox: string): Observable<PontoInteresse[]> {
    
    const query = `[out:json][timeout:10];(node["amenity"="drinking_water"](${bbox});node["amenity"="fountain"]["drinking_water"="yes"](${bbox}););out body 50;`;

    return this.executarQuery(query).pipe(
      map(elementos => this.converterParaPOIs(elementos, CategoriaPOI.AGUA))
    );
  }

  
  private buscarPOIsDescanso(bbox: string): Observable<PontoInteresse[]> {
    
    const query = `[out:json][timeout:10];(node["amenity"="bench"](${bbox});node["leisure"="park"]["name"](${bbox}););out body 50;`;

    return this.executarQuery(query).pipe(
      map(elementos => this.converterParaPOIs(elementos, CategoriaPOI.DESCANSO))
    );
  }

  
  private buscarPOIsSaude(bbox: string): Observable<PontoInteresse[]> {
    
    const query = `[out:json][timeout:10];(node["amenity"="hospital"](${bbox});node["amenity"="clinic"](${bbox});node["amenity"="pharmacy"](${bbox}););out body 30;`;

    return this.executarQuery(query).pipe(
      map(elementos => this.converterParaPOIs(elementos, CategoriaPOI.SAUDE))
    );
  }

  
  private buscarPOIsBanheiro(bbox: string): Observable<PontoInteresse[]> {
    
    const query = `[out:json][timeout:10];(node["amenity"="toilets"]["access"!="private"](${bbox}););out body 30;`;

    return this.executarQuery(query).pipe(
      map(elementos => this.converterParaPOIs(elementos, CategoriaPOI.BANHEIRO))
    );
  }

  
  private buscarPOIsReferencia(bbox: string): Observable<PontoInteresse[]> {
    
    const query = `[out:json][timeout:10];(
      node["tourism"="museum"]["name"](${bbox});
      node["tourism"="attraction"]["name"](${bbox});
      node["tourism"="artwork"]["name"]["artwork_type"="statue"](${bbox});
      node["historic"="monument"]["name"](${bbox});
      node["amenity"="theatre"]["name"](${bbox});
      node["amenity"="university"]["name"](${bbox});
      node["leisure"="stadium"]["name"](${bbox});
      node["shop"="mall"]["name"](${bbox});
    );out body 40;`;

    return this.executarQuery(query).pipe(
      map(elementos => this.converterParaPOIs(elementos, CategoriaPOI.REFERENCIA))
    );
  }

  
  private executarQuery(query: string): Observable<any[]> {
    console.log('🔍 Query Overpass:', query.substring(0, 100) + '...');
    
    
    const body = new URLSearchParams();
    body.set('data', query);

    return this.http.post<{ elements: any[] }>(
      this.OVERPASS_URL, 
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    ).pipe(
      timeout(this.TIMEOUT_MS), 
      retry({ count: 1, delay: 1000 }), 
      map(resposta => {
        const total = resposta.elements?.length || 0;
        console.log(`✅ Overpass retornou ${total} elementos`);
        return resposta.elements || [];
      }),
      catchError((erro: any) => {
        if (erro.status === 504 || erro.status === 429) {
          console.warn('⚠️ Overpass API sobrecarregada (504/429), ignorando categoria...');
        } else if (erro.name === 'TimeoutError') {
          console.warn('⚠️ Timeout na query Overpass (>15s), ignorando categoria...');
        } else {
          console.error('❌ Erro Overpass:', erro.status || erro.name, erro.message);
        }
        return of([]); 
      })
    );
  }

  
  private converterParaPOIs(elementos: any[], categoria: CategoriaPOI): PontoInteresse[] {
    return elementos
      .filter(el => el.lat && el.lon) 
      .map(el => ({
        id: `${categoria}-${el.id}`,
        nome: el.tags?.name || this.gerarNomePadrao(categoria, el.tags),
        categoria,
        latitude: el.lat || el.center?.lat,
        longitude: el.lon || el.center?.lon,
        descricao: this.gerarDescricao(el.tags),
      }));
  }

  
  private gerarNomePadrao(categoria: CategoriaPOI, tags: any): string {
    switch (categoria) {
      case CategoriaPOI.AGUA:
        if (tags?.amenity === 'fountain') return 'Chafariz';
        if (tags?.amenity === 'water_point') return 'Ponto de Água';
        return 'Bebedouro';
      case CategoriaPOI.DESCANSO:
        if (tags?.leisure === 'park') return 'Parque';
        if (tags?.leisure === 'garden') return 'Jardim';
        return 'Banco para descanso';
      case CategoriaPOI.SAUDE:
        if (tags?.amenity === 'hospital') return 'Hospital';
        if (tags?.amenity === 'pharmacy') return 'Farmácia';
        if (tags?.amenity === 'clinic') return 'Clínica';
        if (tags?.emergency === 'defibrillator') return 'Desfibrilador (AED)';
        return 'Posto de Saúde';
      case CategoriaPOI.BANHEIRO:
        return 'Banheiro Público';
      case CategoriaPOI.REFERENCIA:
        if (tags?.tourism === 'museum') return 'Museu';
        if (tags?.tourism === 'attraction') return 'Atração Turística';
        if (tags?.historic === 'monument') return 'Monumento';
        if (tags?.amenity === 'theatre') return 'Teatro';
        if (tags?.amenity === 'university') return 'Universidade';
        if (tags?.leisure === 'stadium') return 'Estádio';
        if (tags?.shop === 'mall') return 'Shopping Center';
        return 'Ponto de Referência';
      default:
        return 'Ponto de Interesse';
    }
  }

  
  private gerarDescricao(tags: any): string | undefined {
    if (!tags) return undefined;
    
    const partes: string[] = [];
    
    if (tags.operator) partes.push(`Operador: ${tags.operator}`);
    if (tags.opening_hours) partes.push(`Horário: ${tags.opening_hours}`);
    if (tags.access === 'yes') partes.push('Acesso público');
    if (tags.wheelchair === 'yes') partes.push('Acessível');
    if (tags.fee === 'no') partes.push('Gratuito');
    
    return partes.length > 0 ? partes.join(' • ') : undefined;
  }

  
  private calcularBoundingBox(coordenadas: [number, number][]): string {
    const lats = coordenadas.map(c => c[0]);
    const lons = coordenadas.map(c => c[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    
    const buffer = 0.002;

    
    const diffLat = Math.min(maxLat - minLat + 2 * buffer, this.MAX_BBOX_SIZE);
    const diffLon = Math.min(maxLon - minLon + 2 * buffer, this.MAX_BBOX_SIZE);

    const centroLat = (minLat + maxLat) / 2;
    const centroLon = (minLon + maxLon) / 2;

    const bbox = `${centroLat - diffLat/2},${centroLon - diffLon/2},${centroLat + diffLat/2},${centroLon + diffLon/2}`;
    console.log('📦 BBox:', bbox, `(${(diffLat * 111).toFixed(1)}km x ${(diffLon * 111).toFixed(1)}km)`);
    
    return bbox;
  }

  
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; 
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
  }
}
