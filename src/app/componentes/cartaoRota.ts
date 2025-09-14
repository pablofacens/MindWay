import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Rota } from '../servicos/servicoRotas';

@Component({
  selector: 'app-cartao-rota',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      (click)="selecionarRota()"
      [class]="obterClassesCartao()"
      class="p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md">
      
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-2">
          <span [class]="'inline-block px-2 py-1 rounded-full text-xs font-medium ' + obterClasseCorTipo()">
            {{ rota.tipo }}
          </span>
          <div class="flex items-center space-x-1">
            @for(modal of rota.modais; track modal.nome) {
              <div [innerHTML]="modal.icone" class="w-5 h-5"></div>
            }
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-gray-900">{{ rota.custo }}</div>
          <div class="text-sm text-gray-600">{{ rota.duracao }}</div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-2">
          <div class="flex items-center space-x-1">
            @for(i of [].constructor(rota.sustentabilidade.pontuacao); track $index) {
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            }
            @for(i of [].constructor(10 - rota.sustentabilidade.pontuacao); track $index) {
              <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            }
          </div>
          <span class="text-xs text-gray-600">{{ rota.sustentabilidade.descricao }}</span>
        </div>
        
        @if(estaSelecionada) {
          <div class="text-green-600 text-sm font-medium flex items-center space-x-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>Selecionada</span>
          </div>
        }
      </div>

      <div class="text-xs text-gray-600 mb-2">
        <span>{{ rota.detalhes.distancia }}</span>
        <span class="mx-2">•</span>
        <span>{{ obterNomesModais() }}</span>
        @if(rota.detalhes.linhasOnibus && rota.detalhes.linhasOnibus.length > 0) {
          <span class="mx-2">•</span>
          <span>Linhas: {{ rota.detalhes.linhasOnibus.join(', ') }}</span>
        }
      </div>

      @if(estaSelecionada && mostrarDetalhes) {
        <div class="mt-4 pt-3 border-t border-gray-200 animate-fade-in">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Detalhes do Trajeto:</h4>
          
          <div class="space-y-2 mb-3">
            @for(passo of rota.detalhes.passos; track $index) {
              <div class="flex items-start space-x-2 text-xs">
                <div class="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <span class="text-gray-700">{{ passo }}</span>
              </div>
            }
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-gray-50 p-2 rounded">
              <div class="font-medium text-gray-900">Caminhada</div>
              <div class="text-gray-600">{{ rota.detalhes.distanciaCaminhada }}</div>
            </div>
            @if(rota.detalhes.emissaoCO2) {
              <div class="bg-gray-50 p-2 rounded">
                <div class="font-medium text-gray-900">CO₂</div>
                <div class="text-gray-600">{{ rota.detalhes.emissaoCO2 }}</div>
              </div>
            }
            @if(rota.detalhes.calorias) {
              <div class="bg-gray-50 p-2 rounded">
                <div class="font-medium text-gray-900">Calorias</div>
                <div class="text-gray-600">{{ rota.detalhes.calorias }} cal</div>
              </div>
            }
            <div class="bg-gray-50 p-2 rounded">
              <div class="font-medium text-gray-900">Tarifa</div>
              <div class="text-gray-600">{{ rota.detalhes.custoTransporte || rota.custo }}</div>
            </div>
          </div>

          <div class="mt-3 p-2 bg-blue-50 rounded-lg">
            <div class="text-xs">
              <div class="font-medium text-blue-900">💡 Dica:</div>
              <div class="text-blue-700 mt-1">{{ obterDicaRota() }}</div>
            </div>
          </div>
        </div>
      }

      @if(estaSelecionada) {
        <button 
          (click)="alternarDetalhes($event)"
          class="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors">
          {{ mostrarDetalhes ? 'Menos detalhes ↑' : 'Mais detalhes ↓' }}
        </button>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class CartaoRotaComponent {
  @Input() rota!: Rota;
  @Input() estaSelecionada = false;
  @Output() selecionarRotaEvento = new EventEmitter<Rota>();

  mostrarDetalhes = false;

  selecionarRota(): void {
    this.selecionarRotaEvento.emit(this.rota);
  }

  alternarDetalhes(event: Event): void {
    event.stopPropagation(); 
    this.mostrarDetalhes = !this.mostrarDetalhes;
  }

  obterClassesCartao(): string {
    const classesBase = 'transition-all hover:shadow-md';
    if (this.estaSelecionada) {
      return `${classesBase} ${this.rota.classesCor} ring-2`;
    }
    return `${classesBase} border-gray-200 hover:border-gray-300`;
  }

  obterClasseCorTipo(): string {
    switch (this.rota.tipo) {
      case 'Rápida':
        return 'bg-blue-100 text-blue-800';
      case 'Econômica':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verde':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  obterDicaRota(): string {
    switch (this.rota.tipo) {
      case 'Rápida':
        if (this.rota.modais.some(m => m.nome.includes('Metrô'))) {
          return 'Evite horário de pico (7-9h e 17-19h) para viagem mais confortável.';
        }
        return 'Opção mais rápida com menor tempo de espera.';
      
      case 'Econômica':
        if (this.rota.detalhes.linhasOnibus && this.rota.detalhes.linhasOnibus.length > 1) {
          return 'Transferência incluída no Bilhete Único. Valide apenas na primeira linha.';
        }
        return 'Melhor custo-benefício. Confira horários no app da empresa.';
      
      case 'Verde':
        const tempoViagem = this.rota.detalhes.tempoTotal;
        if (tempoViagem > 60) {
          return 'Viagem longa de bike. Considere dividir com transporte público.';
        }
        return 'Zero emissão! Lembre-se do capacete e respeite a ciclovia.';
      
      default:
        return 'Planeje sua viagem com antecedência.';
    }
  }

  obterNomesModais(): string {
    return Array.isArray(this.rota?.modais)
      ? this.rota.modais.map(m => m.nome).join(' + ')
      : '';
  }
}