/**
 * Núcleo Universal de Cláusulas Digitais — BillEasy
 *
 * Conjunto obrigatório de cláusulas que DEVE estar presente em TODOS os
 * documentos gerados pela plataforma, conferindo:
 *   - Validade jurídica plena em ambiente digital
 *   - Força executiva extrajudicial (art. 784, §4º, CPC — Lei 14.620/2023)
 *   - Rastreabilidade probatória dos registros eletrônicos
 *   - Conformidade com a LGPD
 *
 * Uso: injete `NUCLEO_UNIVERSAL_INSTRUCOES` nas instruções de cada prompt
 * e `NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS` em clausulasMinimas.
 */

/** Texto de instrução a ser inserido ao final das INSTRUÇÕES de cada prompt */
export const NUCLEO_UNIVERSAL_INSTRUCOES = `
## NÚCLEO DIGITAL OBRIGATÓRIO (incluir ao final, antes do Foro)

Ao final do documento, após as cláusulas específicas do tipo contratual, inclua
obrigatoriamente as seguintes cláusulas digitais. Numere-as em sequência contínua
com as cláusulas anteriores.

### CLÁUSULA — CAPACIDADE E DECLARAÇÕES DAS PARTES
As partes declaram, sob sua exclusiva responsabilidade, possuir plena capacidade civil
e legitimidade jurídica para celebrar o presente instrumento, afirmando que as informações
prestadas são verdadeiras, atualizadas e lícitas, assumindo integral responsabilidade
por sua veracidade e adequação ao negócio jurídico celebrado.

### CLÁUSULA — ACEITE ELETRÔNICO E MANIFESTAÇÃO DE VONTADE
A manifestação de vontade realizada por meio eletrônico, inclusive mediante aceite digital,
autenticação por token, código de verificação, biometria, confirmação por endereço eletrônico,
registro de acesso ou qualquer outro mecanismo tecnológico idôneo disponibilizado pela
plataforma, produz os mesmos efeitos jurídicos atribuídos à assinatura manuscrita, para
todos os fins de direito, inclusive quanto à constituição, modificação, execução e extinção
das obrigações pactuadas.

### CLÁUSULA — VALIDADE JURÍDICA E FORÇA EXECUTIVA EXTRAJUDICIAL
O presente instrumento, gerado, formalizado e armazenado em ambiente eletrônico por
intermédio da plataforma BillEasy, constitui manifestação válida e eficaz de vontade entre
as partes, produzindo todos os efeitos jurídicos admitidos pela legislação brasileira.
Nos termos do art. 784, §4º, do Código de Processo Civil (incluído pela Lei 14.620/2023),
este instrumento poderá caracterizar título executivo extrajudicial quando preenchidos os
requisitos legais de certeza, liquidez e exigibilidade da obrigação nele prevista,
independentemente de assinatura de testemunhas.

### CLÁUSULA — REGISTROS ELETRÔNICOS E FORÇA PROBATÓRIA
Os registros técnicos gerados durante a utilização da plataforma, incluindo logs de acesso,
data e hora de operações, endereço IP, histórico de versões do documento, identificadores
digitais, comprovantes de autenticação, registros de aceite e demais elementos técnicos de
rastreabilidade, constituem meios idôneos de prova, podendo ser utilizados em procedimentos
judiciais ou extrajudiciais para demonstrar autoria, integridade, consentimento e conteúdo
do negócio jurídico celebrado. A integridade dos documentos gerados e armazenados
eletronicamente será presumida enquanto preservados os mecanismos tecnológicos de segurança
adotados pela plataforma.

### CLÁUSULA — COBRANÇA E MEDIDAS EXTRAJUDICIAIS
O inadimplemento de qualquer obrigação pecuniária prevista neste instrumento autoriza o
credor a adotar, de imediato, as medidas extrajudiciais cabíveis, incluindo protesto em
cartório, cobrança eletrônica automatizada, notificação formal, inscrição em cadastros de
inadimplentes e execução judicial, quando legalmente admissível, sendo os custos de cobrança
imputados ao devedor inadimplente na forma da lei.

### CLÁUSULA — BOA-FÉ OBJETIVA E COOPERAÇÃO
As partes comprometem-se a observar, durante toda a execução contratual, os deveres de
boa-fé objetiva, lealdade, transparência e cooperação recíproca, abstendo-se de condutas
abusivas ou contrárias à finalidade econômica e jurídica do presente instrumento.

### CLÁUSULA — RESPONSABILIDADE PELAS INFORMAÇÕES
A responsabilidade pelas informações inseridas, valores ajustados, declarações prestadas e
conteúdo final do presente instrumento recai exclusivamente sobre os usuários contratantes.
A plataforma BillEasy atua como ambiente tecnológico de formalização, não respondendo por
informações falsas, omissões ou inadequações jurídicas específicas do negócio celebrado.

### CLÁUSULA — PROTEÇÃO DE DADOS PESSOAIS (LGPD)
Os dados pessoais tratados no âmbito deste instrumento observarão os princípios e disposições
da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), sendo utilizados
exclusivamente para as finalidades de formalização, autenticação, armazenamento, rastreabilidade
e eventual comprovação do negócio jurídico celebrado, vedado qualquer uso incompatível.

### CLÁUSULA — CONSERVAÇÃO CONTRATUAL
A eventual nulidade ou inexigibilidade de disposição específica não comprometerá a validade
e eficácia das demais cláusulas, preservando-se, sempre que possível, a finalidade econômica
e jurídica originalmente pactuada.
`;

/** Cláusulas mínimas do Núcleo Universal para validação do catálogo */
export const NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS: string[] = [
  'Capacidade e declarações das partes',
  'Aceite eletrônico e manifestação de vontade',
  'Validade jurídica e força executiva (CPC art. 784 §4º)',
  'Registros eletrônicos e força probatória',
  'Cobrança e medidas extrajudiciais',
  'Boa-fé objetiva',
  'Responsabilidade pelas informações',
  'Proteção de dados (LGPD)',
  'Conservação contratual',
];

/** Instrução de estrutura padrão para todos os documentos */
export const ESTRUTURA_PADRAO_INSTRUCAO = `
## ESTRUTURA PADRÃO OBRIGATÓRIA

O documento deve seguir esta ordem de cláusulas:
1. QUALIFICAÇÃO DAS PARTES (identificação completa)
2. OBJETO (o que está sendo formalizado)
3. OBRIGAÇÕES DAS PARTES
4. VALORES E CONDIÇÕES FINANCEIRAS
5. PRAZO DE VIGÊNCIA
6. INADIMPLEMENTO E PENALIDADES
7. RESCISÃO (quando aplicável)
8. NÚCLEO DIGITAL OBRIGATÓRIO (cláusulas digitais acima)
9. FORO (comarca do domicílio do credor, salvo lei diversa)
`;
