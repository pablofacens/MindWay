import { Injectable } from '@angular/core';

interface LinhaOnibus {
  numero: string;
  nome: string;
  empresa: string;
  tarifa: number;
  tipo: 'municipal' | 'metropolitano' | 'intermunicipal';
  cidades: string[];
  lat: number;
  lng: number;
  horarioFuncionamento: string;
  intervalo: string;
}

interface TarifaTransporte {
  tipo: string;
  valor: number;
  descricao: string;
  validadeHoras?: number;
  transferenciasInclusas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicoOnibus {

  private tarifasEstadoSP: TarifaTransporte[] = [
    {
      tipo: 'Bilhete Único - SP Capital',
      valor: 4.40,
      descricao: 'Ônibus municipais de São Paulo',
      validadeHoras: 3,
      transferenciasInclusas: 3
    },
    {
      tipo: 'Bilhete Único - Metrô SP',
      valor: 5.00,
      descricao: 'Metrô e CPTM de São Paulo'
    },
    {
      tipo: 'EMTU - Região Metropolitana',
      valor: 5.25,
      descricao: 'Ônibus metropolitanos (Sorocaba, Itu, região)'
    },
    {
      tipo: 'Sorocaba - TUS',
      valor: 4.90,
      descricao: 'Transporte urbano de Sorocaba'
    },
    {
      tipo: 'Itu - Transporte Municipal',
      valor: 4.50,
      descricao: 'Ônibus municipais de Itu'
    },
    {
      tipo: 'Intermunicipal SP',
      valor: 8.75,
      descricao: 'Viagens entre cidades do estado'
    }
  ];

  constructor() { }

  obterLinhasOnibus(): LinhaOnibus[] {
    return [

      {
        numero: '875A-10',
        nome: 'Term. Bandeira - Jd. Ângela',
        empresa: 'SPTrans',
        tarifa: 4.40,
        tipo: 'municipal',
        cidades: ['São Paulo'],
        lat: -23.565,
        lng: -46.655,
        horarioFuncionamento: '04:00 - 00:30',
        intervalo: '8-12 min'
      },
      {
        numero: '917H-10',
        nome: 'Metrô Consolação - Cidade Universitária',
        empresa: 'SPTrans',
        tarifa: 4.40,
        tipo: 'municipal',
        cidades: ['São Paulo'],
        lat: -23.558,
        lng: -46.663,
        horarioFuncionamento: '04:30 - 00:00',
        intervalo: '6-10 min'
      },
      {
        numero: '106A-10',
        nome: 'Lapa - Centro',
        empresa: 'SPTrans',
        tarifa: 4.40,
        tipo: 'municipal',
        cidades: ['São Paulo'],
        lat: -23.555,
        lng: -46.650,
        horarioFuncionamento: '04:00 - 01:00',
        intervalo: '5-8 min'
      },


      {
        numero: '001',
        nome: 'Terminal Central - Jd. Vera Cruz',
        empresa: 'TUS Sorocaba',
        tarifa: 4.90,
        tipo: 'municipal',
        cidades: ['Sorocaba'],
        lat: -23.502,
        lng: -47.458,
        horarioFuncionamento: '05:00 - 23:30',
        intervalo: '15-20 min'
      },
      {
        numero: '022',
        nome: 'Centro - Vila Fiori',
        empresa: 'TUS Sorocaba',
        tarifa: 4.90,
        tipo: 'municipal',
        cidades: ['Sorocaba'],
        lat: -23.496,
        lng: -47.451,
        horarioFuncionamento: '05:30 - 23:00',
        intervalo: '20-25 min'
      },


      {
        numero: '101',
        nome: 'Centro - Cidade Nova',
        empresa: 'Viação Itu',
        tarifa: 4.50,
        tipo: 'municipal',
        cidades: ['Itu'],
        lat: -23.264,
        lng: -47.299,
        horarioFuncionamento: '05:00 - 22:30',
        intervalo: '30-40 min'
      },
      {
        numero: '201',
        nome: 'Rodoviária - Jd. Aeroporto',
        empresa: 'Viação Itu',
        tarifa: 4.50,
        tipo: 'municipal',
        cidades: ['Itu'],
        lat: -23.258,
        lng: -47.305,
        horarioFuncionamento: '05:30 - 22:00',
        intervalo: '45-60 min'
      },


      {
        numero: '142',
        nome: 'Sorocaba - São Paulo (Barra Funda)',
        empresa: 'EMTU',
        tarifa: 5.25,
        tipo: 'metropolitano',
        cidades: ['Sorocaba', 'São Paulo'],
        lat: -23.502,
        lng: -47.458,
        horarioFuncionamento: '04:30 - 23:00',
        intervalo: '20-30 min'
      },
      {
        numero: '175',
        nome: 'Itu - São Paulo (Barra Funda)',
        empresa: 'EMTU',
        tarifa: 5.25,
        tipo: 'metropolitano',
        cidades: ['Itu', 'São Paulo'],
        lat: -23.264,
        lng: -47.299,
        horarioFuncionamento: '05:00 - 22:30',
        intervalo: '40-60 min'
      },


      {
        numero: 'INT-001',
        nome: 'Sorocaba - Itu',
        empresa: 'Viação Cometa',
        tarifa: 8.75,
        tipo: 'intermunicipal',
        cidades: ['Sorocaba', 'Itu'],
        lat: -23.502,
        lng: -47.458,
        horarioFuncionamento: '06:00 - 20:00',
        intervalo: '120 min'
      }
    ];
  }

  obterTarifasPorCidade(cidade: string): TarifaTransporte[] {
    switch (cidade.toLowerCase()) {
      case 'são paulo':
        return this.tarifasEstadoSP.filter(t =>
          t.tipo.includes('SP Capital') || t.tipo.includes('Metrô SP')
        );
      case 'sorocaba':
        return this.tarifasEstadoSP.filter(t =>
          t.tipo.includes('Sorocaba') || t.tipo.includes('EMTU')
        );
      case 'itu':
        return this.tarifasEstadoSP.filter(t =>
          t.tipo.includes('Itu') || t.tipo.includes('EMTU')
        );
      default:
        return this.tarifasEstadoSP.filter(t =>
          t.tipo.includes('EMTU') || t.tipo.includes('Intermunicipal')
        );
    }
  }

  obterLinhasPorCidade(cidade: string): LinhaOnibus[] {
    return this.obterLinhasOnibus().filter(linha =>
      linha.cidades.some(c => c.toLowerCase().includes(cidade.toLowerCase()))
    );
  }

  obterOnibusProximosMock(cidade: string = 'São Paulo'): LinhaOnibus[] {
    const linhas = this.obterLinhasPorCidade(cidade);

    return linhas.slice(0, Math.min(5, linhas.length));
  }

  calcularTarifaViagem(origem: string, destino: string): {
    tarifa: number;
    tipo: string;
    descricao: string;
    linhasSugeridas: LinhaOnibus[];
  } {
    const linhasOrigem = this.obterLinhasPorCidade(origem);
    const linhasDestino = this.obterLinhasPorCidade(destino);


    if (origem.toLowerCase() === destino.toLowerCase()) {
      const tarifaLocal = this.obterTarifasPorCidade(origem)[0];
      return {
        tarifa: tarifaLocal.valor,
        tipo: tarifaLocal.tipo,
        descricao: `Viagem municipal em ${origem}`,
        linhasSugeridas: linhasOrigem.slice(0, 2)
      };
    }


    const linhasIntermunicipal = this.obterLinhasOnibus().filter(linha =>
      linha.tipo === 'intermunicipal' &&
      linha.cidades.some(c => c.toLowerCase().includes(origem.toLowerCase())) &&
      linha.cidades.some(c => c.toLowerCase().includes(destino.toLowerCase()))
    );

    if (linhasIntermunicipal.length > 0) {
      return {
        tarifa: linhasIntermunicipal[0].tarifa,
        tipo: 'Intermunicipal',
        descricao: `${origem} → ${destino}`,
        linhasSugeridas: linhasIntermunicipal
      };
    }


    const tarifaEMTU = this.tarifasEstadoSP.find(t => t.tipo.includes('EMTU'));
    return {
      tarifa: tarifaEMTU?.valor || 5.25,
      tipo: 'Metropolitano',
      descricao: `Região Metropolitana: ${origem} → ${destino}`,
      linhasSugeridas: this.obterLinhasOnibus().filter(l => l.tipo === 'metropolitano').slice(0, 2)
    };
  }

  obterInformacoesTarifa(tipoTarifa: string): TarifaTransporte | null {
    return this.tarifasEstadoSP.find(t => t.tipo === tipoTarifa) || null;
  }
}