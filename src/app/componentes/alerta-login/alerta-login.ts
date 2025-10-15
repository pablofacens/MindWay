import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../servicos/auth.service';

@Component({
  selector: 'app-alerta-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!authService.estaAutenticado() && !dispensado()) {
      <div class="alerta-login">
        <button class="alerta-fechar" (click)="dispensar()" title="Dispensar">×</button>
        <div class="alerta-icone">🔐</div>
        <div class="alerta-conteudo">
          <h3>Faça login para salvar seu progresso</h3>
          <p>Entre ou crie uma conta para sincronizar seus pontos e conquistas na nuvem.</p>
          <button class="alerta-btn" (click)="irParaPerfil()">
            Fazer Login
          </button>
        </div>
      </div>
    }
  `,
  })
export class AlertaLoginComponent {
  authService = inject(AuthService);
  dispensado = signal(false);

  dispensar() {
    this.dispensado.set(true);
    
    sessionStorage.setItem('alerta-login-dispensado', 'true');
  }

  irParaPerfil() {
    window.dispatchEvent(new CustomEvent('mudanca-secao', { detail: 'perfil' }));
  }

  constructor() {
    
    const jaDispensado = sessionStorage.getItem('alerta-login-dispensado');
    if (jaDispensado) {
      this.dispensado.set(true);
    }
  }
}
