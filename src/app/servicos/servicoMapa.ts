import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ServicoChavesApi } from './servicoChavesApi';

declare var maplibregl: any;

interface CoordenadaCaminho {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicoMapa {
  private mapa: any;
  private mapaInicializadoSubject = new BehaviorSubject<boolean>(false);
  mapaInicializado$ = this.mapaInicializadoSubject.asObservable();
  private primeiroIdSimbolo: string | undefined;

  private servicoChavesApi = inject(ServicoChavesApi);

  constructor() { }

  inicializarMapa(idContainer: string): void {
    if (this.mapa) return;
    const chaveMapTiler = this.servicoChavesApi.obterChaveApi('mapTiler');

    
    const estiloMapa = chaveMapTiler && !chaveMapTiler.startsWith('SUA_CHAVE')
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${chaveMapTiler}`
      : 'https://demotiles.maplibre.org/style.json';

    this.mapa = new maplibregl.Map({
      container: idContainer,
      style: estiloMapa,
      center: [-46.633309, -23.55052], 
      zoom: 10,
      pitch: 0,
      bearing: 0,
      hash: true,
      interactive: true,
      attributionControl: false,
      customAttribution: '&copy; OpenStreetMap contributors | MobiUrb'
    });


    this.mapa.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.mapa.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    
    this.mapa.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    this.mapa.on('load', () => {
      this.mapaInicializadoSubject.next(true);
      this.adicionarFontesECamadas();
      console.log('Mapa carregado com sucesso');
    });

    this.mapa.on('error', (erro: any) => {
      console.error('Erro no mapa:', erro);
    });
  }

  private adicionarFontesECamadas(): void {
    
    this.mapa.addSource('estacoes-bicicleta', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    this.mapa.addSource('onibus', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

  
    this.mapa.addSource('linha-rota', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

   
    const camadas = this.mapa.getStyle().layers;
    for (const camada of camadas) {
      if (camada.type === 'symbol') {
        this.primeiroIdSimbolo = camada.id;
        break;
      }
    }

  
    this.mapa.addLayer({
      id: 'camada-linha-rota',
      type: 'line',
      source: 'linha-rota',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['get', 'cor'],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 4,
          14, 8,
          18, 12
        ],
        'line-opacity': 0.8
      }
    }, this.primeiroIdSimbolo);

    
    this.mapa.addSource('marcador-origem', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.mapa.addSource('marcador-destino', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    
    this.mapa.addLayer({
      id: 'camada-marcador-origem',
      type: 'circle',
      source: 'marcador-origem',
      paint: {
        'circle-radius': 8,
        'circle-color': '#22c55e',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 3,
        'circle-opacity': 0.9
      }
    });

    this.mapa.addLayer({
      id: 'camada-marcador-destino',
      type: 'circle',
      source: 'marcador-destino',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 3,
        'circle-opacity': 0.9
      }
    });
  }

  desenharRota(caminho: CoordenadaCaminho[], cor: string): void {
    if (!this.mapaInicializadoSubject.getValue()) return;

    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { cor: cor },
          geometry: {
            type: 'LineString',
            coordinates: caminho.map(coord => [coord.lng, coord.lat])
          }
        }
      ]
    };

    this.mapa.getSource('linha-rota').setData(geojson);
  }

  limparRota(): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    this.mapa.getSource('linha-rota').setData({
      type: 'FeatureCollection',
      features: []
    });
  }

  adicionarMarcador(idFonte: string, coordenadas: { lat: number, lng: number }): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [coordenadas.lng, coordenadas.lat]
          },
          properties: {}
        }
      ]
    };

    this.mapa.getSource(idFonte).setData(geojson);
  }

  limparMarcadores(): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    const fontesVazias = {
      type: 'FeatureCollection',
      features: []
    };

    this.mapa.getSource('marcador-origem').setData(fontesVazias);
    this.mapa.getSource('marcador-destino').setData(fontesVazias);
  }

  ajustarVisao(origem: { lat: number, lng: number }, destino: { lat: number, lng: number }): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    const limites = new maplibregl.LngLatBounds(
      [origem.lng, origem.lat], 
      [destino.lng, destino.lat]
    );
    
    this.mapa.fitBounds(limites, { 
      padding: 80, 
      pitch: 30,
      duration: 1500
    });
  }

  alternarCamadaEstacoesBicicleta(mostrar: boolean, estacoes: any[] = []): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    if (mostrar) {
      const geojson = {
        'type': 'FeatureCollection',
        'features': estacoes.map(estacao => ({
          'type': 'Feature',
          'geometry': { 
            'type': 'Point', 
            'coordinates': [estacao.lon || estacao.lng, estacao.lat] 
          },
          'properties': { 
            'nome': estacao.nome,
            'bicicletas': estacao.bicicletas_disponiveis || estacao.num_bikes_available || 0,
            'vagas': estacao.vagas_disponiveis || estacao.num_docks_available || 0,
            'sistema': estacao.sistema || 'Municipal'
          }
        }))
      };

      this.mapa.getSource('estacoes-bicicleta').setData(geojson);

      
      if (!this.mapa.getLayer('camada-estacoes-bicicleta')) {
        this.mapa.addLayer({
          'id': 'camada-estacoes-bicicleta',
          'type': 'circle',
          'source': 'estacoes-bicicleta',
          'paint': {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 4,
              12, 6,
              16, 10
            ],
            'circle-color': '#22c55e',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
            'circle-opacity': 0.8
          }
        });

        
        this.mapa.on('click', 'camada-estacoes-bicicleta', (e: any) => {
          const coordenadas = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          
          const html = `
            <div class="p-3">
              <h3 class="font-bold text-green-700">${props.nome}</h3>
              <div class="mt-2 space-y-1 text-sm">
                <div>🚲 <strong>${props.bicicletas}</strong> bicicletas</div>
                <div>🅿️ <strong>${props.vagas}</strong> vagas</div>
                <div class="text-xs text-gray-600">${props.sistema}</div>
              </div>
            </div>
          `;
          
          new maplibregl.Popup({ closeButton: true, closeOnClick: false })
            .setLngLat(coordenadas)
            .setHTML(html)
            .addTo(this.mapa);
        });

        
        this.mapa.on('mouseenter', 'camada-estacoes-bicicleta', () => {
          this.mapa.getCanvas().style.cursor = 'pointer';
        });
        
        this.mapa.on('mouseleave', 'camada-estacoes-bicicleta', () => {
          this.mapa.getCanvas().style.cursor = '';
        });
      }
      
      this.mapa.setLayoutProperty('camada-estacoes-bicicleta', 'visibility', 'visible');
    } else {
      if (this.mapa.getLayer('camada-estacoes-bicicleta')) {
        this.mapa.setLayoutProperty('camada-estacoes-bicicleta', 'visibility', 'none');
      }
    }
  }

  alternarCamadaTransito(mostrar: boolean): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    if (mostrar) {
      const chaveHere = this.servicoChavesApi.obterChaveApi('hereMaps');
      
      if (!chaveHere || chaveHere.startsWith('SUA_CHAVE')) {
        console.warn('Chave da API HERE não configurada para trânsito');
        return;
      }
      
      if (!this.mapa.getSource('fonte-transito')) {
        this.mapa.addSource('fonte-transito', {
          'type': 'raster',
          'tiles': [`https://2.traffic.maps.ls.hereapi.com/maptile/2.1/traffictile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${chaveHere}`],
          'tileSize': 256
        });
        
