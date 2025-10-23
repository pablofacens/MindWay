import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import {
  CondicaoClimatica,
  PrevisaoHora,
  DadosClima,
  analisarClimaCiclismo,
} from '../modelos/clima';


@Injectable({
  providedIn: 'root'
})
export class ClimaService {
  private readonly API_URL = 'https://api.openweathermap.org/data/2.5';
  private readonly API_KEY = 'xxxxxxxxxxxxx'; 
  
  private http = inject(HttpClient);
  
  
  private cacheClima?: Observable<DadosClima>;
  private cacheExpiracao = 0;
  private readonly CACHE_DURACAO_MS = 10 * 60 * 1000; 

  
  buscarClima(latitude: number, longitude: number): Observable<DadosClima> {
    
    const agora = Date.now();
    if (this.cacheClima && agora < this.cacheExpiracao) {
      console.log('🌤️ Usando clima em cache');
      return this.cacheClima;
    }

    console.log(`🌤️ Buscando clima para (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);

    
    this.cacheClima = this.buscarClimaAtual(latitude, longitude).pipe(
      map(atual => {
        const analise = analisarClimaCiclismo(atual.condicao, atual.previsao);
        
        const dados: DadosClima = {
          local: atual.local,
          atual: atual.condicao,
          previsao: atual.previsao,
          analise,
          horarioAtualizacao: new Date(),
        };

        console.log('✅ Clima:', {
          temperatura: atual.condicao.temperatura.toFixed(0) + '°C',
          descricao: atual.condicao.descricao,
          vento: atual.condicao.velocidadeVento.toFixed(0) + 'km/h',
          nivel: analise.nivel,
          pontuacao: analise.pontuacao,
        });

        return dados;
      }),
      catchError(erro => {
        console.error('❌ Erro ao buscar clima:', erro);
        return of(this.climaPadrao());
      }),
      shareReplay(1) 
    );

    this.cacheExpiracao = agora + this.CACHE_DURACAO_MS;
    
    return this.cacheClima;
  }

  
  private buscarClimaAtual(lat: number, lon: number): Observable<{
    local: string;
    condicao: CondicaoClimatica;
    previsao: PrevisaoHora[];
  }> {
    
    const url = `${this.API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=pt_br&cnt=8`;

    return this.http.get<any>(url).pipe(
      map(resposta => {
        
        const atual = resposta.list[0];
        
        const condicao: CondicaoClimatica = {
          temperatura: atual.main.temp,
          sensacaoTermica: atual.main.feels_like,
          descricao: atual.weather[0].description,
          icone: atual.weather[0].icon,
          umidade: atual.main.humidity,
          velocidadeVento: atual.wind.speed * 3.6, 
          direcaoVento: atual.wind.deg,
          visibilidade: atual.visibility,
          pressao: atual.main.pressure,
          nuvens: atual.clouds.all,
        };

        
        const previsao: PrevisaoHora[] = resposta.list.slice(1, 3).map((item: any) => ({
          horario: item.dt,
          temperatura: item.main.temp,
          descricao: item.weather[0].description,
          icone: item.weather[0].icon,
          probabilidadeChuva: (item.pop || 0) * 100, 
          velocidadeVento: item.wind.speed * 3.6,
        }));

        return {
          local: resposta.city.name,
          condicao,
          previsao,
        };
      })
    );
  }

  
  private climaPadrao(): DadosClima {
    const condicaoPadrao: CondicaoClimatica = {
      temperatura: 22,
      sensacaoTermica: 22,
      descricao: 'Dados indisponíveis',
      icone: '01d',
      umidade: 60,
      velocidadeVento: 10,
      nuvens: 0,
    };

    return {
      local: 'Localização',
      atual: condicaoPadrao,
      previsao: [],
      analise: {
        adequadoCiclismo: true,
        nivel: 'BOM',
        alertas: ['⚠️ Dados climáticos indisponíveis'],
        recomendacoes: ['Verifique o clima antes de sair'],
        pontuacao: 70,
      },
      horarioAtualizacao: new Date(),
    };
  }

  
  limparCache(): void {
    this.cacheClima = undefined;
    this.cacheExpiracao = 0;
    console.log('🗑️ Cache de clima limpo');
  }

  
  verificarConfiguracao(): boolean {
    const configurado = this.API_KEY.length > 10 && !this.API_KEY.includes('SUA_API_KEY');
    if (!configurado) {
      console.warn('⚠️ API Key do OpenWeatherMap não configurada!');
      console.warn('📝 Configure em: src/app/servicos/clima.service.ts');
      console.warn('🔗 Obtenha em: https://openweathermap.org/api');
    }
    return configurado;
  }
}
