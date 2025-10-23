import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap, forkJoin, of, catchError } from 'rxjs';
import { Observable } from 'rxjs';
import { LocalMapa } from '../modelos/local-mapa';
import { RotaCalculada, SegmentoRota } from '../modelos/rota-calculada';
import { TipoRota } from '../modelos/tipo-rota';
import { TipoModal, CONFIGURACOES_MODAIS } from '../modelos/modal';
import { CityBikesService } from './citybikes.service';
import { OverpassService } from './overpass.service';

interface OsrmResposta {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class RotasService {
  private readonly http = inject(HttpClient);
  private readonly cityBikes = inject(CityBikesService);
  private readonly overpass = inject(OverpassService);
  
  private readonly endpointOsrmDriving = 'https://router.project-osrm.org/route/v1/driving';
  private readonly endpointOsrmWalking = 'https://router.project-osrm.org/route/v1/foot';
  private readonly endpointOsrmBike = 'https://router.project-osrm.org/route/v1/bike';

  calcularRota(origem: LocalMapa, destino: LocalMapa, tipoRota: TipoRota = TipoRota.RAPIDO): Observable<RotaCalculada> {
    switch (tipoRota) {
      case TipoRota.RAPIDO:
        return this.calcularRotaRapida(origem, destino);
      case TipoRota.ECONOMICO:
        return this.calcularRotaEconomica(origem, destino);
      case TipoRota.VERDE:
        return this.calcularRotaVerde(origem, destino);
      default:
        return this.calcularRotaRapida(origem, destino);
    }
  }

  private calcularRotaRapida(origem: LocalMapa, destino: LocalMapa): Observable<RotaCalculada> {
    const coordenadas = `${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}`;

    const parametros = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson')
      .set('alternatives', 'false')
      .set('steps', 'false');

    return this.http.get<OsrmResposta>(`${this.endpointOsrmDriving}/${coordenadas}`, {
      params: parametros
    }).pipe(
      map(resposta => {
        const rota = resposta.routes.at(0);

        if (!rota) {
          throw new Error('Nenhuma rota encontrada.');
        }

        const caminho = rota.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

        const segmento: SegmentoRota = {
          modal: TipoModal.CARRO,
          caminho,
          distanciaMetros: rota.distance,
          duracaoSegundos: rota.duration,
          pontoInicio: {
            nome: origem.titulo,
            coordenadas: [origem.latitude, origem.longitude]
          },
          pontoFim: {
            nome: destino.titulo,
            coordenadas: [destino.latitude, destino.longitude]
          },
          instrucoes: 'Siga pela rota mais rápida de carro'
        };

        return {
          distanciaMetros: rota.distance,
          duracaoSegundos: rota.duration,
          caminho,
          segmentos: [segmento],
        } satisfies RotaCalculada;
      })
    );
  }

