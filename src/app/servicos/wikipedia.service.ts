import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, timeout, tap, switchMap } from 'rxjs/operators';
import {
  ImagemWikipedia,
  ResultadoBuscaWikipedia,
  InfoPaginaWikipedia,
  ConfiguracaoWikipedia,
  CacheImagemWikipedia,
  CONFIGURACAO_WIKIPEDIA_PADRAO,
  limparNomePOI,
  calcularSimilaridade,
  extrairTermosBusca,
  formatarUrlWikipedia,
  imagemValida
} from '../modelos/wikipedia';


@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private readonly http = inject(HttpClient);
  
  
  private cache = new Map<string, CacheImagemWikipedia>();
  
  
  private config: ConfiguracaoWikipedia = CONFIGURACAO_WIKIPEDIA_PADRAO;
  
  
  buscarImagemPOI(nomePOI: string, categoria?: string): Observable<ImagemWikipedia | null> {
    console.log('📷 [Wikipedia] Buscando imagem para:', nomePOI);
    
    
    const cacheKey = this.criarChaveCache(nomePOI);
    const cached = this.obterDoCache(cacheKey);
    
    if (cached !== undefined) {
      console.log('✅ [Wikipedia] Imagem do cache:', nomePOI);
      return of(cached);
    }
    
    
    const nomeLimpo = limparNomePOI(nomePOI);
    
    if (!nomeLimpo || nomeLimpo.length < 3) {
      console.log('⚠️ [Wikipedia] Nome muito curto:', nomeLimpo);
      this.salvarNoCache(cacheKey, null);
      return of(null);
    }
    
    
    return this.buscarArtigos(nomeLimpo, categoria).pipe(
      
      map(resultados => this.encontrarMelhorMatch(resultados, nomePOI)),
      
      
      switchMap(melhorResultado => {
        if (!melhorResultado) {
          console.log('❌ [Wikipedia] Nenhum artigo encontrado:', nomePOI);
          return of(null);
        }
        
        console.log('🎯 [Wikipedia] Match encontrado:', melhorResultado.title);
        return this.buscarThumbnail(melhorResultado.pageid);
      }),
      
      
      tap(imagem => {
        this.salvarNoCache(cacheKey, imagem);
      }),
      
      catchError(error => {
        console.error('❌ [Wikipedia] Erro ao buscar imagem:', error);
        this.salvarNoCache(cacheKey, null);
        return of(null);
      })
    );
  }
  
  
  private buscarArtigos(termo: string, categoria?: string): Observable<ResultadoBuscaWikipedia[]> {
    
    const termosAdicionais = categoria ? extrairTermosBusca(termo, categoria) : [];
    const termoBusca = [termo, ...termosAdicionais.slice(0, 2)].join(' ');
    
    const url = formatarUrlWikipedia({
      action: 'query',
      list: 'search',
      srsearch: termoBusca,
      srlimit: this.config.maxResultados,
      srprop: 'snippet|wordcount'
    }, this.config);
    
    console.log('🔍 [Wikipedia] Buscando artigos:', termoBusca);
    
    return this.http.get<any>(url).pipe(
      timeout(this.config.timeout),
      map(response => {
        const resultados = response?.query?.search || [];
        console.log(`📄 [Wikipedia] ${resultados.length} artigos encontrados`);
        return resultados;
      }),
      catchError(error => {
        console.error('❌ [Wikipedia] Erro na busca:', error);
        return of([]);
      })
    );
  }
  
  
  private encontrarMelhorMatch(
    resultados: ResultadoBuscaWikipedia[],
    nomePOI: string
  ): ResultadoBuscaWikipedia | null {
    if (resultados.length === 0) return null;
    
    
    const comSimilaridade = resultados.map(resultado => ({
      resultado,
      similaridade: calcularSimilaridade(nomePOI, resultado.title)
    }));
    
    
    comSimilaridade.sort((a, b) => b.similaridade - a.similaridade);
    
    
    const melhor = comSimilaridade[0];
    
    if (melhor.similaridade >= this.config.similaridadeMinima) {
      console.log(`✓ [Wikipedia] Match: "${melhor.resultado.title}" (${(melhor.similaridade * 100).toFixed(0)}%)`);
      return melhor.resultado;
    }
    
    console.log(`⚠️ [Wikipedia] Similaridade baixa: ${(melhor.similaridade * 100).toFixed(0)}%`);
    return null;
  }
  
  
  private buscarThumbnail(pageid: number): Observable<ImagemWikipedia | null> {
    const url = formatarUrlWikipedia({
      action: 'query',
      pageids: pageid,
      prop: 'pageimages|extracts',
      pithumbsize: 500,
      exintro: 1,
      explaintext: 1
    }, this.config);
    
    console.log('🖼️ [Wikipedia] Buscando thumbnail da página:', pageid);
    
    return this.http.get<any>(url).pipe(
      timeout(this.config.timeout),
      map(response => {
        const page = response?.query?.pages?.[pageid];
        
        if (!page) {
          console.log('❌ [Wikipedia] Página não encontrada:', pageid);
          return null;
        }
        
        const thumbnail = page.thumbnail;
        
        if (!imagemValida(thumbnail, this.config)) {
          console.log('⚠️ [Wikipedia] Thumbnail muito pequeno ou inexistente');
          return null;
        }
        
        const imagem: ImagemWikipedia = {
          url: thumbnail.source,
          width: thumbnail.width,
          height: thumbnail.height,
          titulo: page.title,
          descricao: page.extract?.substring(0, 200),
          fonte: 'wikipedia',
          pageid: page.pageid,
          pageTitle: page.title
        };
        
        console.log('✅ [Wikipedia] Thumbnail encontrado:', thumbnail.source);
        return imagem;
      }),
      catchError(error => {
        console.error('❌ [Wikipedia] Erro ao buscar thumbnail:', error);
        return of(null);
      })
    );
  }
  
  
  private limparCacheExpirado(): void {
    const agora = Date.now();
    const keysParaRemover: string[] = [];
    
    this.cache.forEach((valor, key) => {
      if (agora - valor.timestamp > this.config.tempoCache) {
        keysParaRemover.push(key);
      }
    });
    
    keysParaRemover.forEach(key => this.cache.delete(key));
    
    if (keysParaRemover.length > 0) {
      console.log(`🧹 [Wikipedia] ${keysParaRemover.length} itens removidos do cache`);
    }
  }
  
  
  private criarChaveCache(nomePOI: string): string {
    return nomePOI.toLowerCase().trim().replace(/\s+/g, '-');
  }
  
  
  private obterDoCache(key: string): ImagemWikipedia | null | undefined {
    this.limparCacheExpirado();
    
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    
    const idade = Date.now() - cached.timestamp;
    if (idade > this.config.tempoCache) {
      this.cache.delete(key);
      return undefined;
    }
    
    return cached.imagem;
  }
  
  
  private salvarNoCache(key: string, imagem: ImagemWikipedia | null): void {
    this.cache.set(key, {
      imagem,
      timestamp: Date.now(),
      nomePOI: key
    });
  }
  
  
  buscarImagensEmLote(
    pois: Array<{ nome: string; categoria?: string }>
  ): Observable<Array<ImagemWikipedia | null>> {
    console.log(`📚 [Wikipedia] Buscando ${pois.length} imagens em lote`);
    
    
    const observables = pois.map(poi => 
      this.buscarImagemPOI(poi.nome, poi.categoria)
    );
    
    
    return new Observable(subscriber => {
      const resultados: Array<ImagemWikipedia | null> = new Array(pois.length).fill(null);
      let concluidas = 0;
      
      observables.forEach((obs, index) => {
        obs.subscribe({
          next: imagem => {
            resultados[index] = imagem;
          },
          error: () => {
            resultados[index] = null;
          },
          complete: () => {
            concluidas++;
            if (concluidas === pois.length) {
              subscriber.next(resultados);
              subscriber.complete();
            }
          }
        });
      });
    });
  }
  
  
  limparCache(): void {
    this.cache.clear();
    console.log('🧹 [Wikipedia] Cache limpo');
  }
  
  
  obterEstatisticasCache(): {
    total: number;
    comImagem: number;
    semImagem: number;
    tamanhoMB: number;
  } {
    let comImagem = 0;
    let semImagem = 0;
    
    this.cache.forEach(item => {
      if (item.imagem) comImagem++;
      else semImagem++;
    });
    
    
    const tamanhoMB = (this.cache.size * 1024) / (1024 * 1024);
    
    return {
      total: this.cache.size,
      comImagem,
      semImagem,
      tamanhoMB: Number(tamanhoMB.toFixed(2))
    };
  }
  
  
  atualizarConfiguracao(config: Partial<ConfiguracaoWikipedia>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ [Wikipedia] Configuração atualizada:', this.config);
  }
  
  
  obterLinkArtigo(titulo: string, idioma: string = 'pt'): string {
    const tituloEncoded = encodeURIComponent(titulo.replace(/ /g, '_'));
    return `https://${idioma}.wikipedia.org/wiki/${tituloEncoded}`;
  }
}
