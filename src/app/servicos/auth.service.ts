import { Injectable, signal, computed } from '@angular/core';
import { 
  Auth, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from '@angular/fire/auth';

export interface UsuarioAuth {
  uid: string;
  email: string | null;
  nome: string | null;
  foto: string | null;
  emailVerificado: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioState = signal<UsuarioAuth | null>(null);
  private carregandoState = signal(true);

  
  usuario = computed(() => this.usuarioState());
  estaAutenticado = computed(() => this.usuarioState() !== null);
  carregando = computed(() => this.carregandoState());

  constructor(private auth: Auth) {
    
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.usuarioState.set(this.mapearUsuario(user));
        console.log('✅ [Auth] Usuário autenticado:', user.email);
      } else {
        this.usuarioState.set(null);
        console.log('🚪 [Auth] Usuário não autenticado');
      }
      this.carregandoState.set(false);
    });
  }

  
  async loginEmail(email: string, senha: string): Promise<void> {
    try {
      const credencial = await signInWithEmailAndPassword(this.auth, email, senha);
      console.log('✅ [Auth] Login realizado:', credencial.user.email);
    } catch (erro: any) {
      console.error('❌ [Auth] Erro no login:', erro);
      throw this.traduzirErro(erro);
    }
  }

  
  async registrarEmail(email: string, senha: string, nome: string): Promise<void> {
    try {
      const credencial = await createUserWithEmailAndPassword(this.auth, email, senha);
      
      
      if (credencial.user) {
        await updateProfile(credencial.user, { displayName: nome });
        
        
        await sendEmailVerification(credencial.user);
        
        console.log('✅ [Auth] Registro realizado:', credencial.user.email);
      }
    } catch (erro: any) {
      console.error('❌ [Auth] Erro no registro:', erro);
      throw this.traduzirErro(erro);
    }
  }

  
  async loginGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const credencial = await signInWithPopup(this.auth, provider);
      console.log('✅ [Auth] Login Google realizado:', credencial.user.email);
    } catch (erro: any) {
      console.error('❌ [Auth] Erro no login Google:', erro);
      throw this.traduzirErro(erro);
    }
  }

  
  async recuperarSenha(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('✅ [Auth] Email de recuperação enviado para:', email);
    } catch (erro: any) {
      console.error('❌ [Auth] Erro ao recuperar senha:', erro);
      throw this.traduzirErro(erro);
    }
  }

  
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('🚪 [Auth] Logout realizado');
    } catch (erro: any) {
      console.error('❌ [Auth] Erro no logout:', erro);
      throw this.traduzirErro(erro);
    }
  }

  
  async reenviarEmailVerificacao(): Promise<void> {
    const user = this.auth.currentUser;
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        console.log('✅ [Auth] Email de verificação reenviado');
      } catch (erro: any) {
        console.error('❌ [Auth] Erro ao reenviar email:', erro);
        throw this.traduzirErro(erro);
      }
    }
  }

  
  private mapearUsuario(user: User): UsuarioAuth {
    return {
      uid: user.uid,
      email: user.email,
      nome: user.displayName,
      foto: user.photoURL,
      emailVerificado: user.emailVerified
    };
  }

  
  private traduzirErro(erro: any): Error {
    const codigo = erro.code;
    let mensagem = 'Erro desconhecido';

    switch (codigo) {
      case 'auth/email-already-in-use':
        mensagem = 'Este email já está em uso';
        break;
      case 'auth/invalid-email':
        mensagem = 'Email inválido';
        break;
      case 'auth/operation-not-allowed':
        mensagem = 'Operação não permitida';
        break;
      case 'auth/weak-password':
        mensagem = 'Senha muito fraca (mínimo 6 caracteres)';
        break;
      case 'auth/user-disabled':
        mensagem = 'Usuário desabilitado';
        break;
      case 'auth/user-not-found':
        mensagem = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
        mensagem = 'Senha incorreta';
        break;
      case 'auth/invalid-credential':
        mensagem = 'Credenciais inválidas';
        break;
      case 'auth/too-many-requests':
        mensagem = 'Muitas tentativas. Tente novamente mais tarde';
        break;
      case 'auth/network-request-failed':
        mensagem = 'Erro de conexão. Verifique sua internet';
        break;
      case 'auth/popup-closed-by-user':
        mensagem = 'Login cancelado pelo usuário';
        break;
      default:
        mensagem = erro.message || 'Erro ao processar solicitação';
    }

    return new Error(mensagem);
  }
}
