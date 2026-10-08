## Sistema de Reservas & Agendamentos - Grupo 2

Este repositório contém a implementação e a suíte de testes unitários automatizados para o backend do Sistema de Gestão & Agendamento de reservas de salas/recursos. 

## Visão Geral do Sistema: 

O sistema consiste num Serviço de Gestão e Agendamento de Reservas de Espaços/Salas, responsável por controlar a criação, validação de disponibilidade e cancelamento com reembolso de reservas. 

## Regras do Negócio: 

### Campos Obrigatórios: 
Campos obrigatórios para o processamento de dados essenciais para o agendamento (roomId, userId, startTime, endTime, guestCount).

### Validação de Intervalo Temporal:
Garante que as datas sejam válidas e que a data/hora de início seja estritamente anterior à de término.

### Bloqueio de Inadimplência: 
Impede que utilizadores com pendências financeiras realizem reservas.

### Política de Reembolso Dinâmico:
100% de reembolso:
Cancelamentos realizados com mais de 24 horas de antecedência/
50% de reembolso: 
Cancelamentos realizados com 24 horas ou menos de antecedência.

### Prevenção de Overbooking:
Impede a reserva se houver sobreposição de horários com agendamentos já existentes na mesma sala.

### Validação de Estado:
Impede a tentativa de cancelar reservas inexistentes ou que já se encontrem canceladas.

### Restrição do Estado Atual:
Impede o cancelamento de reservas em andamento ou que já tenham sido concluídas (a data/hora do cancelamento deve ser anterior ao início da reserva).

## Arquitetura 

### src/: 
Pasta principal com o código-fonte da aplicação.  

### factories/: 
Contém criadores de objetos/dados (ex: reservationFactory.js), muito usados para gerar dados de teste ou instanciar objetos complexos.  

### services/: 
Contém as regras de negócio da aplicação (ex: ReservationService.js).   

### tests/: 
Ficheiros de teste unitário (*.test.js) associados aos serviços e factories.

## Divisão de Responsabilidades da Equipe:

### Luna Clara: 
Configuração, Ambiente e Base do Projeto

### Ana Julia Fonseca:
Fábrica de Dados Sintéticos e Fakes (Factories) para os testes

### Anna Luiza Rufino: 
Criação de Reservas e Validação de Espaço (Core Service)

### Ana Luysa Rodrigues: 
Cancelamentos, Taxas e Mensageria (Core Service)

### Ana Luysa Rodrigues: 
Cancelamentos, Taxas e Mensageria (Core Service)

### Clara Tavares: 
Testes de Fluxos de Sucesso e Validação de Mocks (QA)

### Monique Xavier: 
Testes de Falhas/Erros e Documentação Teórica (QA)

## Documentação & Fundamentação Teórica

### 1. Pirâmide de Testes (Test Pyramid)
A Pirâmide de Testes é um modelo conceitual que orienta a distribuição proporcional e a estratégia dos diferentes tipos de testes no projeto.

### Base (Testes Unitários - Foco Principal): 
Focamos os testes na camada da classe ReservationService.js isolando regras de negócio centrais (validação de sobreposição de horários, regras de cancelamento, reembolso e capacidade máxima). São executados rapidamente via Jest sem dependência de banco de dados ou redes externas.

### Meio (Testes de Integração): 
Validação de integração entre serviços e APIs 

### Topo (Testes E2E):
Fluxos ponta a ponta simulando a jornada real do utilizador 

### 2. Mocks vs Stubs (Test Doubles)
Dublês de teste (Test Doubles) são objetos que substituem dependências reais durante a execução dos testes unitários.

### Stub: 
Objeto que fornece respostas pré-programadas para as chamadas realizadas durante o teste. Não verifica o comportamento, apenas entrega dados.

### Mock:
Objeto pré-programado com expectativas sobre as chamadas que deve receber (quais métodos, parâmetros e quantas vezes). Foca na verificação do comportamento.

### 3. Padrão Factory (Test Data Factories)
O padrão Factory facilita a criação centralizada de objetos complexos e sintéticos (Fakes) necessários para alimentar os cenários de teste.

- Evita código duplicado (DRY): Evita que você tenha que instanciar manualmente objetos complexos com múltiplos parâmetros em cada método de teste.

- Flexibilidade via sobrescrita: Permite gerar objetos com valores padrão válidos, possibilitando customizar apenas as propriedades necessárias para cada teste específico (ex: simular datas de cancelamento com <24h ou >24h).

### 4. Princípios F.I.R.S.T.
Para garantir testes limpos, legíveis e de fácil manutenção, adotamos os princípios F.I.R.S.T.:

### F - Fast (Rápidos): 
Testes unitários executam em milissegundos graças ao uso de Mocks/Fakes em vez de recursos externos reais.


### I - Independent / Isolated (Independentes/Isolados): 
Cada teste possui seu próprio estado. Um teste não depende do resultado ou da ordem de execução de outro.


### R - Repeatable (Repetíveis): 
Os resultados são determinísticos e idênticos em qualquer ambiente (local, CI/CD, máquina do desenvolvedor).


### S - Self-validating (Auto-validáveis):
Os testes emitem resposta clara de sucesso (PASS) ou falha (FAIL) sem necessidade de inspeção manual de logs.


### T - Timely (Oportunos): 
Os testes foram escritos junto com o código de produção para garantir alta cobertura e design orientado à testabilidade.


### 5. Padrão AAA (Arrange, Act, Assert)
A estrutura dos arquivos de teste segue o padrão AAA para organizar claramente os blocos do teste unitário:

### Arrange (Preparar): 
Configuração de mocks, dados da fábrica (createFakeReservation) e instâncias do serviço.

### Act (Agir): 
Invocação do método sob teste (ex: service.createReservation(...)).

### Assert (Verificar): 
Validação dos resultados, lançamento de exceções esperadas ou contagem de chamadas a serviços externos.


## Como Executar o Projeto

### Pré-requisitos
- Node.js instalado (versão 18 ou superior)
- [Jest](https://jestjs.io) como framework de testes principal

### Instalação
1. Clone o repositório colando este código
   ```bash
   git clone https://github.com/Lunvick/projeto-integrador-final.git
