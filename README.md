# MindWay

<div align="center">

**Mobilidade inteligente**

[![Angular](https://img.shields.io/badge/Angular-20.2.0-red?style=flat&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.13-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 Sobre o Projeto

Cansou de ficar pulando entre vários apps pra descobrir o melhor jeito de ir de um lugar pro outro? O MindWay resolve isso: uma plataforma que reúne todas as suas opções de transporte num lugar só. Seja caminhando, uso de biciletas, de ônibus ou de carro, mostraremos as melhores rotas considerando o que você decidir.
O MindWay calcula **rotas multimodais inteligentes**, combinando diferentes meios de transporte numa mesma viagem pra você chegar no seu destino.

### 💡 Exemplo prático

Quer ir pro trabalho economizando e fazendo exercício? 

```
🚶 Caminha 5min até estação de bike → 🚲 Pedala 15min → 🚶 Deixa bike e caminha 3min
Resultado: Economizou dinheiro, fez exercício, ganhou pontos e ainda ajudou o planeta!
```

---

## ✨ Funcionalidades

### 🌱 Rotas Verdes
- Integração automática com estações de bike sharing
- Cálculo de CO₂ economizado
- Sistema de pontos por escolhas sustentáveis

### 🗺️ Visualização Inteligente
- Todas as opções de transporte em um único mapa
- Interface limpa e intuitiva
- Camadas alternáveis por modalidade

### 📊 Métricas Detalhadas
Cada rota apresenta:
- ⏱️ Tempo estimado
- 💰 Custo da viagem
- 🔥 Calorias queimadas
- 🌍 Impacto ambiental

### 🏔️ Análise de Terreno
- Perfil completo de elevação
- Gráfico visual interativo
- Classificação de dificuldade
- Ideal para ciclistas e pedestres

### 🌤️ Informação Climática
- Condições atuais no destino
- Previsão para as próximas 2 horas
- Widget visual integrado

### 🤖 Assistente com IA
- Chat inteligente sobre suas rotas
- Respostas contextualizadas
- Powered by Google Gemini 1.5 Flash

### 🏆 Sistema de Gamificação
- Badges desbloqueáveis
- Conquistas por distância, CO₂ e rotas
- Níveis e progresso visual
- Ranking de fitness

### 📈 Estatísticas Pessoais
- Histórico completo de rotas
- Gráficos mensais de atividade
- Total por modalidade de transporte
- CO₂ total economizado

---

## 🛠️ Tecnologias

### Frontend
- **Angular 20.2.0** - Framework principal
- **TypeScript** - Linguagem tipada
- **TailwindCSS 4.1.13** - Framework CSS utilitário
- **MapLibre GL 5.7.3** - Renderização de mapas open-source

## 🗺️ APIs Utilizadas

### 10+ APIs Integradas:
1. **OpenStreetMap** - Mapas base
2. **Nominatim** - Busca de endereços
3. **OSRM** - Cálculo de rotas (carro, biciletas, caminhada)
4. **Overpass API** - Pontos de interesse (bebedouros, banheiros, farmácias, bancos, referências)
5. **Google Gemini 1.5 Flash** - Assistente IA
6. **Open Elevation API** - Perfil de elevação e análise de dificuldade
7. **OpenWeatherMap** - Clima atual e previsão
8. **Firebase** - Autenticação e armazenamento de dados do usuário

---

## 🚀 Como Usar

### Fluxo Básico

1. **Defina origem e destino**
   - Use o campo de busca com autocomplete

2. **Busque rotas inteligentes**
   
   Receba 3 opções personalizadas:
   - 🚗 **Rápida**: Menor tempo de viagem
   - 💰 **Econômica**: Combinação com outro tipo de modal
   - 🌱 **Verde**: Zero emissão de carbono

3. **Compare e escolha**
   - Visualize métricas detalhadas
   - Analise perfil de elevação
   - Confira pontos de interesse
  
