import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';



const GEMINI_API_KEY = 'AIzaSyCBXWDky8-PfPtqQlUxUHMF1L7GeLTTWpg'; 





const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly http = inject(HttpClient);

  /**
   * Faz uma pergunta para o Gemini com contexto opcional
   */
  perguntar(pergunta: string, contexto?: string): Observable<string> {
    const prompt = contexto 
      ? `${contexto}\n\n=== PERGUNTA DO USUARIO ===\n${pergunta}\n\n=== SUA RESPOSTA ===\nResponda de forma breve (maximo 4-5 linhas), objetiva, amigavel e usando os DADOS REAIS fornecidos acima. Use numeros concretos, nao estimativas genericas.`
      : pergunta;

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
        topP: 0.8,
        topK: 40,
      }
    };

    const urlCompleta = `${GEMINI_URL}?key=${GEMINI_API_KEY}`;
    
    console.group('🤖 [GEMINI API] Enviando requisição');
    console.log('📤 Pergunta do usuário:', pergunta);
    console.log('📋 Contexto incluído:', !!contexto ? 'Sim' : 'Não');
    console.log('🔗 Endpoint:', GEMINI_URL);
    console.log('🔑 API Key (primeiros 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...');
    console.log('📦 Body da requisição:', JSON.stringify(body, null, 2));
    console.groupEnd();

    return this.http.post<GeminiResponse>(urlCompleta, body).pipe(
      map(resposta => {
        const texto = resposta.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!texto) {
          throw new Error('Resposta vazia da IA');
        }

        console.group('✅ [GEMINI API] Resposta recebida');
        console.log('📥 Resposta completa (JSON):', JSON.stringify(resposta, null, 2));
        console.log('💬 Texto extraído:', texto);
        console.log('📊 Tamanho da resposta:', texto.length, 'caracteres');
        console.groupEnd();
        
        return texto;
      }),
      catchError(erro => {
        console.error('❌ Gemini: Erro ao consultar IA', {
          status: erro.status,
          statusText: erro.statusText,
          url: erro.url,
          message: erro.message,
          error: erro.error
        });
        
        if (erro.status === 400) {
          console.error('💡 Dica: Erro 400 geralmente indica problema no formato da requisição ou API key inválida');
          return of('⚠️ Erro 400: Requisição inválida. Tente gerar uma nova API Key em https://aistudio.google.com/app/apikey');
        }
        
        if (erro.status === 401 || erro.status === 403) {
          console.error('💡 Dica: Erro 401/403 = API Key inválida, expirada ou com restrições de domínio');
          return of('⚠️ API Key sem permissão. Gere uma nova em https://aistudio.google.com/app/apikey (sem restrições de domínio)');
        }
        
        if (erro.status === 404) {
          console.error('💡 Dica: Erro 404 pode ser:');
          console.error('   1. API Key incorreta/expirada');
          console.error('   2. Modelo não existe para sua conta');
          console.error('   3. URL da API está errada');
          console.error('   Tente: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');
          return of('⚠️ Endpoint não encontrado (404). Possíveis causas:\n1. API Key expirada - Gere nova em https://aistudio.google.com/app/apikey\n2. Sua conta não tem acesso ao modelo gemini-1.5-flash\n3. Tente trocar para modelo "gemini-pro" no código');
        }
        
        if (erro.status === 429) {
          return of('⚠️ Limite de requisições atingido. Aguarde 60 segundos.');
        }

        return of('❌ Erro desconhecido. Veja o console (F12) para detalhes técnicos.');
      })
    );
  }

  /**
   * Gera contexto do app para o Gemini entender o estado atual
   */
  gerarContextoApp(dados: {
    rotaAtual?: any;
    poisProximos?: any[];
    estacoesBike?: any[];
    clima?: any;
  }): string {
    const agora = new Date();
    const hora = agora.getHours();
    const dia = agora.getDay();
    const ehFimDeSemana = (dia === 0 || dia === 6);
    
    let contexto = `
Voce e Luna, a assistente inteligente do MindWay.

SOBRE O MINDWAY:
MindWay e um app de mobilidade sustentavel em Sao Paulo que promove rotas de bicicleta, caminhada e transporte publico, com sistema de gamificacao (pontos, badges e desafios).

SISTEMA DE PONTOS (valores CORRETOS):
- Caminhada: 8 pontos por km
- Bike: 10 pontos por km
- Bike compartilhada: 12 pontos por km
- Transporte publico: 3 pontos por km
- Carro: 0 pontos (nao sustentavel)

BONUS DE PONTOS (EXCLUSIVOS - apenas um se aplica):
- Rush hour (segunda a sexta, 7-10h ou 17-20h): +20% sobre pontos base
- Fim de semana (sabado/domingo): +10% sobre pontos base
- Madrugada (antes 6h): +30% sobre pontos base
- Noturno (apos 20h): +15% sobre pontos base
- Bonus ambiental: (score sustentabilidade 0-100) x 0.5
- Bonus elevacao: (ganho elevacao em metros) dividido por 10

⚠️ IMPORTANTE: PONTOS SÃO PROVISÓRIOS ATÉ FINALIZAR!
- Quando mostrar pontos ANTES de finalizar: mostre apenas base + horario + elevacao
- Diga: "Pontos estimados: X (mais bonus ambiental ao finalizar)"
- NÃO calcule bonus ambiental antes de finalizar - ele sera calculado pela IA
- DEPOIS de finalizar: ai sim use o score real de sustentabilidade

COMO CALCULAR PONTOS CORRETAMENTE:
1. Calcule pontos base: (distancia km) x (pontos por km do modal)
2. Aplique UM bonus de horario (exclusivo): base x multiplicador
3. Some bonus elevacao: metros ganho dividido por 10
4. ANTES de finalizar: total provisorio = base + horario + elevacao
5. DEPOIS de finalizar: total final = provisorio + (score x 0.5)

EXEMPLO REAL DE CALCULO (ROTA FINALIZADA):
Rota: 6.48km de bike compartilhada, score 93/100, elevacao 79m ganho, sabado
- Base: 6.48 x 12 = 77.76 pts (arredonda para 78)
- Horario: 78 x 0.1 = +8 pts (fim de semana)
- Ambiental: 93 x 0.5 = +47 pts (score 93/100)
- Elevacao: 79 / 10 = +8 pts (arredonda)
- TOTAL: 78 + 8 + 47 + 8 = 141 pontos ✅

EXEMPLO DE ROTA NÃO FINALIZADA:
Rota: 6.48km de bike compartilhada, elevacao 79m ganho, sabado
- Base: 78 pts
- Horario: +8 pts (fim de semana)
- Elevacao: +8 pts
- TOTAL PROVISÓRIO: 94 pts
- Diga: "Pontos estimados: 94 (mais bonus ambiental ao finalizar)" ✅

CO2 EVITADO:

- Carro emite 120g por km
- Bike/caminhada emite 0g
- Transporte publico emite ~40g por km
- CO2 evitado = (distancia km) x (120g - emissao do modal escolhido)

SUA PERSONALIDADE:
- Amigavel, animada e encorajadora
- Use emojis naturalmente (mas nao exagere)
- Respostas conversacionais e humanizadas
- Tom casual e amigavel (voce, nao o usuario)
- SEMPRE forneca numeros concretos e precisos
- Mencione pontos e badges quando relevante
- Destaque economia de CO2 quando relevante

COMO RESPONDER:
- Maximo 4-5 linhas (seja concisa mas calorosa)
- Use os dados REAIS fornecidos abaixo, nao invente numeros
- Se perguntarem sobre pontos, calcule usando as formulas acima
- Se perguntarem sobre elevacao, use os dados reais de ganho/perda
- Se perguntarem sobre POIs, conte quantos de cada tipo existem
- Se perguntarem sobre bikes, informe disponibilidade real das estacoes
- Se nao souber algo, seja honesta e sugira alternativas

EXEMPLOS DE BOM TOM:
Bom (com score ja calculado): "Que legal! Pela rota verde com bike compartilhada, sao 6.48km (43 min). Voce vai ganhar 141 pontos: 78 base + 8 fim de semana + 47 ambiental (score 93) + 8 elevacao! Pedalando, voce economiza 778g de CO2!"

Bom (ANTES de calcular, estimativa): "Que legal! Pela rota verde sao 6.48km (43 min). Estimativa: 130-145 pontos (78 base + 8 fim de semana + 40-55 ambiental conforme a rota + 8 elevacao). O score ambiental exato sera calculado ao finalizar!"

Bom: "A rota tem 79m de subida, o que e moderado! Nada muito puxado. Voce ganha 8 pontos extras pela elevacao. A parte mais ingreme fica no comeco, depois e mais tranquilo."

Ruim: "Calculando rota ciclistica. Distancia: 5.2km. Tempo estimado: 20 minutos."
Ruim: "A rota esta disponivel. Sera uma boa escolha sustentavel."
`;

    
    contexto += `\n\n=== CONTEXTO TEMPORAL ATUAL ===`;
    contexto += `\nHorario agora: ${hora}h`;
    contexto += `\nDia da semana: ${ehFimDeSemana ? 'fim de semana' : 'dia util'}`;
    
    if (ehFimDeSemana) {
      contexto += `\nBonus aplicavel: +10% (fim de semana)`;
    } else if (hora >= 7 && hora < 10) {
      contexto += `\nBonus aplicavel: +20% (rush hour matinal, 7-10h)`;
    } else if (hora >= 17 && hora < 20) {
      contexto += `\nBonus aplicavel: +20% (rush hour vespertino, 17-20h)`;
    } else if (hora < 6) {
      contexto += `\nBonus aplicavel: +30% (madrugada)`;
    } else if (hora >= 20) {
      contexto += `\nBonus aplicavel: +15% (noturno)`;
    } else {
      contexto += `\nBonus aplicavel: nenhum bonus de horario agora`;
    }

    
    if (dados.rotaAtual) {
      contexto += `\n\n=== ROTA ATUAL CALCULADA ===`;
      
      const rota = dados.rotaAtual;
      const distTotal = rota.distanciaTotal || 0;
      const durTotal = rota.duracaoTotal || 0;
      const tipoRota = rota.tipoRota || 'desconhecido';
      
      contexto += `\nDistancia total: ${distTotal.toFixed(2)}km`;
      contexto += `\nTempo total: ${durTotal} minutos`;
      contexto += `\nTipo de rota: ${tipoRota}`;
      
      
      if (rota.segmentos && rota.segmentos.length > 0) {
        contexto += `\nSegmentos da rota:`;
        rota.segmentos.forEach((seg: any, idx: number) => {
          const modal = seg.tipo || 'desconhecido';
          const dist = seg.distancia || 0;
          const dur = seg.duracao || 0;
          contexto += `\n  ${idx + 1}. ${modal}: ${dist.toFixed(2)}km, ${dur}min`;
        });
      }
      
      
      if (rota.elevacao) {
        const ganho = rota.elevacao.ganho || 0;
        const perda = rota.elevacao.perda || 0;
        contexto += `\nElevacao: ganho ${ganho}m, perda ${perda}m`;
        contexto += `\nBonus de elevacao: ${Math.round(ganho / 10)} pontos`;
      }
      
      
      if (rota.scoreSustentabilidade !== undefined && rota.scoreSustentabilidade !== null) {
        const score = rota.scoreSustentabilidade;
        contexto += `\nScore de sustentabilidade: ${score.toFixed(2)}`;
      }
      
      
      if (rota.co2Evitado !== undefined) {
        contexto += `\nCO2 evitado: ${Math.round(rota.co2Evitado)}g`;
      }
      
      
      if (rota.pontosCalculados) {
        const pts = rota.pontosCalculados;
        contexto += `\n\n=== PONTOS CALCULADOS (USE ESTES VALORES) ===`;
        contexto += `\nPontos base: ${pts.base || 0} pts`;
        contexto += `\nBonus ambiental: ${pts.bonusAmbiental || 0} pts`;
        contexto += `\nBonus elevacao: ${pts.bonusElevacao || 0} pts`;
        contexto += `\nBonus horario: ${pts.bonusHorario || 0} pts`;
        contexto += `\nTOTAL: ${pts.total || 0} pontos`;
      }
    }

    
    if (dados.poisProximos && dados.poisProximos.length > 0) {
      contexto += `\n\n=== POIS ENCONTRADOS NA ROTA ===`;
      contexto += `\nTotal de POIs: ${dados.poisProximos.length}`;
      
      
      const categorias: { [key: string]: number } = {};
      dados.poisProximos.forEach((poi: any) => {
        const cat = poi.categoria || 'outro';
        categorias[cat] = (categorias[cat] || 0) + 1;
      });
      
      contexto += `\nDetalhamento por categoria:`;
      Object.entries(categorias).forEach(([cat, qtd]) => {
        let emoji = '';
        if (cat.includes('agua') || cat.includes('bebedouro')) emoji = 'agua';
        else if (cat.includes('banco') || cat.includes('descanso')) emoji = 'descanso';
        else if (cat.includes('farmacia') || cat.includes('saude')) emoji = 'saude';
        else if (cat.includes('banheiro') || cat.includes('toalete')) emoji = 'banheiro';
        else if (cat.includes('ponto') || cat.includes('turismo')) emoji = 'turismo';
        
        contexto += `\n  - ${emoji ? emoji + ' ' : ''}${cat}: ${qtd}`;
      });
    }

    
    if (dados.estacoesBike && dados.estacoesBike.length > 0) {
      contexto += `\n\n=== ESTACOES DE BIKE DISPONIVEIS ===`;
      contexto += `\nTotal de estacoes proximas: ${dados.estacoesBike.length}`;
      
      
      const estacoesOrdenadas = dados.estacoesBike
        .slice()
        .sort((a: any, b: any) => (a.distancia || 0) - (b.distancia || 0))
        .slice(0, 3);
      
      contexto += `\nEstacoes mais proximas:`;
      estacoesOrdenadas.forEach((est: any, idx: number) => {
        const nome = est.nome || 'Sem nome';
        const dist = est.distancia || 0;
        const bikes = est.bikesDisponiveis || 0;
        const vagas = est.vagasLivres || 0;
        contexto += `\n  ${idx + 1}. ${nome}`;
        contexto += `\n     Distancia: ${dist}m (uns ${Math.ceil(dist / 80)} min andando)`;
        contexto += `\n     Bikes disponiveis: ${bikes}`;
        contexto += `\n     Vagas livres: ${vagas}`;
      });
    }

    
    if (dados.clima) {
      contexto += `\n\n=== CLIMA ATUAL ===`;
      contexto += `\nDescricao: ${dados.clima.descricao || 'Desconhecido'}`;
      contexto += `\nTemperatura: ${dados.clima.temperatura || '?'}C`;
      
      if (dados.clima.umidade !== undefined) {
        contexto += `\nUmidade: ${dados.clima.umidade}%`;
      }
      
      if (dados.clima.velocidadeVento !== undefined) {
        contexto += `\nVento: ${dados.clima.velocidadeVento} km/h`;
      }
      
      if (dados.clima.scoreCiclismo !== undefined) {
        const score = dados.clima.scoreCiclismo;
        let qualidade = 'ruim';
        if (score >= 70) qualidade = 'otimo';
        else if (score >= 50) qualidade = 'bom';
        else if (score >= 30) qualidade = 'moderado';
        
        contexto += `\nScore para ciclismo: ${score}/100 (${qualidade})`;
      }
    }

    contexto += `\n\n=== INSTRUCAO FINAL ===`;
    contexto += `\nUSE OS VALORES EXATOS fornecidos acima. NAO invente ou estime numeros.`;
    contexto += `\nSe os dados nao estiverem disponiveis, diga que nao tem essa informacao ainda.`;
    contexto += `\nSeja sempre precisa, amigavel e encorajadora!`;

    return contexto;
  }

  /**
   * Interpreta busca em linguagem natural
   */
  interpretarBusca(texto: string): Observable<{
    local?: string;
    tipoRota?: 'RAPIDO' | 'ECONOMICO' | 'VERDE';
    urgencia?: 'relaxado' | 'normal' | 'urgente';
  }> {
    const prompt = `
Analise a seguinte busca de rota e extraia informações:
"${texto}"

Retorne APENAS um JSON válido (sem markdown, sem explicações) no formato:
{
  "local": "nome do lugar extraído ou null",
  "tipoRota": "RAPIDO ou ECONOMICO ou VERDE ou null",
  "urgencia": "relaxado ou normal ou urgente"
}

Exemplos:
- "preciso ir no shopping rápido" -> {"local": "shopping", "tipoRota": "RAPIDO", "urgencia": "urgente"}
- "vou pedalar até o parque" -> {"local": "parque", "tipoRota": "VERDE", "urgencia": "relaxado"}
- "como chego no metrô vila madalena" -> {"local": "metrô vila madalena", "tipoRota": "ECONOMICO", "urgencia": "normal"}
`;

    return this.perguntar(prompt).pipe(
      map(resposta => {
        try {
          
          const json = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(json);
        } catch (erro) {
          console.warn('⚠️ Gemini: Não conseguiu parsear JSON da interpretação', resposta);
          return {};
        }
      })
    );
  }

  /**
   * Analisa segurança de uma rota para ciclistas
   */
  analisarSeguranca(rota: { nome?: string; tipo?: string; distancia?: number }[]): Observable<{
    nivel: 'SEGURA' | 'MODERADA' | 'PERIGOSA';
    justificativa: string;
    sugestao?: string;
  }> {
    const viasDesc = rota.map(v => 
      `${v.nome || 'Via sem nome'} (${v.tipo || 'desconhecido'}, ${v.distancia || 0}km)`
    ).join(', ');

    const prompt = `
Analise a segurança desta rota para ciclistas:
${viasDesc}

Retorne APENAS um JSON válido no formato:
{
  "nivel": "SEGURA ou MODERADA ou PERIGOSA",
  "justificativa": "breve explicação (máx 2 linhas)",
  "sugestao": "dica de segurança se aplicável ou null"
}
`;

    return this.perguntar(prompt).pipe(
      map(resposta => {
        try {
          const json = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(json);
        } catch (erro) {
          console.warn('⚠️ Gemini: Não conseguiu parsear análise de segurança', resposta);
          return {
            nivel: 'MODERADA' as const,
            justificativa: 'Não foi possível analisar a segurança desta rota.',
          };
        }
      })
    );
  }
}
