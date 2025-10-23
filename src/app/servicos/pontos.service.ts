import { Injectable, signal, computed, inject, effect } from '@angular/core';
import {
  UsuarioPontos,
  NivelUsuario,
  Badge,
  TipoBadge,
  Desafio,
  TipoDesafio,
  EstatisticasUsuario,
  CalculoPontos,
  PONTOS_POR_KM,
  MULTIPLICADORES,
  calcularNivel,
  calcularProgressoNivel,
  pontosParaProximoNivel,
  CONFIGURACOES_NIVEIS,
} from '../modelos/pontos';
import { RotaCalculada } from '../modelos/rota-calculada';
import { PontoInteresse, CategoriaPOI } from '../modelos/ponto-interesse';
import { TipoModal } from '../modelos/modal';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

const CHAVE_STORAGE = 'mindway-pontos-usuario';
const CHAVE_HISTORICO = 'mindway-historico-rotas';


@Injectable({
  providedIn: 'root'
})
export class PontosService {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  
  
  private usuarioState = signal<UsuarioPontos | null>(null);
  private syncAtivo = signal(false);
  private unsubscribeFirestore?: () => void;
  
  
  usuario = computed(() => this.usuarioState());
  pontos = computed(() => this.usuarioState()?.pontos ?? 0);
  nivel = computed(() => this.usuarioState()?.nivel ?? NivelUsuario.INICIANTE);
  badges = computed(() => this.usuarioState()?.badges ?? []);
  desafios = computed(() => this.usuarioState()?.desafios ?? []);
  estatisticas = computed(() => this.usuarioState()?.estatisticas);
  
  
  progressoNivel = computed(() => {
    const pts = this.pontos();
    const niv = this.nivel();
    return calcularProgressoNivel(pts, niv);
  });
  
  pontosProximoNivel = computed(() => {
    const pts = this.pontos();
    const niv = this.nivel();
    return pontosParaProximoNivel(pts, niv);
  });

