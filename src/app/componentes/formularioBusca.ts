import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicoGeolocalizacao } from '../servicos/servicoGeolocalizacao';

@Component({
  selector: 'app-formulario-busca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Origem</label>
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="enderecoOrigem"
              (input)="aoDigitarOrigem()"
              placeholder="Digite o endereço de origem (SP, Sorocaba, Itu...)"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            @if(sugestoesOrigem().length > 0) {
              <div class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                @for(sugestao of sugestoesOrigem(); track sugestao.place_id) {
                  <div
                    (click)="selecionarOrigem(sugestao)"
                    class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div class="text-sm text-gray-900">{{ sugestao.display_name }}</div>
                    <div class="text-xs text-gray-500 mt-1">{{ detectarCidade(sugestao) }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Destino</label>
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="enderecoDestino"
              (input)="aoDigitarDestino()"
              placeholder="Digite o endereço de destino"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            @if(sugestoesDestino().length > 0) {
              <div class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                @for(sugestao of sugestoesDestino(); track sugestao.place_id) {
                  <div
                    (click)="selecionarDestino(sugestao)"
                    class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div class="text-sm text-gray-900">{{ sugestao.display_name }}</div>
                    <div class="text-xs text-gray-500 mt-1">{{ detectarCidade(sugestao) }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        @if(cidadeOrigemSelecionada) {
          <div class="p-3 bg-blue-50 rounded-lg text-sm">
            <div class="font-medium text-blue-800">{{ cidadeOrigemSelecionada }}</div>
            <div class="text-blue-600 mt-1">{{ obterInfoCidade(cidadeOrigemSelecionada) }}</div>
          </div>
        }

        <button
          (click)="buscarRotas()"
          [disabled]="!podeBuscar() || estaCarregando"
          class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          @if(estaCarregando) {
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Buscando rotas...
            </span>
          } @else {
            <span>Buscar rotas</span>
          }
        </button>
      </div>

      @if(clima || qualidadeAr) {
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between text-sm">
            @if(clima) {
              <div class="flex items-center space-x-2">
                <img [src]="clima.iconUrl" alt="Clima" class="w-8 h-8">
                <span>{{ clima.temp }}°C - {{ clima.description }}</span>
              </div>
            }
            @if(qualidadeAr) {
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  [style.backgroundColor]="qualidadeAr.color">
                </div>
                <span>Ar: {{ qualidadeAr.level }}</span>
              </div>
            }
          </div>
        </div>
      }

      @if(cidadeOrigemSelecionada && !estaCarregando) {
        <div class="mt-4 p-3 bg-green-50 rounded-lg">
          <div class="text-sm">
            <div class="font-medium text-green-800 mb-2">💡 Dicas para {{ cidadeOrigemSelecionada }}:</div>
            <div class="text-green-700">{{ obterDicasTransporte(cidadeOrigemSelecionada) }}</div>
          </div>
        </div>
      }

      @if(errosBusca) {
        <div class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {{ errosBusca }}
        </div>
      }
    </div>
  `
})
export class FormularioBuscaComponent {

  obterInfoCidade(cidade: string): string {
    const infos: { [key: string]: string } = {
      'Sorocaba': 'Conhecida pelo sistema de transporte integrado e ciclovias.',
      'Itu': 'Transporte focado no centro histórico e bairros adjacentes.',
      'São Paulo': 'Sistema com Metrô, CPTM e Bilhete Único.',
      'Campinas': 'Possui um sistema de corredores de ônibus (BRT).',
      'Santos': 'Utiliza o VLT (Veículo Leve sobre Trilhos) como principal modal.'
    };
    return infos[cidade] || `Informações sobre ${cidade} não disponíveis.`;
  }

  obterDicasTransporte(cidade: string): string {
    const dicas: { [key: string]: string } = {
      'Sorocaba': 'Utilize o cartão de transporte local para economizar nas integrações.',
      'Itu': 'As principais linhas partem do terminal central, próximo à prefeitura.',
      'São Paulo': 'Planeje viagens com antecedência para evitar horários de pico no Metrô.',
      'Campinas': 'Verifique os horários do BRT para viagens mais rápidas pela cidade.',
      'Santos': 'O VLT é ideal para percorrer a orla da praia e acessar o centro.'
    };
    return dicas[cidade] || `Verifique os horários e tarifas no site da prefeitura de ${cidade}.`;
  }

  @Input() estaCarregando = false;
  @Input() clima: any = null;
  @Input() qualidadeAr: any = null;
  @Input() errosBusca: string | null = null;
  @Output() buscarRotasEvento = new EventEmitter<{
    origem: { lat: number, lng: number, cidade: string },
    destino: { lat: number, lng: number, cidade: string }
  }>();

  private servicoGeolocalizacao = inject(ServicoGeolocalizacao);

  enderecoOrigem = '';
  enderecoDestino = '';

  sugestoesOrigem = signal<any[]>([]);
  sugestoesDestino = signal<any[]>([]);

  private origemSelecionada: { lat: number, lng: number, cidade: string } | null = null;
  private destinoSelecionado: { lat: number, lng: number, cidade: string } | null = null;

  cidadeOrigemSelecionada: string | null = null;

  private timeoutOrigem: any;
  private timeoutDestino: any;

  aoDigitarOrigem(): void {
    if (this.timeoutOrigem) clearTimeout(this.timeoutOrigem);

    if (this.enderecoOrigem.length < 3) {
      this.sugestoesOrigem.set([]);
      return;
    }

    this.timeoutOrigem = setTimeout(async () => {
      const sugestoes = await this.servicoGeolocalizacao.buscarEndereco(
        this.enderecoOrigem + ', São Paulo, Brasil'
      );
      this.sugestoesOrigem.set(sugestoes);
    }, 300);
  }

  aoDigitarDestino(): void {
    if (this.timeoutDestino) clearTimeout(this.timeoutDestino);

    if (this.enderecoDestino.length < 3) {
      this.sugestoesDestino.set([]);
      return;
    }

    this.timeoutDestino = setTimeout(async () => {
      const sugestoes = await this.servicoGeolocalizacao.buscarEndereco(
        this.enderecoDestino + ', São Paulo, Brasil'
      );
      this.sugestoesDestino.set(sugestoes);
    }, 300);
  }

  selecionarOrigem(sugestao: any): void {
    this.enderecoOrigem = sugestao.display_name;
    const cidade = this.detectarCidade(sugestao);
    this.origemSelecionada = {
      lat: parseFloat(sugestao.lat),
      lng: parseFloat(sugestao.lon),
      cidade: cidade
    };
    this.cidadeOrigemSelecionada = cidade;
    this.sugestoesOrigem.set([]);
  }

  selecionarDestino(sugestao: any): void {
    this.enderecoDestino = sugestao.display_name;
    const cidade = this.detectarCidade(sugestao);
    this.destinoSelecionado = {
      lat: parseFloat(sugestao.lat),
      lng: parseFloat(sugestao.lon),
      cidade: cidade
    };
    this.sugestoesDestino.set([]);
  }

  podeBuscar(): boolean {
    return this.origemSelecionada !== null && this.destinoSelecionado !== null;
  }

  buscarRotas(): void {
    if (this.podeBuscar()) {
      this.buscarRotasEvento.emit({
        origem: this.origemSelecionada!,
        destino: this.destinoSelecionado!
      });
    }
  }

  public detectarCidade(sugestao: any): string {
    const endereco = sugestao.display_name.toLowerCase();

    if (endereco.includes('sorocaba')) return 'Sorocaba';
    if (endereco.includes('itu')) return 'Itu';
    if (endereco.includes('campinas')) return 'Campinas';
    if (endereco.includes('santos')) return 'Santos';
    if (endereco.includes('são paulo')) return 'São Paulo';

    return 'São Paulo';
  }
}