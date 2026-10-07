## Sistema de Reservas & Agendamentos - Grupo 2

Este repositório contém a implementação e a suíte de testes unitários automatizados para o backend do Sistema de Gestão & Agendamento de reservas de salas/recursos. 

## Visão Geral do Sistema: 

# O sistema consiste num Serviço de Gestão e Agendamento de Reservas de Espaços/Salas, responsável por controlar a criação, validação de disponibilidade e cancelamento com reembolso de reservas. 

##Regras do Negócio: 

### Campos Obrigatórios: 
## Campos obrigatórios para o processamento de dados essenciais para o agendamento (roomId, userId, startTime, endTime, guestCount).

### Validação de Intervalo Temporal:
## Garante que as datas sejam válidas e que a data/hora de início seja estritamente anterior à de término.

### Bloqueio de Inadimplência: 
## Impede que utilizadores com pendências financeiras realizem reservas.

### Política de Reembolso Dinâmico:
### 100% de reembolso:
## Cancelamentos realizados com mais de 24 horas de antecedência.
###  50% de reembolso: 
## Cancelamentos realizados com 24 horas ou menos de antecedência.

### Prevenção de Overbooking:
## Impede a reserva se houver sobreposição de horários com agendamentos já existentes na mesma sala.

### Validação de Estado:
## Impede a tentativa de cancelar reservas inexistentes ou que já se encontrem canceladas.

### Restrição do Estado Atual:
## Impede o cancelamento de reservas em andamento ou que já tenham sido concluídas (a data/hora do cancelamento deve ser anterior ao início da reserva).

### Pré-requisitos
- Node.js instalado (versão 18 ou superior)

### Instalação
1. Clone o repositório colando este código
   ```bash
   git clone https://github.com/Lunvick/projeto-integrador-final.git
   
2. Crie uma branch, antes de iniciar seu trabalho
   ```bash
   git checkout -b nome-da-sua-branch (colocar um nome feito por você)
   ```

3. APÓS acabar seu trabalho, envie para o github
   ```bash
   git push -u origin nome-da-sua-branch (mesmo nome)
   ```