  private calcularRotaEconomica(origem: LocalMapa, destino: LocalMapa): Observable<RotaCalculada> {
    
    
    
    
    
    
    
    
    
    
    
    
    
    return this.overpass.buscarTransportePublico(origem.latitude, origem.longitude, 500).pipe(
      switchMap(pontosOrigem => {
        if (pontosOrigem.length === 0) {
          
          console.log('Rota ECONÔMICA: Nenhum transporte público encontrado próximo à origem. Usando apenas CAMINHADA.');
          return this.calcularRotaCaminhada(origem, destino);
        }

        console.log(`Rota ECONÔMICA: ${pontosOrigem.length} pontos de transporte encontrados próximo à origem`);

        
        const pontoInicio = this.overpass.encontrarPontoMaisProximo(
          origem.latitude,
          origem.longitude,
          pontosOrigem
        );

        if (!pontoInicio) {
          return this.calcularRotaCaminhada(origem, destino);
        }

        console.log(`→ Ponto de embarque: ${pontoInicio.nome} (${pontoInicio.tipo})`);

        
        return this.overpass.buscarTransportePublico(destino.latitude, destino.longitude, 500).pipe(
          switchMap(pontosDestino => {
            const pontoFim = this.overpass.encontrarPontoMaisProximo(
              destino.latitude,
              destino.longitude,
              pontosDestino
            );

            if (!pontoFim) {
              console.log('→ Nenhum ponto de desembarque encontrado. Usando apenas CAMINHADA.');
              return this.calcularRotaCaminhada(origem, destino);
            }

            console.log(`→ Ponto de desembarque: ${pontoFim.nome} (${pontoFim.tipo})`);

            
            return this.construirRotaMultimodal(origem, destino, pontoInicio, pontoFim);
          }),
          catchError(() => {
            console.log('Erro ao buscar pontos no destino. Usando CAMINHADA.');
            return this.calcularRotaCaminhada(origem, destino);
          })
        );
      }),
      catchError(() => {
        console.log('Erro ao buscar pontos na origem. Usando CAMINHADA.');
        return this.calcularRotaCaminhada(origem, destino);
      })
    );
  }

  
  private construirRotaMultimodal(
    origem: LocalMapa,
    destino: LocalMapa,
    pontoInicio: any,
    pontoFim: any
  ): Observable<RotaCalculada> {
    
    
    
    

    const segmento1$ = this.calcularSegmentoCaminhada(
      origem.latitude, origem.longitude, origem.titulo,
      pontoInicio.latitude, pontoInicio.longitude, pontoInicio.nome
    );

    const segmento2$ = this.calcularSegmentoTransporte(
      pontoInicio,
      pontoFim
    );

    const segmento3$ = this.calcularSegmentoCaminhada(
      pontoFim.latitude, pontoFim.longitude, pontoFim.nome,
      destino.latitude, destino.longitude, destino.titulo
    );

    return forkJoin([segmento1$, segmento2$, segmento3$]).pipe(
      map(([seg1, seg2, seg3]) => {
        const segmentos = [seg1, seg2, seg3];
        const distanciaTotal = segmentos.reduce((acc, seg) => acc + seg.distanciaMetros, 0);
        const duracaoTotal = segmentos.reduce((acc, seg) => acc + seg.duracaoSegundos, 0);
        
        
        const caminhoCompleto = [
          ...seg1.caminho,
          ...seg2.caminho,
          ...seg3.caminho
        ];

        
        const usaTransportePublico = seg2.modal !== TipoModal.CAMINHADA;
        const custoEstimado = usaTransportePublico ? 4.50 : 0;

        
        console.log('📊 ROTA ECONÔMICA CALCULADA:');
        segmentos.forEach((seg, i) => {
          const config = CONFIGURACOES_MODAIS[seg.modal];
          const dist = (seg.distanciaMetros / 1000).toFixed(2);
          const tempo = Math.round(seg.duracaoSegundos / 60);
          console.log(`  ${i + 1}. ${config.icone} ${config.nome}: ${dist}km, ${tempo} min`);
        });
        console.log(`  💰 Custo: R$ ${custoEstimado.toFixed(2)}`);
        console.log(`  📏 Total: ${(distanciaTotal/1000).toFixed(2)}km, ${Math.round(duracaoTotal/60)} min`);

        return {
          distanciaMetros: distanciaTotal,
          duracaoSegundos: duracaoTotal,
          caminho: caminhoCompleto,
          segmentos,
          custoEstimado,
        } satisfies RotaCalculada;
      })
    );
  }

  
  private calcularSegmentoCaminhada(
    latOrigem: number,
    lonOrigem: number,
    nomeOrigem: string,
    latDestino: number,
    lonDestino: number,
    nomeDestino: string
  ): Observable<SegmentoRota> {
    const coordenadas = `${lonOrigem},${latOrigem};${lonDestino},${latDestino}`;

    const parametros = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson');

    return this.http.get<OsrmResposta>(`${this.endpointOsrmWalking}/${coordenadas}`, {
      params: parametros
    }).pipe(
      map(resposta => {
        const rota = resposta.routes.at(0);
        if (!rota) throw new Error('Rota não encontrada');

        const caminho = rota.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

        
        
        const velocidadeKmH = 5; 
        const distanciaKm = rota.distance / 1000;
        const duracaoHoras = distanciaKm / velocidadeKmH;
        const duracaoSegundosRealista = Math.round(duracaoHoras * 3600);

        console.log(`Caminhada: ${distanciaKm.toFixed(2)}km, ${(duracaoSegundosRealista/60).toFixed(0)} min (${velocidadeKmH} km/h)`);

        return {
          modal: TipoModal.CAMINHADA,
          caminho,
          distanciaMetros: rota.distance,
          duracaoSegundos: duracaoSegundosRealista, 
          pontoInicio: {
            nome: nomeOrigem,
            coordenadas: [latOrigem, lonOrigem]
          },
          pontoFim: {
            nome: nomeDestino,
            coordenadas: [latDestino, lonDestino]
          },
          instrucoes: `Caminhe até ${nomeDestino}`
        };
      })
    );
  }

  
  private calcularSegmentoTransporte(pontoInicio: any, pontoFim: any): Observable<SegmentoRota> {
    const coordenadas = `${pontoInicio.longitude},${pontoInicio.latitude};${pontoFim.longitude},${pontoFim.latitude}`;

    const parametros = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson');

    
    return this.http.get<OsrmResposta>(`${this.endpointOsrmDriving}/${coordenadas}`, {
      params: parametros
    }).pipe(
      map(resposta => {
        const rota = resposta.routes.at(0);
        if (!rota) throw new Error('Rota não encontrada');

        const caminho = rota.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

        
        let modal: TipoModal = TipoModal.ONIBUS;
        let velocidadeMedia = 20; 
        
        if (pontoInicio.tipo === 'metro') {
          modal = TipoModal.METRO;
          velocidadeMedia = 40; 
        } else if (pontoInicio.tipo === 'trem') {
          modal = TipoModal.TREM;
          velocidadeMedia = 50; 
        }

        
        const distanciaKm = rota.distance / 1000;
        const duracaoHoras = distanciaKm / velocidadeMedia;
        const duracaoSegundos = Math.round(duracaoHoras * 3600);

        console.log(`Transporte público: ${modal}, ${distanciaKm.toFixed(2)}km, ${(duracaoSegundos/60).toFixed(0)} min (vel: ${velocidadeMedia} km/h)`);

        return {
          modal,
          caminho,
          distanciaMetros: rota.distance,
          duracaoSegundos: duracaoSegundos, 
          pontoInicio: {
            nome: pontoInicio.nome,
            coordenadas: [pontoInicio.latitude, pontoInicio.longitude]
          },
          pontoFim: {
            nome: pontoFim.nome,
            coordenadas: [pontoFim.latitude, pontoFim.longitude]
          },
          instrucoes: `Pegue ${modal === TipoModal.METRO ? 'o metrô' : modal === TipoModal.TREM ? 'o trem' : 'o ônibus'} até ${pontoFim.nome}`
        };
      })
    );
  }

  
  private calcularRotaCaminhada(origem: LocalMapa, destino: LocalMapa): Observable<RotaCalculada> {
    return this.calcularSegmentoCaminhada(
      origem.latitude, origem.longitude, origem.titulo,
      destino.latitude, destino.longitude, destino.titulo
    ).pipe(
      map(segmento => ({
        distanciaMetros: segmento.distanciaMetros,
        duracaoSegundos: segmento.duracaoSegundos,
        caminho: segmento.caminho,
        segmentos: [segmento],
        custoEstimado: 0, 
      }))
    );
  }

