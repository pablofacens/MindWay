import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagina-sobre',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagina-sobre">
      <div class="container">
        
                <div class="hero">
          <div class="hero-emoji">🚴🌿</div>
          <h1>MindWay</h1>
          <p class="hero-desc">
            O planejador de rotas inteligente que prioriza sua saúde mental,
            sustentabilidade e bem-estar urbano
          </p>
        </div>

                <div class="secao">
          <h2>✨ Diferenciais Únicos</h2>
          <div class="cards-grid">
            
            <div class="card card--destaque">
              <div class="card-icone">🌳</div>
              <h3>Rotas Verdes</h3>
              <p>
                Algoritmo exclusivo que calcula rotas passando por áreas verdes (parques, praças)
                para melhorar seu bem-estar durante o trajeto.
              </p>
            </div>

            <div class="card card--destaque">
              <div class="card-icone">🧠</div>
              <h3>Análise com IA</h3>
              <p>
                Chat integrado com Gemini AI que analisa sua rota e fornece recomendações
                personalizadas sobre segurança, iluminação e acessibilidade.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">📊</div>
              <h3>Score de Sustentabilidade</h3>
              <p>
                Único app que atribui nota 0-100 para rotas verdes baseado em densidade de
                áreas verdes, km em natureza e CO₂ evitado.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">🗺️</div>
              <h3>POIs Contextualizados</h3>
              <p>
                Marcadores inteligentes ao longo da rota: água, descanso, saúde, banheiros
                e pontos turísticos com fotos da Wikipedia.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">🎮</div>
              <h3>Gamificação Completa</h3>
              <p>
                Sistema de pontos (8-12pts/km), níveis, 16+ badges, desafios semanais e
                sincronização na nuvem com Firebase.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">⛰️</div>
              <h3>Perfil de Elevação</h3>
              <p>
                Gráfico interativo mostrando subidas, descidas e ganho de elevação total
                para você se preparar melhor.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">🌤️</div>
              <h3>Previsão Climática</h3>
              <p>
                Dados meteorológicos em tempo real com análise se as condições são adequadas
                para ciclismo ou caminhada.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">🚌</div>
              <h3>Transporte Integrado</h3>
              <p>
                Integração com SPTrans (ônibus) e CityBikes (bikes compartilhadas) para
                rotas multimodais inteligentes.
              </p>
            </div>

            <div class="card">
              <div class="card-icone">⭐</div>
              <h3>Favoritos Sincronizados</h3>
              <p>
                Salve suas rotas preferidas no LocalStorage com opção de sincronização
                na nuvem via Firebase/Firestore.
              </p>
            </div>

          </div>
        </div>

                <div class="secao">
          <h2>🆓 10 APIs Gratuitas</h2>
          <div class="apis-grid">
            <div class="api-tag">🗺️ OpenStreetMap</div>
            <div class="api-tag">📍 Nominatim</div>
            <div class="api-tag">🛣️ OSRM</div>
            <div class="api-tag">🚲 CityBikes</div>
            <div class="api-tag">🔍 Overpass</div>
            <div class="api-tag">🤖 Gemini AI</div>
            <div class="api-tag">⛰️ Open Elevation</div>
            <div class="api-tag">🌦️ OpenWeather</div>
            <div class="api-tag">🚌 SPTrans</div>
            <div class="api-tag">📷 Wikipedia</div>
          </div>
          <p class="apis-nota">
            <strong>Zero custo:</strong> Todas as APIs utilizadas são gratuitas, 
            garantindo sustentabilidade financeira do projeto.
          </p>
        </div>

                <div class="secao">
          <h2>⚙️ Tecnologias</h2>
          <div class="tech-grid">
            <div class="tech-item">
              <strong>Frontend:</strong> Angular 19 com Signals e Standalone Components
            </div>
            <div class="tech-item">
              <strong>Mapa:</strong> Leaflet.js com OpenStreetMap
            </div>
            <div class="tech-item">
              <strong>Backend:</strong> Firebase (Auth + Firestore)
            </div>
            <div class="tech-item">
              <strong>IA:</strong> Google Gemini API
            </div>
            <div class="tech-item">
              <strong>Rotas:</strong> OSRM (Open Source Routing Machine)
            </div>
            <div class="tech-item">
              <strong>TypeScript:</strong> 100% tipado com strict mode
            </div>
          </div>
        </div>

                <div class="secao">
          <h2>📈 Números do Projeto</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-valor">10+</div>
              <div class="stat-label">Funcionalidades Únicas</div>
            </div>
            <div class="stat-card">
              <div class="stat-valor">10</div>
              <div class="stat-label">APIs Gratuitas</div>
            </div>
            <div class="stat-card">
              <div class="stat-valor">16+</div>
              <div class="stat-label">Badges Disponíveis</div>
            </div>
            <div class="stat-card">
              <div class="stat-valor">100%</div>
              <div class="stat-label">Open Source</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  })
export class PaginaSobreComponent {}
