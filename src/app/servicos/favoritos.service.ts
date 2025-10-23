import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  RotaFavorita,
  EstatisticasFavoritos,
  ExportacaoFavoritos,
  calcularEstatisticas,
  gerarIdFavorito,
  CONFIGURACOES_FAVORITOS,
} from '../modelos/favorito';
import { RotaCalculada } from '../modelos/rota-calculada';
import { LocalMapa } from '../modelos/local-mapa';
import { TipoRota } from '../modelos/tipo-rota';


@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private readonly STORAGE_KEY = 'mindway_favoritos';
  private readonly VERSAO = '1.0.0';

  private favoritosSubject = new BehaviorSubject<RotaFavorita[]>([]);
  private estatisticasSubject = new BehaviorSubject<EstatisticasFavoritos>(this.estatisticasVazias());

  favoritos$ = this.favoritosSubject.asObservable();
  estatisticas$ = this.estatisticasSubject.asObservable();

  constructor() {
    this.carregarDoStorage();
  }

  
  obterFavoritos(): RotaFavorita[] {
    return this.favoritosSubject.value;
  }

  
  obterFavoritoPorId(id: string): RotaFavorita | undefined {
    return this.favoritosSubject.value.find(f => f.id === id);
  }

  
  adicionar(
    nome: string,
    origem: LocalMapa,
    destino: LocalMapa,
    rota: RotaCalculada,
    tipoRota: TipoRota,
    descricao?: string,
    tags?: string[]
  ): RotaFavorita {
    const favoritos = this.favoritosSubject.value;

    
    if (favoritos.length >= CONFIGURACOES_FAVORITOS.maxFavoritos) {
      throw new Error(`Limite de ${CONFIGURACOES_FAVORITOS.maxFavoritos} favoritos atingido`);
    }

    const novoFavorito: RotaFavorita = {
      id: gerarIdFavorito(),
      nome: nome.trim(),
      descricao: descricao?.trim(),
      origem: {
        nome: origem.titulo,
        latitude: origem.latitude,
        longitude: origem.longitude,
      },
      destino: {
        nome: destino.titulo,
        latitude: destino.latitude,
        longitude: destino.longitude,
      },
      tipoRota,
      distanciaMetros: rota.distanciaMetros,
      duracaoSegundos: rota.duracaoSegundos,
      emissoesCO2Evitadas: rota.emissoesCO2Evitadas,
      custoEstimado: rota.custoEstimado,
      dataCriacao: new Date(),
      vezesUsada: 0,
      tags,
    };

    const novosFavoritos = [...favoritos, novoFavorito];
    this.salvarFavoritos(novosFavoritos);

    console.log('⭐ Favorito adicionado:', nome);
    return novoFavorito;
  }

  
  atualizar(id: string, dados: Partial<RotaFavorita>): boolean {
    const favoritos = this.favoritosSubject.value;
    const index = favoritos.findIndex(f => f.id === id);

    if (index === -1) {
      console.error('❌ Favorito não encontrado:', id);
      return false;
    }

    const atualizado = { ...favoritos[index], ...dados, id }; 
    const novosFavoritos = [...favoritos];
    novosFavoritos[index] = atualizado;

    this.salvarFavoritos(novosFavoritos);
    console.log('✏️ Favorito atualizado:', id);
    return true;
  }

  
  remover(id: string): boolean {
    const favoritos = this.favoritosSubject.value;
    const novosFavoritos = favoritos.filter(f => f.id !== id);

    if (novosFavoritos.length === favoritos.length) {
      console.error('❌ Favorito não encontrado:', id);
      return false;
    }

    this.salvarFavoritos(novosFavoritos);
    console.log('🗑️ Favorito removido:', id);
    return true;
  }

  
  registrarUso(id: string): void {
    const favoritos = this.favoritosSubject.value;
    const index = favoritos.findIndex(f => f.id === id);

    if (index === -1) {
      console.error('❌ Favorito não encontrado:', id);
      return;
    }

    const atualizado = {
      ...favoritos[index],
      vezesUsada: favoritos[index].vezesUsada + 1,
      ultimoUso: new Date(),
    };

    const novosFavoritos = [...favoritos];
    novosFavoritos[index] = atualizado;

    this.salvarFavoritos(novosFavoritos);
    console.log('📊 Uso registrado para:', favoritos[index].nome);
  }

  
  estaNosFavoritos(origem: LocalMapa, destino: LocalMapa, tipoRota: TipoRota): RotaFavorita | undefined {
    return this.favoritosSubject.value.find(f =>
      Math.abs(f.origem.latitude - origem.latitude) < 0.0001 &&
      Math.abs(f.origem.longitude - origem.longitude) < 0.0001 &&
      Math.abs(f.destino.latitude - destino.latitude) < 0.0001 &&
      Math.abs(f.destino.longitude - destino.longitude) < 0.0001 &&
      f.tipoRota === tipoRota
    );
  }

  
  buscar(termo: string): RotaFavorita[] {
    const termoLower = termo.toLowerCase().trim();
    if (!termoLower) return this.favoritosSubject.value;

    return this.favoritosSubject.value.filter(f =>
      f.nome.toLowerCase().includes(termoLower) ||
      f.descricao?.toLowerCase().includes(termoLower) ||
      f.origem.nome.toLowerCase().includes(termoLower) ||
      f.destino.nome.toLowerCase().includes(termoLower) ||
      f.tags?.some(tag => tag.toLowerCase().includes(termoLower))
    );
  }

  
  ordenar(criterio: 'nome' | 'distancia' | 'uso' | 'recente'): RotaFavorita[] {
    const favoritos = [...this.favoritosSubject.value];

    switch (criterio) {
      case 'nome':
        return favoritos.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'distancia':
        return favoritos.sort((a, b) => a.distanciaMetros - b.distanciaMetros);
      case 'uso':
        return favoritos.sort((a, b) => b.vezesUsada - a.vezesUsada);
      case 'recente':
        return favoritos.sort((a, b) => 
          (b.ultimoUso?.getTime() || b.dataCriacao.getTime()) - 
          (a.ultimoUso?.getTime() || a.dataCriacao.getTime())
        );
      default:
        return favoritos;
    }
  }

  
  exportar(): string {
    const exportacao: ExportacaoFavoritos = {
      versao: this.VERSAO,
      dataExportacao: new Date(),
      rotas: this.favoritosSubject.value,
      estatisticas: this.estatisticasSubject.value,
    };

    const json = JSON.stringify(exportacao, null, 2);
    console.log('📤 Favoritos exportados:', exportacao.rotas.length, 'rotas');
    return json;
  }

  
  importar(json: string): { sucesso: boolean; importados: number; erro?: string } {
    try {
      const dados: ExportacaoFavoritos = JSON.parse(json);

      if (!dados.rotas || !Array.isArray(dados.rotas)) {
        return { sucesso: false, importados: 0, erro: 'Formato inválido' };
      }

      
      const rotasImportadas = dados.rotas.map(r => ({
        ...r,
        dataCriacao: new Date(r.dataCriacao),
        ultimoUso: r.ultimoUso ? new Date(r.ultimoUso) : undefined,
      }));

      
      const favoritosAtuais = this.favoritosSubject.value;
      const idsExistentes = new Set(favoritosAtuais.map(f => f.id));
      const novos = rotasImportadas.filter(r => !idsExistentes.has(r.id));

      const mescladosFavoritos = [...favoritosAtuais, ...novos];

      
      const finais = mescladosFavoritos.slice(0, CONFIGURACOES_FAVORITOS.maxFavoritos);

      this.salvarFavoritos(finais);
      console.log('📥 Favoritos importados:', novos.length, 'novas rotas');

      return { sucesso: true, importados: novos.length };
    } catch (erro) {
      console.error('❌ Erro ao importar:', erro);
      return { sucesso: false, importados: 0, erro: 'Erro ao processar arquivo' };
    }
  }

  
  limparTodos(): void {
    this.salvarFavoritos([]);
    console.log('🗑️ Todos os favoritos removidos');
  }

  
  private salvarFavoritos(favoritos: RotaFavorita[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favoritos));
      this.favoritosSubject.next(favoritos);
      this.estatisticasSubject.next(calcularEstatisticas(favoritos));
    } catch (erro) {
      console.error('❌ Erro ao salvar favoritos:', erro);
    }
  }

  
  private carregarDoStorage(): void {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) {
        console.log('📂 Nenhum favorito salvo');
        return;
      }

      const favoritos: RotaFavorita[] = JSON.parse(json);
      
      
      const favoritosComDatas = favoritos.map(f => ({
        ...f,
        dataCriacao: new Date(f.dataCriacao),
        ultimoUso: f.ultimoUso ? new Date(f.ultimoUso) : undefined,
      }));

      this.favoritosSubject.next(favoritosComDatas);
      this.estatisticasSubject.next(calcularEstatisticas(favoritosComDatas));
      
      console.log('📂 Favoritos carregados:', favoritosComDatas.length, 'rotas');
    } catch (erro) {
      console.error('❌ Erro ao carregar favoritos:', erro);
      this.salvarFavoritos([]);
    }
  }

  
  private estatisticasVazias(): EstatisticasFavoritos {
    return {
      totalRotas: 0,
      totalKmPercorridos: 0,
      totalCO2Evitado: 0,
      totalEconomizado: 0,
      mediaDistancia: 0,
      totalViagens: 0,
    };
  }
}