  constructor() {
    this.carregarUsuario();
    this.verificarDesafiosExpirados();
    
    
    effect(() => {
      const usuarioAuth = this.authService.usuario();
      if (usuarioAuth) {
        this.iniciarSyncFirebase(usuarioAuth.uid);
      } else {
        this.pararSyncFirebase();
      }
    });
  }

  
  private carregarUsuario(): void {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      if (salvo) {
        const dados = JSON.parse(salvo);
        
        
        dados.estatisticas.areasVerdesVisitadas = new Set(dados.estatisticas.areasVerdesVisitadas);
        dados.estatisticas.pontosReferenciaVisitados = new Set(dados.estatisticas.pontosReferenciaVisitados);
        dados.estatisticas.ultimaRotaData = dados.estatisticas.ultimaRotaData 
          ? new Date(dados.estatisticas.ultimaRotaData) 
          : null;
        dados.criadoEm = new Date(dados.criadoEm);
        dados.atualizadoEm = new Date(dados.atualizadoEm);
        
        
        dados.badges.forEach((b: Badge) => {
          if (b.desbloqueadoEm) b.desbloqueadoEm = new Date(b.desbloqueadoEm);
        });
        dados.desafios.forEach((d: Desafio) => {
          d.expiraEm = new Date(d.expiraEm);
        });
        
        console.log('✅ [Pontos] Usuário carregado:', dados.nome, dados.pontos, 'pts');
        this.usuarioState.set(dados);
      } else {
        console.log('🆕 [Pontos] Criando novo usuário...');
        this.criarNovoUsuario();
      }
    } catch (erro) {
      console.error('❌ [Pontos] Erro ao carregar usuário:', erro);
      this.criarNovoUsuario();
    }
  }

  
  private criarNovoUsuario(): void {
    const usuario: UsuarioPontos = {
      id: this.gerarId(),
      nome: 'Ciclista',
      pontos: 0,
      nivel: NivelUsuario.INICIANTE,
      badges: [],
      desafios: this.gerarDesafiosSemanais(),
      estatisticas: {
        kmBike: 0,
        kmCaminhada: 0,
        kmBikeCompartilhada: 0,
        kmTotal: 0,
        co2Evitado: 0,
        economiaFinanceira: 0,
        areasVerdesVisitadas: new Set(),
        pontosReferenciaVisitados: new Set(),
        ganhoElevacaoTotal: 0,
        rotasCompletadas: 0,
        rotasFavoritas: 0,
        streakDias: 0,
        ultimaRotaData: null,
        scoreMedioSustentabilidade: 0,
      },
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };

    this.usuarioState.set(usuario);
    this.salvarUsuario();
    console.log('✅ [Pontos] Novo usuário criado!');
  }

  
  private salvarUsuario(): void {
    const usuario = this.usuarioState();
    if (!usuario) return;

    try {
      
      const dadosParaSalvar = {
        ...usuario,
        estatisticas: {
          ...usuario.estatisticas,
          areasVerdesVisitadas: Array.from(usuario.estatisticas.areasVerdesVisitadas),
          pontosReferenciaVisitados: Array.from(usuario.estatisticas.pontosReferenciaVisitados),
        },
      };

      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dadosParaSalvar));
      
      
      this.salvarNaNuvem();
    } catch (erro) {
      console.error('❌ [Pontos] Erro ao salvar usuário:', erro);
    }
  }

  
  adicionarPontosRota(
    rota: RotaCalculada,
    pois: PontoInteresse[],
    scoreSustentabilidade: number | null,
    ganhoElevacao?: number
  ): CalculoPontos {
    const usuario = this.usuarioState();
    if (!usuario) {
      console.warn('⚠️ [Pontos] Usuário não inicializado');
      return this.calculoPontosVazio();
    }

    
    const calculo = this.calcularPontos(rota, scoreSustentabilidade, ganhoElevacao);

    
    usuario.pontos += calculo.pontosTotal;
    usuario.atualizadoEm = new Date();

    
    this.atualizarEstatisticas(usuario, rota, pois, scoreSustentabilidade, ganhoElevacao);

    
    usuario.nivel = calcularNivel(usuario.pontos);

    
    this.verificarBadges(usuario);

    
    this.atualizarDesafios(usuario, rota, pois);

    
    this.usuarioState.set(usuario);
    this.salvarUsuario();
    this.salvarHistoricoRota(rota, calculo.pontosTotal, ganhoElevacao);

    console.log(`✅ [Pontos] +${calculo.pontosTotal} pontos! Total: ${usuario.pontos}`);

    return calculo;
  }

  
  private calcularPontos(
    rota: RotaCalculada,
    scoreSustentabilidade: number | null,
    ganhoElevacao?: number
  ): CalculoPontos {
    const detalhes: string[] = [];
    let pontosBase = 0;

    
    if (rota.segmentos && rota.segmentos.length > 0) {
      rota.segmentos.forEach(seg => {
        const km = seg.distanciaMetros / 1000;
        let pts = 0;

        if (seg.modal === TipoModal.BICICLETA) {
          pts = km * PONTOS_POR_KM.BIKE;
          detalhes.push(`🚴 ${km.toFixed(1)}km bike: +${pts.toFixed(0)} pts`);
        } else if (seg.modal === TipoModal.CAMINHADA) {
          pts = km * PONTOS_POR_KM.CAMINHADA;
          detalhes.push(`🚶 ${km.toFixed(1)}km caminhada: +${pts.toFixed(0)} pts`);
        } else if (seg.modal === TipoModal.BICICLETA_COMPARTILHADA) {
          pts = km * PONTOS_POR_KM.BIKE_COMPARTILHADA;
          detalhes.push(`🚲 ${km.toFixed(1)}km bike compartilhada: +${pts.toFixed(0)} pts`);
        } else if (seg.modal === TipoModal.ONIBUS || seg.modal === TipoModal.METRO || seg.modal === TipoModal.TREM) {
          pts = km * PONTOS_POR_KM.BIKE_COMPARTILHADA; 
          detalhes.push(`🚌 ${km.toFixed(1)}km transporte público: +${pts.toFixed(0)} pts`);
        } else if (seg.modal === TipoModal.CARRO) {
          
          pts = 0;
          detalhes.push(`🚗 ${km.toFixed(1)}km carro: +0 pts (sem bônus)`);
        } else {
          
          pts = km * PONTOS_POR_KM.CAMINHADA;
          detalhes.push(`� ${km.toFixed(1)}km: +${pts.toFixed(0)} pts`);
        }

        pontosBase += pts;
      });
    } else {
      
      pontosBase = 0;
      const km = rota.distanciaMetros / 1000;
      detalhes.push(`⚠️ Rota sem modal sustentável (${km.toFixed(1)}km): +0 pts`);
    }

    
    let bonusAmbiental = 0;
    if (scoreSustentabilidade !== null && scoreSustentabilidade > 0) {
      bonusAmbiental = scoreSustentabilidade * 0.5;
      detalhes.push(`🌿 Score ${scoreSustentabilidade}/100: +${bonusAmbiental.toFixed(0)} pts`);
    }

    
    let bonusElevacao = 0;
    if (ganhoElevacao && ganhoElevacao > 0) {
      bonusElevacao = ganhoElevacao / 10;
      detalhes.push(`⛰️ ${ganhoElevacao.toFixed(0)}m subida: +${bonusElevacao.toFixed(0)} pts`);
    }

    
    let bonusHorario = 0;
    const hora = new Date().getHours();
    const dia = new Date().getDay();

    
    if ((hora >= 7 && hora < 10) || (hora >= 17 && hora < 20)) {
      bonusHorario = pontosBase * (MULTIPLICADORES.RUSH_HOUR - 1);
      detalhes.push(`⏰ Rush hour: +${bonusHorario.toFixed(0)} pts (+20%)`);
    }
    
    else if (hora < 6) {
      bonusHorario = pontosBase * (MULTIPLICADORES.MADRUGADA - 1);
      detalhes.push(`🌅 Madrugador: +${bonusHorario.toFixed(0)} pts (+30%)`);
    }
    
    else if (hora >= 20) {
      bonusHorario = pontosBase * (MULTIPLICADORES.NOTURNO - 1);
      detalhes.push(`🌙 Noturno: +${bonusHorario.toFixed(0)} pts (+15%)`);
    }

    
    if (dia === 0 || dia === 6) {
      const bonusFds = pontosBase * (MULTIPLICADORES.FIM_SEMANA - 1);
      bonusHorario += bonusFds;
      detalhes.push(`🎉 Fim de semana: +${bonusFds.toFixed(0)} pts (+10%)`);
    }

    
    let bonusStreak = 0;
    const usuario = this.usuarioState();
    if (usuario) {
      const streak = usuario.estatisticas.streakDias;
      if (streak >= 30) {
        bonusStreak = pontosBase * (MULTIPLICADORES.STREAK_30 - 1);
        detalhes.push(`🔥 Streak 30 dias: +${bonusStreak.toFixed(0)} pts (+25%)`);
      } else if (streak >= 7) {
        bonusStreak = pontosBase * (MULTIPLICADORES.STREAK_7 - 1);
        detalhes.push(`🔥 Streak 7 dias: +${bonusStreak.toFixed(0)} pts (+10%)`);
      }
    }

    const pontosTotal = Math.round(
      pontosBase + bonusAmbiental + bonusElevacao + bonusHorario + bonusStreak
    );

    return {
      pontosBase: Math.round(pontosBase),
      bonusAmbiental: Math.round(bonusAmbiental),
      bonusElevacao: Math.round(bonusElevacao),
      bonusHorario: Math.round(bonusHorario),
      bonusStreak: Math.round(bonusStreak),
      pontosTotal,
      detalhes,
    };
  }

  
  private atualizarEstatisticas(
    usuario: UsuarioPontos,
    rota: RotaCalculada,
    pois: PontoInteresse[],
    scoreSustentabilidade: number | null,
    ganhoElevacao?: number
  ): void {
    const stats = usuario.estatisticas;
    const km = rota.distanciaMetros / 1000;

    
    if (rota.segmentos && rota.segmentos.length > 0) {
      rota.segmentos.forEach(seg => {
        const segKm = seg.distanciaMetros / 1000;
        if (seg.modal === TipoModal.BICICLETA) {
          stats.kmBike += segKm;
        } else if (seg.modal === TipoModal.CAMINHADA) {
          stats.kmCaminhada += segKm;
        } else if (seg.modal === TipoModal.BICICLETA_COMPARTILHADA) {
          stats.kmBikeCompartilhada += segKm;
        } else {
          
          stats.kmBike += segKm;
        }
      });
    } else {
      
      stats.kmBike += km;
    }

    stats.kmTotal = stats.kmBike + stats.kmCaminhada + stats.kmBikeCompartilhada;

    
    stats.co2Evitado += km * 0.12;

    
    stats.economiaFinanceira += km * 0.50;

    
    pois
      .filter(p => p.categoria === CategoriaPOI.DESCANSO)
      .forEach(p => stats.areasVerdesVisitadas.add(p.id));

    
    pois
      .filter(p => p.categoria === CategoriaPOI.REFERENCIA)
      .forEach(p => stats.pontosReferenciaVisitados.add(p.id));

    
    if (ganhoElevacao) {
      stats.ganhoElevacaoTotal += ganhoElevacao;
    }

    
    stats.rotasCompletadas++;

    
    if (scoreSustentabilidade !== null) {
      const totalRotas = stats.rotasCompletadas;
      stats.scoreMedioSustentabilidade =
        (stats.scoreMedioSustentabilidade * (totalRotas - 1) + scoreSustentabilidade) / totalRotas;
    }

    
    this.atualizarStreak(stats);
  }

  
  private atualizarStreak(stats: EstatisticasUsuario): void {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (stats.ultimaRotaData) {
      const ultimaData = new Date(stats.ultimaRotaData);
      ultimaData.setHours(0, 0, 0, 0);

      const diffDias = Math.floor((hoje.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias === 0) {
        
      } else if (diffDias === 1) {
        
        stats.streakDias++;
      } else {
        
        stats.streakDias = 1;
      }
    } else {
      stats.streakDias = 1;
    }

    stats.ultimaRotaData = new Date();
  }

  
  private verificarBadges(usuario: UsuarioPontos): void {
    const stats = usuario.estatisticas;
    const badgesDesbloqueados: TipoBadge[] = usuario.badges.map(b => b.tipo);

    
    const todosBadges: Partial<Record<TipoBadge, Badge>> = {
      [TipoBadge.PRIMEIRA_ROTA]: {
        tipo: TipoBadge.PRIMEIRA_ROTA,
        nome: 'Primeira Pedalada',
        descricao: 'Complete sua primeira rota',
        emoji: '🎯',
        requisito: '1 rota',
        pontosBonus: 50,
        raridade: 'comum',
      },
      [TipoBadge.KM_100]: {
        tipo: TipoBadge.KM_100,
        nome: 'Centurião',
        descricao: 'Percorra 100km',
        emoji: '💯',
        requisito: '100 km',
        pontosBonus: 500,
        raridade: 'raro',
      },
      [TipoBadge.KM_500]: {
        tipo: TipoBadge.KM_500,
        nome: 'Maratonista',
        descricao: 'Percorra 500km',
        emoji: '🏃',
        requisito: '500 km',
        pontosBonus: 1000,
        raridade: 'epico',
      },
      [TipoBadge.EXPLORADOR_VERDE]: {
        tipo: TipoBadge.EXPLORADOR_VERDE,
        nome: 'Explorador Verde',
        descricao: 'Visite 10 áreas verdes',
        emoji: '🌳',
        requisito: '10 áreas verdes',
        pontosBonus: 200,
        raridade: 'comum',
      },
      [TipoBadge.TURISTA_CULTURAL]: {
        tipo: TipoBadge.TURISTA_CULTURAL,
        nome: 'Turista Cultural',
        descricao: 'Visite 5 pontos turísticos',
        emoji: '🏛️',
        requisito: '5 pontos turísticos',
        pontosBonus: 150,
        raridade: 'comum',
      },
      [TipoBadge.ECO_WARRIOR]: {
        tipo: TipoBadge.ECO_WARRIOR,
        nome: 'Eco-Guerreiro',
        descricao: 'Evite 50kg de CO₂',
        emoji: '♻️',
        requisito: '50 kg CO₂',
        pontosBonus: 300,
        raridade: 'raro',
      },
      [TipoBadge.STREAK_7]: {
        tipo: TipoBadge.STREAK_7,
        nome: 'Dedicado',
        descricao: '7 dias consecutivos',
        emoji: '🔥',
        requisito: '7 dias',
        pontosBonus: 150,
        raridade: 'raro',
      },
      [TipoBadge.ESCALADOR]: {
        tipo: TipoBadge.ESCALADOR,
        nome: 'Escalador',
        descricao: 'Suba 500m acumulados',
        emoji: '⛰️',
        requisito: '500m elevação',
        pontosBonus: 250,
        raridade: 'raro',
      },
    };

    
    Object.entries(todosBadges).forEach(([tipo, badge]) => {
      if (badgesDesbloqueados.includes(tipo as TipoBadge)) return;

      let desbloquear = false;

      switch (tipo as TipoBadge) {
        case TipoBadge.PRIMEIRA_ROTA:
          desbloquear = stats.rotasCompletadas >= 1;
          break;
        case TipoBadge.KM_100:
          desbloquear = stats.kmTotal >= 100;
          break;
        case TipoBadge.KM_500:
          desbloquear = stats.kmTotal >= 500;
          break;
        case TipoBadge.EXPLORADOR_VERDE:
          desbloquear = stats.areasVerdesVisitadas.size >= 10;
          break;
        case TipoBadge.TURISTA_CULTURAL:
          desbloquear = stats.pontosReferenciaVisitados.size >= 5;
          break;
        case TipoBadge.ECO_WARRIOR:
          desbloquear = stats.co2Evitado >= 50;
          break;
        case TipoBadge.STREAK_7:
          desbloquear = stats.streakDias >= 7;
          break;
        case TipoBadge.ESCALADOR:
          desbloquear = stats.ganhoElevacaoTotal >= 500;
          break;
      }

      if (desbloquear && badge) {
        badge.desbloqueadoEm = new Date();
        usuario.badges.push(badge);
        usuario.pontos += badge.pontosBonus;
        console.log(`🏆 [Badge] Desbloqueado: ${badge.nome} (+${badge.pontosBonus} pts)`);
      }
    });
  }

  
  private atualizarDesafios(
    usuario: UsuarioPontos,
    rota: RotaCalculada,
    pois: PontoInteresse[]
  ): void {
    
    
  }

  
  private gerarDesafiosSemanais(): Desafio[] {
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);

    return [
      {
        id: 'semanal-km',
        tipo: TipoDesafio.SEMANAL,
        nome: 'Explorador Urbano',
        descricao: 'Percorra 20km esta semana',
        emoji: '🚴',
        meta: 20,
        progresso: 0,
        pontosRecompensa: 100,
        expiraEm: proximaSemana,
        concluido: false,
      },
      {
        id: 'semanal-areas-verdes',
        tipo: TipoDesafio.SEMANAL,
        nome: 'Caçador de Natureza',
        descricao: 'Visite 3 áreas verdes diferentes',
        emoji: '🌳',
        meta: 3,
        progresso: 0,
        pontosRecompensa: 80,
        expiraEm: proximaSemana,
        concluido: false,
      },
    ];
  }

  
  private verificarDesafiosExpirados(): void {
    const usuario = this.usuarioState();
    if (!usuario) return;

    const agora = new Date();
    usuario.desafios = usuario.desafios.filter(d => d.expiraEm > agora);
    
    
    if (usuario.desafios.length === 0) {
      usuario.desafios = this.gerarDesafiosSemanais();
      this.salvarUsuario();
    }
  }

  
  private salvarHistoricoRota(rota: RotaCalculada, pontos: number, ganhoElevacao?: number): void {
    try {
      const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO) || '[]');
      historico.push({
        data: new Date(),
        distanciaKm: rota.distanciaMetros / 1000,
        pontos,
        elevacao: ganhoElevacao || 0,
      });

      
      if (historico.length > 100) {
        historico.shift();
      }

      localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
    } catch (erro) {
      console.warn('⚠️ [Pontos] Erro ao salvar histórico:', erro);
    }
  }

  
  resetarPontos(): void {
    localStorage.removeItem(CHAVE_STORAGE);
    localStorage.removeItem(CHAVE_HISTORICO);
    this.criarNovoUsuario();
    console.log('🔄 [Pontos] Dados resetados!');
  }

  
  private async iniciarSyncFirebase(uid: string): Promise<void> {
    if (this.syncAtivo()) {
      return; 
    }

    
    if (!this.authService.estaAutenticado() || !uid) {
      console.log('⚠️ [Pontos] Sync cancelado - sem autenticação');
      return;
    }

    console.log('🔄 [Pontos] Iniciando sync com Firebase...');
    this.syncAtivo.set(true);

    try {
      
      const dadosNuvem = await this.firestoreService.carregarUsuario(uid);
      const dadosLocal = this.usuarioState();

      if (dadosNuvem && dadosLocal) {
        
        const dadosMesclados = this.mesclarDados(dadosLocal, dadosNuvem);
        this.usuarioState.set(dadosMesclados);
        this.salvarUsuario();
        
        
        await this.firestoreService.salvarUsuario(uid, dadosMesclados);
        console.log('✅ [Pontos] Dados mesclados e sincronizados');
      } else if (dadosNuvem) {
        
        this.usuarioState.set(dadosNuvem);
        this.salvarUsuario();
        console.log('✅ [Pontos] Dados carregados da nuvem');
      } else if (dadosLocal) {
        
        await this.firestoreService.salvarUsuario(uid, dadosLocal);
        console.log('✅ [Pontos] Dados locais enviados para nuvem');
      }

      
      this.unsubscribeFirestore = this.firestoreService.escutarUsuario(uid, (dados) => {
        if (dados) {
          this.usuarioState.set(dados);
          this.salvarUsuario();
          console.log('🔄 [Pontos] Dados atualizados da nuvem');
        }
      });

    } catch (erro: any) {
      
      if (erro?.code === 'permission-denied' || erro?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ [Pontos] Sync falhou - sem permissões Firebase');
      } else {
        console.error('❌ [Pontos] Erro ao iniciar sync:', erro);
      }
      this.syncAtivo.set(false);
    }
  }

  
  private pararSyncFirebase(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = undefined;
      console.log('🛑 [Pontos] Sync com Firebase parado');
    }
    this.syncAtivo.set(false);
  }

  
  private mesclarDados(local: UsuarioPontos, nuvem: UsuarioPontos): UsuarioPontos {
    
    const localMaisRecente = local.atualizadoEm > nuvem.atualizadoEm;

    if (localMaisRecente) {
      console.log('ℹ️ [Pontos] Dados locais mais recentes');
      return local;
    } else {
      console.log('ℹ️ [Pontos] Dados da nuvem mais recentes');
      return nuvem;
    }
  }

  
  private async salvarNaNuvem(): Promise<void> {
    const usuarioAuth = this.authService.usuario();
    const dadosUsuario = this.usuarioState();

    if (usuarioAuth && dadosUsuario && this.syncAtivo()) {
      try {
        await this.firestoreService.salvarUsuario(usuarioAuth.uid, dadosUsuario);
      } catch (erro) {
        console.error('❌ [Pontos] Erro ao salvar na nuvem:', erro);
      }
    }
  }

  
  private gerarId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculoPontosVazio(): CalculoPontos {
    return {
      pontosBase: 0,
      bonusAmbiental: 0,
      bonusElevacao: 0,
      bonusHorario: 0,
      bonusStreak: 0,
      pontosTotal: 0,
      detalhes: [],
    };
  }
}
