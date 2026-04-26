/**
 * Registro de todos os prompts de documentos no catálogo.
 * Importe este módulo no startup para carregar os prompts.
 */

import { promptCatalog } from '../catalog/index.js';

// ACORDO_PARCELAMENTO
import { acordoParcelamentoPjPj } from './acordo-parcelamento-pj-pj.js';
import { acordoParcelamentoPfPj } from './acordo-parcelamento-pf-pj.js';
import { acordoParcelamentoPfPf } from './acordo-parcelamento-pf-pf.js';

// RECIBO_QUITACAO
import { reciboQuitacaoPjPj } from './recibo-quitacao-pj-pj.js';
import { reciboQuitacaoPfPj } from './recibo-quitacao-pf-pj.js';
import { reciboQuitacaoPfPf } from './recibo-quitacao-pf-pf.js';

// NOTIFICACAO_EXTRAJUDICIAL
import { notificacaoExtrajudicialPjPj } from './notificacao-extrajudicial-pj-pj.js';
import { notificacaoExtrajudicialPfPj } from './notificacao-extrajudicial-pf-pj.js';
import { notificacaoExtrajudicialPfPf } from './notificacao-extrajudicial-pf-pf.js';

// CONFISSAO_DIVIDA
import { confissaoDividaPjPj } from './confissao-divida-pj-pj.js';
import { confissaoDividaPfPj } from './confissao-divida-pf-pj.js';
import { confissaoDividaPfPf } from './confissao-divida-pf-pf.js';

// CONTRATO_PRESTACAO_SERVICOS
import { contratoPrestacaoServicosPjPj } from './contrato-prestacao-servicos-pj-pj.js';
import { contratoPrestacaoServicosPfPj } from './contrato-prestacao-servicos-pf-pj.js';
import { contratoPrestacaoServicosPfPf } from './contrato-prestacao-servicos-pf-pf.js';

// CONTRATO_COMPRA_VENDA
import { contratoCompraVendaPjPj } from './contrato-compra-venda-pj-pj.js';
import { contratoCompraVendaPfPj } from './contrato-compra-venda-pf-pj.js';
import { contratoCompraVendaPfPf } from './contrato-compra-venda-pf-pf.js';

// CONTRATO_LOCACAO
import { contratoLocacaoPjPj } from './contrato-locacao-pj-pj.js';
import { contratoLocacaoPfPj } from './contrato-locacao-pf-pj.js';
import { contratoLocacaoPfPf } from './contrato-locacao-pf-pf.js';

// CONTRATO_PARCERIA_COMERCIAL
import { contratoParceriaComercialPjPj } from './contrato-parceria-comercial-pj-pj.js';
import { contratoParceriaComercialPfPj } from './contrato-parceria-comercial-pf-pj.js';
import { contratoParceriaComercialPfPf } from './contrato-parceria-comercial-pf-pf.js';

export function registerDocumentPrompts(): void {
  promptCatalog.register(acordoParcelamentoPjPj);
  promptCatalog.register(acordoParcelamentoPfPj);
  promptCatalog.register(acordoParcelamentoPfPf);

  promptCatalog.register(reciboQuitacaoPjPj);
  promptCatalog.register(reciboQuitacaoPfPj);
  promptCatalog.register(reciboQuitacaoPfPf);

  promptCatalog.register(notificacaoExtrajudicialPjPj);
  promptCatalog.register(notificacaoExtrajudicialPfPj);
  promptCatalog.register(notificacaoExtrajudicialPfPf);

  promptCatalog.register(confissaoDividaPjPj);
  promptCatalog.register(confissaoDividaPfPj);
  promptCatalog.register(confissaoDividaPfPf);

  promptCatalog.register(contratoPrestacaoServicosPjPj);
  promptCatalog.register(contratoPrestacaoServicosPfPj);
  promptCatalog.register(contratoPrestacaoServicosPfPf);

  promptCatalog.register(contratoCompraVendaPjPj);
  promptCatalog.register(contratoCompraVendaPfPj);
  promptCatalog.register(contratoCompraVendaPfPf);

  promptCatalog.register(contratoLocacaoPjPj);
  promptCatalog.register(contratoLocacaoPfPj);
  promptCatalog.register(contratoLocacaoPfPf);

  promptCatalog.register(contratoParceriaComercialPjPj);
  promptCatalog.register(contratoParceriaComercialPfPj);
  promptCatalog.register(contratoParceriaComercialPfPf);
}