        this.mapa.addLayer({
          'id': 'camada-transito',
          'type': 'raster',
          'source': 'fonte-transito',
          'paint': {
            'raster-opacity': 0.7
          }
        }, this.primeiroIdSimbolo);
      }
      
      this.mapa.setLayoutProperty('camada-transito', 'visibility', 'visible');
    } else {
      if (this.mapa.getLayer('camada-transito')) {
        this.mapa.setLayoutProperty('camada-transito', 'visibility', 'none');
      }
    }
  }

  alternarCamadaOnibus(mostrar: boolean, linhasOnibus: any[] = []): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    if (mostrar) {
      const geojson = {
        'type': 'FeatureCollection',
        'features': linhasOnibus.map(linha => ({
          'type': 'Feature',
          'geometry': { 
            'type': 'Point', 
            'coordinates': [linha.lng || linha.lon, linha.lat] 
          },
          'properties': { 
            'numero': linha.numero,
            'nome': linha.nome,
            'empresa': linha.empresa,
            'tarifa': linha.tarifa,
            'tipo': linha.tipo,
            'intervalo': linha.intervalo || 'N/A'
          }
        }))
      };

      this.mapa.getSource('onibus').setData(geojson);

      if (!this.mapa.getLayer('camada-onibus')) {
        this.mapa.addLayer({
          'id': 'camada-onibus',
          'type': 'circle',
          'source': 'onibus',
          'paint': {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 5,
              12, 7,
              16, 12
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'tipo'], 'municipal'], '#f59e0b',
              ['==', ['get', 'tipo'], 'metropolitano'], '#3b82f6',
              ['==', ['get', 'tipo'], 'intermunicipal'], '#8b5cf6',
              '#6b7280'
            ],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
            'circle-opacity': 0.9
          }
        });

        
        this.mapa.on('click', 'camada-onibus', (e: any) => {
          const coordenadas = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          
          const html = `
            <div class="p-3">
              <h3 class="font-bold text-yellow-700">Linha ${props.numero}</h3>
              <div class="mt-2 space-y-1 text-sm">
                <div><strong>${props.nome}</strong></div>
                <div>💰 R$ ${props.tarifa.toFixed(2)}</div>
                <div>🏢 ${props.empresa}</div>
                <div>⏱️ ${props.intervalo}</div>
                <div class="text-xs text-gray-600 capitalize">${props.tipo}</div>
              </div>
            </div>
          `;
          
          new maplibregl.Popup({ closeButton: true, closeOnClick: false })
            .setLngLat(coordenadas)
            .setHTML(html)
            .addTo(this.mapa);
        });

        this.mapa.on('mouseenter', 'camada-onibus', () => {
          this.mapa.getCanvas().style.cursor = 'pointer';
        });
        
        this.mapa.on('mouseleave', 'camada-onibus', () => {
          this.mapa.getCanvas().style.cursor = '';
        });
      }
      
      this.mapa.setLayoutProperty('camada-onibus', 'visibility', 'visible');
    } else {
      if (this.mapa.getLayer('camada-onibus')) {
        this.mapa.setLayoutProperty('camada-onibus', 'visibility', 'none');
      }
    }
  }

  removerMapa(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.mapaInicializadoSubject.next(false);
    }
  }

  
  centralizarEm(coordenadas: { lat: number, lng: number }, zoom: number = 14): void {
    if (!this.mapaInicializadoSubject.getValue()) return;
    
    this.mapa.flyTo({
      center: [coordenadas.lng, coordenadas.lat],
      zoom: zoom,
      duration: 2000
    });
  }

  
  obterCentroMapa(): { lat: number, lng: number } {
    if (!this.mapaInicializadoSubject.getValue()) return { lat: -23.55052, lng: -46.633309 };
    
    const centro = this.mapa.getCenter();
    return {
      lat: centro.lat,
      lng: centro.lng
    };
  }
}