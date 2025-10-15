import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../servicos/gemini.service';

interface Mensagem {
  texto: string;
  usuario: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-ia',
  template: `
    <div class="chat-container" [class.chat-container--aberto]="aberto()">
            <button 
        type="button"
        class="chat__botao-toggle"
        (click)="toggleChat()"
        [attr.aria-label]="aberto() ? 'Fechar assistente' : 'Abrir assistente'"
        [attr.aria-expanded]="aberto()">
        @if (aberto()) {
          <span class="chat__icone">✕</span>
        } @else {
          <span class="chat__icone">🌱</span>
          @if (mensagensNaoLidas() > 0) {
            <span class="chat__badge">{{ mensagensNaoLidas() }}</span>
          }
        }
      </button>

            @if (aberto()) {
        <div class="chat__janela">
                    <header class="chat__cabecalho">
            <div class="chat__titulo">
              <span class="chat__avatar">🌱</span>
              <div>
                <h3 class="chat__nome">Luna - MindWay</h3>
                <p class="chat__status">{{ carregando() ? 'Digitando...' : '✨ Online e animada!' }}</p>
              </div>
            </div>
            <button 
              type="button"
              class="chat__botao-limpar"
              (click)="limparConversa()"
              title="Limpar conversa">
              🗑️
            </button>
          </header>

                    <div class="chat__mensagens" #mensagensContainer>
            @if (mensagens().length === 0) {
              <div class="chat__boas-vindas">
                <p class="chat__boas-vindas-titulo">👋 Oi! Sou a Luna, sua assistente de mobilidade verde!</p>
                <p class="chat__boas-vindas-texto">Me pergunte sobre:</p>
                <ul class="chat__sugestoes">
                  <li (click)="enviarSugestao('Como faço pra ir de bike ao Parque Ibirapuera?')">
                    🚴 Rotas de bicicleta
                  </li>
                  <li (click)="enviarSugestao('Tem bike compartilhada perto de mim?')">
                    🚲 Estações de bike
                  </li>
                  <li (click)="enviarSugestao('Onde tem pontos de água e descanso?')">
                    💧 Pontos de apoio
                  </li>
                  <li (click)="enviarSugestao('Por que ir de bike é melhor que de carro?')">
                    🌱 Mobilidade verde
                  </li>
                </ul>
              </div>
            } @else {
              @for (msg of mensagens(); track msg.timestamp) {
                <div class="mensagem" [class.mensagem--usuario]="msg.usuario">
                  <div class="mensagem__bolha">
                    <p class="mensagem__texto">{{ msg.texto }}</p>
                    <span class="mensagem__hora">
                      {{ formatarHora(msg.timestamp) }}
                    </span>
                  </div>
                </div>
              }
              
              @if (carregando()) {
                <div class="mensagem">
                  <div class="mensagem__bolha mensagem__bolha--carregando">
                    <div class="digitando">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              }
            }
          </div>

                    <form class="chat__form" (submit)="enviar($event)">
            <input 
              type="text"
              class="chat__input"
              [(ngModel)]="perguntaAtual"
              name="pergunta"
              placeholder="Digite sua pergunta..."
              [disabled]="carregando()"
              #inputChat>
            <button 
              type="submit"
              class="chat__botao-enviar"
              [disabled]="!perguntaAtual.trim() || carregando()"
              title="Enviar">
              ➤
            </button>
          </form>
        </div>
      }
    </div>
  `,
  styles: `
    .chat-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
    }

    .chat__botao-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #10b981, #0e7490);
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat__botao-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    }

    .chat__icone {
      display: block;
      line-height: 1;
    }

    .chat__badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }

    .chat__janela {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      max-width: calc(100vw - 4rem);
      height: 600px;
      max-height: calc(100vh - 200px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chat__cabecalho {
      background: linear-gradient(135deg, #10b981, #0e7490);
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .chat__titulo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat__avatar {
      font-size: 32px;
      line-height: 1;
    }

    .chat__nome {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .chat__status {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }

    .chat__botao-limpar {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 8px;
      padding: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .chat__botao-limpar:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .chat__mensagens {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }

    .chat__boas-vindas {
      text-align: center;
      padding: 20px;
    }

    .chat__boas-vindas-titulo {
      font-size: 18px;
      font-weight: 600;
      color: #0e7490;
      margin: 0 0 8px 0;
    }

    .chat__boas-vindas-texto {
      color: #64748b;
      margin: 0 0 16px 0;
    }

    .chat__sugestoes {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat__sugestoes li {
      background: white;
      border: 2px solid rgba(16, 185, 129, 0.2);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      color: #475569;
      font-size: 14px;
    }

    .chat__sugestoes li:hover {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
      transform: translateX(4px);
    }

    .mensagem {
      display: flex;
      margin-bottom: 4px;
    }

    .mensagem--usuario {
      justify-content: flex-end;
    }

    .mensagem__bolha {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      color: #1e293b;
    }

    .mensagem--usuario .mensagem__bolha {
      background: linear-gradient(135deg, #10b981, #0e7490);
      color: white;
    }

    .mensagem__bolha--carregando {
      padding: 16px 20px;
    }

    .mensagem__texto {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: inherit;
    }

    .mensagem__hora {
      display: block;
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
    }

    .digitando {
      display: flex;
      gap: 4px;
      align-items: center;
      justify-content: center;
    }

    .digitando span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
      animation: bounce 1.4s infinite;
    }

    .digitando span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .digitando span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes bounce {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-8px);
      }
    }

    .chat__form {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .chat__input {
      flex: 1;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }

    .chat__input:focus {
      outline: none;
      border-color: #10b981;
    }

    .chat__input:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }

    .chat__botao-enviar {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #0e7490);
      color: white;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat__botao-enviar:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .chat__botao-enviar:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .chat-container {
        bottom: 1rem;
        right: 1rem;
      }

      .chat__janela {
        width: calc(100vw - 2rem);
        height: calc(100vh - 160px);
        bottom: 70px;
      }
    }
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ChatIAComponent {
  private readonly geminiService = inject(GeminiService);

  aberto = signal(false);
  mensagens = signal<Mensagem[]>([]);
  carregando = signal(false);
  mensagensNaoLidas = signal(0);
  perguntaAtual = '';

  
  private readonly autoScrollEffect = effect(() => {
    const msgs = this.mensagens();
    if (msgs.length > 0) {
      setTimeout(() => this.scrollParaFinal(), 100);
    }
  });

  toggleChat(): void {
    this.aberto.update(v => !v);
    
    if (this.aberto()) {
      this.mensagensNaoLidas.set(0);
      setTimeout(() => {
        const input = document.querySelector('.chat__input') as HTMLInputElement;
        input?.focus();
      }, 300);
    }
  }

  enviarSugestao(texto: string): void {
    this.perguntaAtual = texto;
    this.enviar(new Event('submit'));
  }

  enviar(event: Event): void {
    event.preventDefault();
    
    const pergunta = this.perguntaAtual.trim();
    if (!pergunta || this.carregando()) {
      return;
    }

    
    this.mensagens.update(msgs => [
      ...msgs,
      {
        texto: pergunta,
        usuario: true,
        timestamp: new Date(),
      }
    ]);

    this.perguntaAtual = '';
    this.carregando.set(true);

    
    const contexto = this.geminiService.gerarContextoApp({
      
    });

    
    this.geminiService.perguntar(pergunta, contexto).subscribe({
      next: (resposta) => {
        this.mensagens.update(msgs => [
          ...msgs,
          {
            texto: resposta,
            usuario: false,
            timestamp: new Date(),
          }
        ]);

        if (!this.aberto()) {
          this.mensagensNaoLidas.update(n => n + 1);
        }

        this.carregando.set(false);
      },
      error: (erro) => {
        console.error('❌ Erro ao enviar pergunta:', erro);
        this.mensagens.update(msgs => [
          ...msgs,
          {
            texto: '❌ Desculpe, ocorreu um erro. Tente novamente.',
            usuario: false,
            timestamp: new Date(),
          }
        ]);
        this.carregando.set(false);
      }
    });
  }

  limparConversa(): void {
    if (confirm('Deseja limpar toda a conversa?')) {
      this.mensagens.set([]);
    }
  }

  formatarHora(data: Date): string {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private scrollParaFinal(): void {
    const container = document.querySelector('.chat__mensagens');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
