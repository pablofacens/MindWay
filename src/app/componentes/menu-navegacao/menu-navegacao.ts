import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../servicos/auth.service';

type SecaoApp = 'mapa' | 'sobre' | 'analise' | 'conquistas' | 'estatisticas' | 'perfil';

@Component({
  selector: 'app-menu-navegacao',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="menu-navegacao">
      <div class="menu-container">
                <div class="logo">
          <span class="logo-icone">🚴</span>
          <span class="logo-texto">MindWay</span>
        </div>

                <div class="menu-links">
          <button 
            class="menu-item"
            [class.ativo]="secaoAtiva() === 'mapa'"
            (click)="mudarSecao('mapa')">
            <span class="item-icone">🗺️</span>
            <span class="item-texto">Mapa</span>
          </button>

          <button 
            class="menu-item"
            [class.ativo]="secaoAtiva() === 'analise'"
            (click)="mudarSecao('analise')">
            <span class="item-icone">📊</span>
            <span class="item-texto">Análise</span>
          </button>

          <button 
            class="menu-item"
            [class.ativo]="secaoAtiva() === 'conquistas'"
            (click)="mudarSecao('conquistas')">
            <span class="item-icone">🏆</span>
            <span class="item-texto">Conquistas</span>
          </button>

          <button 
            class="menu-item"
            [class.ativo]="secaoAtiva() === 'estatisticas'"
            (click)="mudarSecao('estatisticas')">
            <span class="item-icone">�</span>
            <span class="item-texto">Stats</span>
          </button>

          <button 
            class="menu-item"
            [class.ativo]="secaoAtiva() === 'sobre'"
            (click)="mudarSecao('sobre')">
            <span class="item-icone">ℹ️</span>
            <span class="item-texto">Sobre</span>
          </button>
        </div>

                <div class="menu-perfil">
          <button 
            class="menu-item menu-item--perfil"
            [class.ativo]="secaoAtiva() === 'perfil'"
            (click)="mudarSecao('perfil')">
            @if (authService.usuario(); as user) {
              @if (user.foto) {
                <img [src]="user.foto" alt="Perfil" class="perfil-avatar">
              } @else {
                <div class="perfil-avatar-placeholder">
                  {{ (user.nome && user.nome.charAt(0).toUpperCase()) || '?' }}
                </div>
              }
              <span class="item-texto">{{ user.nome || 'Perfil' }}</span>
            } @else {
              <span class="item-icone">👤</span>
              <span class="item-texto">Entrar</span>
            }
          </button>
        </div>
      </div>
    </nav>
  `,
  })
export class MenuNavegacaoComponent {
  authService = inject(AuthService);
  secaoAtiva = signal<SecaoApp>('mapa');

  mudarSecao(secao: SecaoApp) {
    this.secaoAtiva.set(secao);
    
    window.dispatchEvent(new CustomEvent('mudanca-secao', { detail: secao }));
  }
}
