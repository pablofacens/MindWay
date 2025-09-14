import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alternador-camadas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap gap-2">
      <button
        (click)="alternarBicicletas()"
        [class]="obterClassesBotao(mostrarEstacoesBicicleta)"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
        <span class="flex items-center space-x-1">
          <span>🚲</span>
          <span>Bicicletas</span>
          @if(mostrarEstacoesBicicleta) {
            <span class="text-xs opacity-75">({{ contadorBikes }})</span>
          }
        </span>
      </button>
      
      <button
        (click)="alternarTransito()"
        [class]="obterClassesBotao(mostrarTransito)"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
        <span class="flex items-center space-x-1">
          <span>🚦</span>
          <span>Trânsito</span>
          @if(mostrarTransito) {
            <span class="text-xs opacity-75">(ativo)</span>
          }
        </span>
      </button>
      
      <button
        (click)="alternarOnibus()"
        [class]="obterClassesBotao(mostrarOnibus)"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
        <span class="flex items-center space-x-1">
          <span>🚌</span>
          <span>Ônibus</span>
          @if(mostrarOnibus) {
            <span class="text-xs opacity-75">({{ contadorOnibus }})</span>
          }
        </span>
      </button>

      <!-- Botão adicional para pontos de interesse -->
      <button
        (click)="alternarPontosInteresse()"
        [class]="obterClassesBotao(mostrarPontosInteresse)"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
        <span class="flex items-center space-x-1">
          <span>📍</span>
          <span>POI</span>
        </span>
      </button>
    </div>

    <!-- Legendas quando ativo -->
    @if(mostrarLegendas()) {
      <div class="mt-3 p-3 bg-gray-50 rounded-lg">
        <div class="text-xs text-gray-600">
          <div class="font-medium mb-1">Legenda:</div>
          <div class="grid grid-cols-2 gap-2">
            @if(mostrarEstacoesBicicleta) {
              <div class="flex items-center space-x-1">
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Estações de bike</span>
              </div>
            }
            @if(mostrarOnibus) {
              <div class="flex items-center space-x-1">
                <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span>Pontos de ônibus</span>
              </div>
            }
            @if(mostrarTransito) {
              <div class="flex items-center space-x-1">
                <span class="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>Trânsito intenso</span>
              </div>
              <div class="flex items-center space-x-1">
                <span class="w-3 h-3 bg-orange-400 rounded-full"></span>
                <span>Trânsito moderado</span>
              </div>
            }
            @if(mostrarPontosInteresse) {
              <div class="flex items-center space-x-1">
                <span class="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span>Terminais/Estações</span>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Informações adicionais sobre as camadas ativas -->
    @if(informacoesExtras()) {
      <div class="mt-2 text-xs text-gray-500">
        {{ informacoesExtras() }}
      </div>
    }
  `
})
export class AlternadorCamadasComponent {
  @Input() mostrarEstacoesBicicleta = false;
  @Input() mostrarTransito = false;
  @Input() mostrarOnibus = false;
  @Input() mostrarPontosInteresse = false;
  
  // Contadores opcionais para mostrar quantos elementos estão visíveis
  @Input() contadorBikes = 0;
  @Input() contadorOnibus = 0;
  
  @Output() alternarBicicletasEvento = new EventEmitter<void>();
  @Output() alternarTransitoEvento = new EventEmitter<void>();
  @Output() alternarOnibusEvento = new EventEmitter<void>();
  @Output() alternarPontosInteresseEvento = new EventEmitter<void>();

  alternarBicicletas(): void {
    this.alternarBicicletasEvento.emit();
  }

  alternarTransito(): void {
    this.alternarTransitoEvento.emit();
  }

  alternarOnibus(): void {
    this.alternarOnibusEvento.emit();
  }

  alternarPontosInteresse(): void {
    this.alternarPontosInteresseEvento.emit();
  }

  obterClassesBotao(ativo: boolean): string {
    const classesBase = 'transition-all duration-200 hover:scale-105';
    
    if (ativo) {
      return `${classesBase} bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md`;
    }
    return `${classesBase} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  }

  mostrarLegendas(): boolean {
    return this.mostrarEstacoesBicicleta || this.mostrarTransito || 
           this.mostrarOnibus || this.mostrarPontosInteresse;
  }

  informacoesExtras(): string {
    const camadasAtivas = [];
    
    if (this.mostrarEstacoesBicicleta) {
      camadasAtivas.push('bicicletas');
    }
    if (this.mostrarOnibus) {
      camadasAtivas.push('ônibus');
    }
    if (this.mostrarTransito) {
      camadasAtivas.push('trânsito');
    }
    if (this.mostrarPontosInteresse) {
      camadasAtivas.push('pontos de interesse');
    }

    if (camadasAtivas.length === 0) {
      return 'Clique nos botões para mostrar informações no mapa.';
    }

    if (camadasAtivas.length === 1) {
      return `Mostrando: ${camadasAtivas[0]}.`;
    }

    const ultimas = camadasAtivas.pop();
    return `Mostrando: ${camadasAtivas.join(', ')} e ${ultimas}.`;
  }
}