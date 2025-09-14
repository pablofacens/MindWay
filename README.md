# 🚀 MindWay

**MOBILIDADE INTELIGENTE**

MindWay é uma plataforma completa que reúne diferentes modalidades de transporte em um único aplicativo, permitindo aos usuários encontrar as melhores rotas multimodais de acordo com suas necessidades específicas e preferências de deslocamento. 

![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre-396CB2?style=for-the-badge&logo=maplibre&logoColor=white)
![OpenRouteService](https://img.shields.io/badge/OpenRouteService-2E7D32?style=for-the-badge&logo=openstreetmap&logoColor=white)

## Funcionalidades Principais

### � **Mobilidade Verde**
- **Detecção Automática**: Localiza estações de bike sharing num raio
- **Rota Multimodal**: Caminha até estação → Retira bike → Pedala até destino → Devolve bike

### �️ **Sistema de Mapas**
- Visualização em tempo real de diferentes modalidades de transporte
- Interface intuitiva com camadas alternáveis para cada tipo de transporte
- Integração com MapLibre GL para experiência fluida de navegação

### 🧭 **Geolocalização**
- Detecção automática da localização do usuário
- Busca inteligente de endereços
- Cálculo de distâncias com precisão de GPS

### 📊 **Métricas Ambientais**
- **Impacto Sustentável**: Pontuação de sustentabilidade para cada rota

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Angular 20.2.0**: Framework principal para desenvolvimento da aplicação
- **TypeScript**: Linguagem de programação tipada
- **TailwindCSS 4.1.13**: Framework de CSS utilitário para estilização

### APIs e Serviços
- **OpenRouteService API**: Roteamento real seguindo vias públicas
- **MapTiler API**: Tiles de mapas e estilos
- **MapLibre GL 5.7.3**: Biblioteca de mapas open-source para renderização
- **OpenWeatherMap API**: Dados meteorológicos em tempo real

## 🏗️ Arquitetura do Projeto

```
src/
├── app/
│   ├── componentes/           
│   │   ├── alternadorCamadas  # Controle de camadas do mapa
│   │   ├── cartaoRota         # Exibição de informações de rota
│   │   └── formularioBusca    # Interface de busca de rotas
│   └── servicos/             
│       ├── servicoBicicletas  # Gestão inteligente do sistema de bike sharing
│       ├── servicoChavesApi   # Gerenciamento de chaves de API
│       ├── servicoClima       # Informações meteorológicas
│       ├── servicoGeolocalizacao # Geolocalização e geocodificação
│       ├── servicoMapa        # Controle do mapa interativo
│       ├── servicoOnibus      # Sistema de transporte público
│       └── servicoRotas       # Motor de rotas multimodais inteligentes
```

### 🧩 **Principais Componentes**

#### `servicoRotas.ts` - Motor de Rotas Multimodais
- **`obterRotas()`**: Função principal que calcula 3 tipos de rotas simultaneamente
- **`criarRotaBicicletaInteligente()`**: Sistema que encontra estações próximas automaticamente
- **`criarRotaTransportePublico()`**: Combina caminhada + transporte público + caminhada
- **`encontrarEstacaoProxima()`**: Algoritmo de proximidade para pontos de transporte

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm
- Angular CLI
- Chaves de API (OpenRouteService, MapTiler, OpenWeatherMap)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/pabloecliton/mindway.git
   cd mindway
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as chaves de API** (arquivo `src/app/servicos/servicoChavesApi.ts`)
   ```typescript
   private chavesApi = {
     mapTiler: 'SUA_CHAVE_MAPTILER',
     openWeatherMap: 'SUA_CHAVE_OPENWEATHER', 
     openRouteService: 'SUA_CHAVE_OPENROUTESERVICE'
   };
   ```

4. **Execute o projeto**
   ```bash
   npm start
   # ou
   ng serve
   ```

5. **Acesse o aplicativo**
   ```
   http://localhost:4200
   ``

## 🎯 Como Usar

1. **Defina origem e destino** usando o campo de busca ou clicando no mapa
2. **Clique em "Buscar Rotas"** para obter 3 opções inteligentes:
   - 🚗 **Rápida**: Menor tempo (carro/transporte expresso)
   - 💰 **Econômica**: Menor custo (transporte público multimodal)
   - 🌱 **Verde**: Zero emissão (bike sharing + caminhada)
3. **Explore detalhes** de cada rota com informações de tempo, custo e impacto
4. **Visualize no mapa** o trajeto completo com diferentes cores
5. **Siga as instruções** passo-a-passo para navegação multimodal