import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardPontosComponent } from '../dashboard-pontos/dashboard-pontos';
import { LoginComponent } from '../login/login';
import { AuthService } from '../../servicos/auth.service';

@Component({
  selector: 'app-pagina-perfil',
  standalone: true,
  imports: [CommonModule, DashboardPontosComponent, LoginComponent],
  template: `
    <div class="pagina-perfil">
      <div class="container">
        <div class="header">
          <h1>👤 Meu Perfil</h1>
        </div>

                <app-dashboard-pontos></app-dashboard-pontos>

                <app-login #modalLogin></app-login>
      </div>
    </div>
  `,
  })
export class PaginaPerfilComponent {
  authService = inject(AuthService);
  
  @ViewChild('modalLogin') modalLogin!: LoginComponent;

  abrirLogin() {
    this.modalLogin.abrir(false);
  }

  abrirRegistro() {
    this.modalLogin.abrir(true);
  }
}
