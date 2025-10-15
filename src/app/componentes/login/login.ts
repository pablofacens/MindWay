import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicos/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" [class.visivel]="visivel()" (click)="fecharModal($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        
                <div class="header">
          <h2>{{ modoRegistro() ? 'Criar Conta' : 'Entrar' }}</h2>
          <button class="btn-fechar" (click)="fechar()">×</button>
        </div>

                <div class="conteudo">
          
                    @if (erro()) {
            <div class="alerta alerta--erro">
              {{ erro() }}
            </div>
          }

                    @if (sucesso()) {
            <div class="alerta alerta--sucesso">
              {{ sucesso() }}
            </div>
          }

                    <form (submit)="onSubmit($event)">
            
            @if (modoRegistro()) {
              <div class="campo">
                <label for="nome">Nome</label>
                <input 
                  id="nome"
                  type="text" 
                  [(ngModel)]="nome" 
                  name="nome"
                  placeholder="Seu nome completo"
                  required>
              </div>
            }

            <div class="campo">
              <label for="email">Email</label>
              <input 
                id="email"
                type="email" 
                [(ngModel)]="email" 
                name="email"
                placeholder="seu@email.com"
                required>
            </div>

            <div class="campo">
              <label for="senha">Senha</label>
              <input 
                id="senha"
                type="password" 
                [(ngModel)]="senha" 
                name="senha"
                placeholder="••••••••"
                minlength="6"
                required>
            </div>

            @if (modoRegistro()) {
              <div class="campo">
                <label for="confirmarSenha">Confirmar Senha</label>
                <input 
                  id="confirmarSenha"
                  type="password" 
                  [(ngModel)]="confirmarSenha" 
                  name="confirmarSenha"
                  placeholder="••••••••"
                  minlength="6"
                  required>
              </div>
            }

            <button 
              type="submit" 
              class="btn btn--primario"
              [disabled]="carregando()">
              @if (carregando()) {
                <span class="spinner"></span>
                Processando...
              } @else {
                {{ modoRegistro() ? 'Criar Conta' : 'Entrar' }}
              }
            </button>
          </form>

                    <div class="divider">
            <span>ou</span>
          </div>

                    <button 
            class="btn btn--google"
            (click)="loginComGoogle()"
            [disabled]="carregando()">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar com Google
          </button>

                    <div class="rodape">
            @if (modoRegistro()) {
              <p>
                Já tem uma conta? 
                <button class="link" (click)="toggleModo()">Entrar</button>
              </p>
            } @else {
              <p>
                Não tem uma conta? 
                <button class="link" (click)="toggleModo()">Criar conta</button>
              </p>
              <button class="link" (click)="mostrarRecuperarSenha()">
                Esqueci minha senha
              </button>
            }
          </div>

        </div>
      </div>
    </div>
  `,
  })
export class LoginComponent {
  private authService = inject(AuthService);

  visivel = signal(false);
  modoRegistro = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  abrir(registro: boolean = false) {
    this.modoRegistro.set(registro);
    this.visivel.set(true);
    this.limparFormulario();
  }

  fechar() {
    this.visivel.set(false);
    setTimeout(() => this.limparFormulario(), 300);
  }

  fecharModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.fechar();
    }
  }

  toggleModo() {
    this.modoRegistro.set(!this.modoRegistro());
    this.limparErros();
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.limparErros();

    if (this.modoRegistro()) {
      await this.registrar();
    } else {
      await this.login();
    }
  }

  async login() {
    if (!this.email || !this.senha) {
      this.erro.set('Preencha todos os campos');
      return;
    }

    this.carregando.set(true);
    try {
      await this.authService.loginEmail(this.email, this.senha);
      this.sucesso.set('Login realizado com sucesso!');
      setTimeout(() => this.fechar(), 1500);
    } catch (erro: any) {
      this.erro.set(erro.message);
    } finally {
      this.carregando.set(false);
    }
  }

  async registrar() {
    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
      this.erro.set('Preencha todos os campos');
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro.set('As senhas não coincidem');
      return;
    }

    if (this.senha.length < 6) {
      this.erro.set('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    this.carregando.set(true);
    try {
      await this.authService.registrarEmail(this.email, this.senha, this.nome);
      this.sucesso.set('Conta criada! Verifique seu email para confirmar.');
      setTimeout(() => this.fechar(), 2000);
    } catch (erro: any) {
      this.erro.set(erro.message);
    } finally {
      this.carregando.set(false);
    }
  }

  async loginComGoogle() {
    this.limparErros();
    this.carregando.set(true);
    
    try {
      await this.authService.loginGoogle();
      this.sucesso.set('Login com Google realizado!');
      setTimeout(() => this.fechar(), 1500);
    } catch (erro: any) {
      this.erro.set(erro.message);
    } finally {
      this.carregando.set(false);
    }
  }

  async mostrarRecuperarSenha() {
    const email = prompt('Digite seu email para recuperar a senha:');
    if (email) {
      try {
        await this.authService.recuperarSenha(email);
        this.sucesso.set('Email de recuperação enviado! Verifique sua caixa de entrada.');
      } catch (erro: any) {
        this.erro.set(erro.message);
      }
    }
  }

  private limparFormulario() {
    this.nome = '';
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
    this.limparErros();
  }

  private limparErros() {
    this.erro.set(null);
    this.sucesso.set(null);
  }
}
