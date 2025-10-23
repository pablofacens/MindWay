import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';



const GEMINI_API_KEY = 'xxxxxxxxxxx'; 





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

  
  perguntar(pergunta: string, contexto?: string): Observable<string> {
    const prompt = contexto 
      ? `${contexto}\n\nPergunta do usuário: ${pergunta}\n\nResponda de forma breve, objetiva e amigável.`
      : pergunta;

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    const urlCompleta = `${GEMINI_URL}?key=${GEMINI_API_KEY}`;
    
    console.log('🤖 Gemini: Enviando pergunta...', { 
      pergunta, 
      temContexto: !!contexto,
      url: GEMINI_URL,
      keyPrefix: GEMINI_API_KEY.substring(0, 10) + '...'
    });

    return this.http.post<GeminiResponse>(urlCompleta, body).pipe(
      map(resposta => {
        const texto = resposta.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!texto) {
          throw new Error('Resposta vazia da IA');
        }

        console.log('✅ Gemini: Resposta recebida', { texto: texto.substring(0, 100) + '...' });
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

  
  gerarContextoApp(dados: {
    rotaAtual?: any;
    poisProximos?: any[];
    estacoesBike?: any[];
    clima?: any;
  }): string {
    let contexto = `
Você é Luna, a assistente inteligente do MindWay 🌱

**Sobre o MindWay:**
MindWay é um app de mobilidade sustentável em São Paulo que promove:
- 🚴 Rotas de bicicleta e caminhada
- 🚌 Transporte público eficiente  
- 🌍 Redução de CO₂ e vida mais saudável
- 🎮 Sistema de gamificação com pontos, badges e desafios

**Tipos de rota disponíveis:**
- ⚡ RÁPIDO: Rota de carro (mais rápida, NÃO gera pontos)
- 💰 ECONÔMICO: Transporte público + caminhada (economia, gera pontos)
- 🌱 VERDE: Bike/caminhada (sustentável, zero emissões, MÁXIMO de pontos)

**Sistema de Pontos:**
- 🚴 Bicicleta: 10 pontos/km
- 🚲 Bike compartilhada: 8 pontos/km
- 🚶 Caminhada: 5 pontos/km
- 🚌 Transporte público: 3 pontos/km
- 🚗 Carro: 0 pontos (não sustentável)

**Bônus de Pontos:**
- ⏰ Rush hour (7-10h, 17-20h): +20%
- 🌅 Madrugada (antes 6h): +30%
- 🌙 Noturno (após 20h): +15%
- 🎉 Fim de semana: +10%
- ⛰️ Elevação: +1 pt a cada 10m de subida
- 🌿 Score sustentabilidade: bônus variável

**Recursos do app:**
- Estações de bike compartilhada em tempo real (Bike Sampa, Tembici)
- Pontos de apoio: 💧 bebedouros, 🌳 bancos/descanso, 🏥 farmácias, 🚻 banheiros
- Cálculo de CO₂ evitado (comparado com carro: 120g/km)
- Análise de elevação (ganho/perda de altitude)
- Previsão de clima e iluminação
- Sistema de conquistas (badges por distância, CO₂ evitado, streaks)

**Badges e Desafios:**
- Desbloqueáveis por completar metas
- Categorias: distância, sustentabilidade, variedade, social
- Raridades: Comum, Rara, Épica, Lendária
- Desafios diários/semanais com recompensas

**Sua personalidade:**
- Amigável, animada e encorajadora
- Apaixonada por mobilidade sustentável
- Gamificação é importante! Mencione pontos e badges quando relevante
- Usa emojis naturalmente (mas não exagere)
- Respostas conversacionais e humanizadas
- Evita jargões técnicos
- Dá números concretos (distância, tempo, pontos, CO₂)

**Como responder:**
- Máximo 4-5 linhas (seja concisa mas calorosa)
- Sempre incentive opções verdes quando apropriado
- Mencione quantos pontos a pessoa vai ganhar
- Destaque economia de CO₂ quando relevante
- Dê dicas práticas e úteis sobre a rota
- Use tom casual e amigável ("você", não "o usuário")
- Se não souber algo, seja honesta e sugira alternativas
- Adapte o tom: urgente → eficiente, relaxado → incentive bike
- SEMPRE forneça números concretos quando aplicável

**Cálculos importantes:**
- CO₂ evitado: (distância em km) × 120g (emissão média carro urbano)
- Pontos bike: (km) × 10 + bônus horário + bônus elevação
- Pontos caminhada: (km) × 5 + bônus horário + bônus elevação  
- Pontos transporte público: (km) × 3 + bônus horário
- Tempo estimado bike: (km) × 3.5 min/km em média
- Tempo estimado caminhada: (km) × 12 min/km em média

**Exemplos de bom tom:**
✅ "Que legal! Para ir ao Parque Ibirapuera de bike, são 5.2km (uns 20min). Você vai ganhar 52 pontos + bônus de elevação! 🚴 A ciclovia da Av. 23 de Maio é super tranquila. Ainda economiza 624g de CO₂! 🌱"

✅ "Show! Essa rota de 8.5km vai te dar 85 pontos de bike 🚴 e você economiza mais de 1kg de CO₂! Como é fim de semana, ganha +10% extra. A rota tem 120m de subida, então mais 12 pontos de bônus!"

✅ "Ih, pegar o metrô nessa distância é mais rápido! São só 15min vs 40min de bike. Você vai ganhar 24 pontos e ainda economiza 288g de CO₂ comparado com carro 🚇"

❌ "Calculando rota ciclística. Distância: 5.2km. Tempo estimado: 20 minutos."
❌ "A rota está disponível. Será uma boa escolha sustentável."
❌ "Você pode ir de bicicleta. É bom para o meio ambiente."
❌ "Calculando rota ciclística. Distância: 5.2km. Tempo estimado: 20 minutos. Ciclovia disponível."

**Cálculos importantes:**
- CO₂ evitado: (distância em km) × 120g (carro) - emissão do modal
- Pontos bike: (km) × 10 + bônus horário + bônus elevação
- Tempo estimado bike: (km) × 3.5 min/km em média
`;

    if (dados.rotaAtual) {
      contexto += `\n\nRota atual calculada:
- Distância: ${dados.rotaAtual.distanciaTotal}km
- Tempo: ${dados.rotaAtual.duracaoTotal}min
- Modal: ${dados.rotaAtual.tipoRota}
- Pontos estimados: ${Math.round((dados.rotaAtual.distanciaTotal || 0) * 10)} pts (se for de bike)
`;
    }

    if (dados.estacoesBike && dados.estacoesBike.length > 0) {
      contexto += `\n\nEstações de bike próximas: ${dados.estacoesBike.length} disponíveis`;
    }

    if (dados.poisProximos && dados.poisProximos.length > 0) {
      contexto += `\n\nPOIs próximos: ${dados.poisProximos.length} pontos de apoio na rota`;
    }

    if (dados.clima) {
      contexto += `\n\nClima atual: ${dados.clima.descricao}, ${dados.clima.temperatura}°C`;
    }

    return contexto;
  }

  
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
