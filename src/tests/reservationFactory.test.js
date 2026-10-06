import { 
  createFakeReservation, 
  createFakeUser, 
  createFakeRoom, 
  getHelperDates 
} from '../factories/reservationFactory.js';

describe('Reservation Factory', () => {
  it('deve criar uma reserva padrão válida com propriedades personalizáveis', () => {
    const reservation = createFakeReservation({ status: 'CANCELLED' });
    
    expect(reservation).toHaveProperty('id');
    expect(reservation.status).toBe('CANCELLED');
  });

  it('deve gerar datas auxiliares corretamente', () => {
    const dates = getHelperDates();
    
    expect(dates).toHaveProperty('pastDate');
    expect(dates).toHaveProperty('futureMoreThan24h');
    expect(dates).toHaveProperty('futureLessThan24h');
  });

  it('deve criar utilizadores e salas fake', () => {
    const user = createFakeUser({ name: 'Ana Fonseca' });
    const room = createFakeRoom({ capacity: 20 });

    expect(user.name).toBe('Ana Fonseca');
    expect(room.capacity).toBe(20);
  });

  it('deve criar dados padrao quando nenhum parametro for passado', () => {
    const reservation = createFakeReservation();
    const user = createFakeUser();
    const room = createFakeRoom();

    expect(reservation).toHaveProperty('id');
    expect(user).toHaveProperty('id');
    expect(room).toHaveProperty('id');
  });
});