  private calcularRotaVerde(origem: LocalMapa, destino: LocalMapa): Observable<RotaCalculada> {
    
    
    
    const distanciaKm = this.calcularDistancia(
      origem.latitude,
      origem.longitude,
      destino.latitude,
      destino.longitude
    );

    console.log(`Rota VERDE: Distância ${distanciaKm.toFixed(2)}km`);

    
    if (distanciaKm < 1) {
      console.log('→ Distância <1km: usando CAMINHADA');
      return this.calcularRotaCaminhada(origem, destino).pipe(
        map(rota => ({
          ...rota,
          emissoesCO2Evitadas: Math.round(distanciaKm * 120), 
        }))
      );
    }

    
    console.log('→ Distância ≥1km: buscando mobilidade sustentável compartilhada');
    
    
    return this.cityBikes.buscarRedeProxima(origem.latitude, origem.longitude).pipe(
      switchMap(redeId => {
        if (!redeId) {
          
          console.log('→ Nenhuma rede de bikes/patinetes compartilhados encontrada.');
          console.log('→ FALLBACK: Sugerindo CAMINHADA (mobilidade 100% sustentável)');
          return this.calcularRotaCaminhada(origem, destino).pipe(
            map(rota => ({
              ...rota,
              emissoesCO2Evitadas: Math.round(distanciaKm * 120),
            }))
          );
        }

        
        return this.cityBikes.buscarEstacoes(redeId).pipe(
          switchMap(estacoes => {
            
            const estacaoOrigem = this.cityBikes.encontrarEstacaoMaisProxima(
              origem.latitude,
              origem.longitude,
              estacoes
            );

            if (!estacaoOrigem || estacaoOrigem.bikesDisponiveis === 0) {
              console.log('→ Nenhuma bike/patinete disponível nas estações próximas.');
              console.log('→ FALLBACK: Sugerindo CAMINHADA (mobilidade 100% sustentável)');
              return this.calcularRotaCaminhada(origem, destino).pipe(
                map(rota => ({
                  ...rota,
                  emissoesCO2Evitadas: Math.round(distanciaKm * 120),
                }))
              );
            }

            
            const estacaoDestino = this.cityBikes.encontrarEstacaoParaDevolucao(
              destino.latitude,
              destino.longitude,
              estacoes
            );

            if (!estacaoDestino || estacaoDestino.vagasLivres === 0) {
              console.log('→ Nenhuma vaga disponível no destino para devolver bike/patinete.');
              console.log('→ FALLBACK: Sugerindo CAMINHADA (mobilidade 100% sustentável)');
              return this.calcularRotaCaminhada(origem, destino).pipe(
                map(rota => ({
                  ...rota,
                  emissoesCO2Evitadas: Math.round(distanciaKm * 120),
                }))
              );
            }

            
            return this.construirRotaBikeCompartilhada(origem, destino, estacaoOrigem, estacaoDestino);
          }),
          catchError(() => {
            console.log('→ Erro ao buscar estações de bikes/patinetes.');
            console.log('→ FALLBACK: Sugerindo CAMINHADA (mobilidade 100% sustentável)');
            return this.calcularRotaCaminhada(origem, destino).pipe(
              map(rota => ({
                ...rota,
                emissoesCO2Evitadas: Math.round(distanciaKm * 120),
              }))
            );
          })
        );
      }),
      catchError(() => {
        console.log('→ Erro ao buscar rede de bikes/patinetes.');
        console.log('→ FALLBACK: Sugerindo CAMINHADA (mobilidade 100% sustentável)');
        return this.calcularRotaCaminhada(origem, destino).pipe(
          map(rota => ({
            ...rota,
            emissoesCO2Evitadas: Math.round(distanciaKm * 120),
          }))
        );
      })
    );
  }

  
  private construirRotaBikeCompartilhada(
    origem: LocalMapa,
    destino: LocalMapa,
    estacaoOrigem: any,
    estacaoDestino: any
  ): Observable<RotaCalculada> {
    
    
    
    

    const segmento1$ = this.calcularSegmentoCaminhada(
      origem.latitude, origem.longitude, origem.titulo,
      estacaoOrigem.latitude, estacaoOrigem.longitude, estacaoOrigem.nome
    );

    const segmento2$ = this.calcularSegmentoBike(
      estacaoOrigem.latitude, estacaoOrigem.longitude, estacaoOrigem.nome,
      estacaoDestino.latitude, estacaoDestino.longitude, estacaoDestino.nome,
      TipoModal.BICICLETA_COMPARTILHADA
    );

    const segmento3$ = this.calcularSegmentoCaminhada(
      estacaoDestino.latitude, estacaoDestino.longitude, estacaoDestino.nome,
      destino.latitude, destino.longitude, destino.titulo
    );

    return forkJoin([segmento1$, segmento2$, segmento3$]).pipe(
      map(([seg1, seg2, seg3]) => {
        const segmentos = [seg1, seg2, seg3];
        const distanciaTotal = segmentos.reduce((acc, seg) => acc + seg.distanciaMetros, 0);
        const duracaoTotal = segmentos.reduce((acc, seg) => acc + seg.duracaoSegundos, 0);
        
        const caminhoCompleto = [
          ...seg1.caminho,
          ...seg2.caminho,
          ...seg3.caminho
        ];

        const distanciaKm = distanciaTotal / 1000;
        const emissoesCO2Evitadas = Math.round(distanciaKm * 120);

        
        console.log('📊 ROTA VERDE CALCULADA (Bikes Compartilhadas):');
        console.log(`  🚴 Estação origem: ${estacaoOrigem.nome} (${estacaoOrigem.bikesDisponiveis} bikes disponíveis)`);
        console.log(`  🚴 Estação destino: ${estacaoDestino.nome} (${estacaoDestino.vagasLivres} vagas livres)`);
        segmentos.forEach((seg, i) => {
          const config = CONFIGURACOES_MODAIS[seg.modal];
          const dist = (seg.distanciaMetros / 1000).toFixed(2);
          const tempo = Math.round(seg.duracaoSegundos / 60);
          console.log(`  ${i + 1}. ${config.icone} ${config.nome}: ${dist}km, ${tempo} min`);
        });
        console.log(`  🌱 CO₂ evitado: ${emissoesCO2Evitadas}g`);
        console.log(`  📏 Total: ${distanciaKm.toFixed(2)}km, ${Math.round(duracaoTotal/60)} min`);

        return {
          distanciaMetros: distanciaTotal,
          duracaoSegundos: duracaoTotal,
          caminho: caminhoCompleto,
          segmentos,
          emissoesCO2Evitadas,
        } satisfies RotaCalculada;
      })
    );
  }

  
  private calcularRotaBicicletaPropria(origem: LocalMapa, destino: LocalMapa): Observable<RotaCalculada> {
    return this.calcularSegmentoBike(
      origem.latitude, origem.longitude, origem.titulo,
      destino.latitude, destino.longitude, destino.titulo,
      TipoModal.BICICLETA
    ).pipe(
      map(segmento => {
        const distanciaKm = segmento.distanciaMetros / 1000;
        const emissoesCO2Evitadas = Math.round(distanciaKm * 120);

        console.log('📊 ROTA VERDE CALCULADA (Bicicleta Própria):');
        console.log(`  🚴 ${(distanciaKm).toFixed(2)}km, ${Math.round(segmento.duracaoSegundos/60)} min`);
        console.log(`  🌱 CO₂ evitado: ${emissoesCO2Evitadas}g`);

        return {
          distanciaMetros: segmento.distanciaMetros,
          duracaoSegundos: segmento.duracaoSegundos,
          caminho: segmento.caminho,
          segmentos: [segmento],
          emissoesCO2Evitadas,
        };
      })
    );
  }

  
  private calcularSegmentoBike(
    latOrigem: number,
    lonOrigem: number,
    nomeOrigem: string,
    latDestino: number,
    lonDestino: number,
    nomeDestino: string,
    modal: TipoModal.BICICLETA | TipoModal.BICICLETA_COMPARTILHADA
  ): Observable<SegmentoRota> {
    const coordenadas = `${lonOrigem},${latOrigem};${lonDestino},${latDestino}`;

    const parametros = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson');

    return this.http.get<OsrmResposta>(`${this.endpointOsrmBike}/${coordenadas}`, {
      params: parametros
    }).pipe(
      map(resposta => {
        const rota = resposta.routes.at(0);
        if (!rota) throw new Error('Rota não encontrada');

        const caminho = rota.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

        
        
        const velocidadeRealistaKmH = 13; 
        const distanciaKm = rota.distance / 1000;
        const duracaoHoras = distanciaKm / velocidadeRealistaKmH;
        const duracaoSegundosRealista = Math.round(duracaoHoras * 3600);

        console.log(`Bike: ${distanciaKm.toFixed(2)}km, ${(duracaoSegundosRealista/60).toFixed(0)} min (OSRM: ${(rota.duration/60).toFixed(0)} min) - corrigido para ${velocidadeRealistaKmH} km/h`);

        const instrucao = modal === TipoModal.BICICLETA_COMPARTILHADA
          ? `Vá de bike compartilhada até ${nomeDestino}`
          : `Vá de bicicleta até ${nomeDestino}`;

        return {
          modal,
          caminho,
          distanciaMetros: rota.distance,
          duracaoSegundos: duracaoSegundosRealista, 
          pontoInicio: {
            nome: nomeOrigem,
            coordenadas: [latOrigem, lonOrigem]
          },
          pontoFim: {
            nome: nomeDestino,
            coordenadas: [latDestino, lonDestino]
          },
          instrucoes: instrucao
        };
      })
    );
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
