import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { UsuarioPontos } from '../modelos/pontos';


@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  
  async salvarUsuario(uid: string, dados: UsuarioPontos): Promise<void> {
    try {
      const ref = doc(this.firestore, 'usuarios', uid);
      
      
      const dadosSerializados = {
        ...dados,
        estatisticas: {
          ...dados.estatisticas,
          areasVerdesVisitadas: Array.from(dados.estatisticas.areasVerdesVisitadas),
          pontosReferenciaVisitados: Array.from(dados.estatisticas.pontosReferenciaVisitados),
        },
        atualizadoEm: serverTimestamp(),
      };

      await setDoc(ref, dadosSerializados, { merge: true });
      console.log('✅ [Firestore] Dados salvos na nuvem');
    } catch (erro) {
      console.error('❌ [Firestore] Erro ao salvar:', erro);
      throw erro;
    }
  }

  
  async carregarUsuario(uid: string): Promise<UsuarioPontos | null> {
    try {
      if (!uid) {
        console.warn('⚠️ [Firestore] UID inválido');
        return null;
      }

      const ref = doc(this.firestore, 'usuarios', uid);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const dados = snapshot.data() as any;
        
        
        dados.estatisticas.areasVerdesVisitadas = new Set(dados.estatisticas.areasVerdesVisitadas || []);
        dados.estatisticas.pontosReferenciaVisitados = new Set(dados.estatisticas.pontosReferenciaVisitados || []);
        dados.estatisticas.ultimaRotaData = dados.estatisticas.ultimaRotaData 
          ? new Date(dados.estatisticas.ultimaRotaData) 
          : null;
        dados.criadoEm = dados.criadoEm ? new Date(dados.criadoEm) : new Date();
        dados.atualizadoEm = dados.atualizadoEm ? new Date(dados.atualizadoEm) : new Date();

        
        dados.badges?.forEach((b: any) => {
          if (b.desbloqueadoEm) b.desbloqueadoEm = new Date(b.desbloqueadoEm);
        });

        
        dados.desafios?.forEach((d: any) => {
          if (d.expiraEm) d.expiraEm = new Date(d.expiraEm);
        });

        console.log('✅ [Firestore] Dados carregados da nuvem');
        return dados as UsuarioPontos;
      }

      console.log('ℹ️ [Firestore] Nenhum dado encontrado na nuvem');
      return null;
    } catch (erro: any) {
      
      if (erro?.code === 'permission-denied' || erro?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ [Firestore] Sem permissões - usuário não autenticado');
        return null;
      }
      console.error('❌ [Firestore] Erro ao carregar:', erro);
      return null; 
    }
  }

  
  async atualizarPontos(uid: string, pontos: number, nivel: string): Promise<void> {
    try {
      const ref = doc(this.firestore, 'usuarios', uid);
      await updateDoc(ref, {
        pontos,
        nivel,
        atualizadoEm: serverTimestamp()
      });
      console.log('✅ [Firestore] Pontos atualizados');
    } catch (erro) {
      console.error('❌ [Firestore] Erro ao atualizar pontos:', erro);
    }
  }

  
  escutarUsuario(uid: string, callback: (dados: UsuarioPontos | null) => void): Unsubscribe {
    const ref = doc(this.firestore, 'usuarios', uid);
    
    return onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data() as any;
        
        
        dados.estatisticas.areasVerdesVisitadas = new Set(dados.estatisticas.areasVerdesVisitadas || []);
        dados.estatisticas.pontosReferenciaVisitados = new Set(dados.estatisticas.pontosReferenciaVisitados || []);
        dados.estatisticas.ultimaRotaData = dados.estatisticas.ultimaRotaData 
          ? new Date(dados.estatisticas.ultimaRotaData) 
          : null;
        dados.criadoEm = dados.criadoEm ? new Date(dados.criadoEm) : new Date();
        dados.atualizadoEm = dados.atualizadoEm ? new Date(dados.atualizadoEm) : new Date();

        dados.badges?.forEach((b: any) => {
          if (b.desbloqueadoEm) b.desbloqueadoEm = new Date(b.desbloqueadoEm);
        });

        dados.desafios?.forEach((d: any) => {
          if (d.expiraEm) d.expiraEm = new Date(d.expiraEm);
        });

        console.log('🔄 [Firestore] Dados atualizados em tempo real');
        callback(dados as UsuarioPontos);
      } else {
        callback(null);
      }
    }, (erro) => {
      console.error('❌ [Firestore] Erro ao escutar:', erro);
    });
  }

  
  async buscarRanking(limite: number = 10): Promise<any[]> {
    try {
      const ref = collection(this.firestore, 'usuarios');
      const q = query(ref, where('pontos', '>', 0));
      const snapshot = await getDocs(q);
      
      const ranking = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          nome: doc.data()['nome'],
          pontos: doc.data()['pontos'],
          nivel: doc.data()['nivel'],
        }))
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, limite);

      return ranking;
    } catch (erro) {
      console.error('❌ [Firestore] Erro ao buscar ranking:', erro);
      return [];
    }
  }
}
