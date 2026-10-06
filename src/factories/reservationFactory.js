// Funções auxiliares para manipulação de datas (cenários de cancelamento/regras)
export const getHelperDates = () => {
  const now = new Date();

  return {
    pastDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
    futureMoreThan24h: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(), // +48h
    futureLessThan24h: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // +12h
  };
};

// Factory para Usuários Fakes
export const createFakeUser = (overrides = {}) => {
  return {
    id: `user-${Math.floor(Math.random() * 1000)}`,
    name: 'User Test',
    email: 'user@example.com',
    ...overrides,
  };
};

// Factory para Salas/Recursos Fakes
export const createFakeRoom = (overrides = {}) => {
  return {
    id: `room-${Math.floor(Math.random() * 1000)}`,
    name: 'Sala de Reunião A',
    capacity: 10,
    ...overrides,
  };
};

// Factory Principal de Reservas com sobrescrita flexível
export const createFakeReservation = (overrides = {}) => {
  const dates = getHelperDates();

  return {
    id: `res-${Math.floor(Math.random() * 10000)}`,
    userId: `user-123`,
    roomId: `room-456`,
    startDate: dates.futureMoreThan24h,
    endDate: new Date(new Date(dates.futureMoreThan24h).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'CONFIRMED',
    ...overrides,
  };
};
// Funções auxiliares para manipulação de datas (cenários de cancelamento/regras)
export const getHelperDates = () => {
  const now = new Date();

  return {
    pastDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
    futureMoreThan24h: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(), // +48h
    futureLessThan24h: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // +12h
  };
};

// Factory para Usuários Fakes
export const createFakeUser = (overrides = {}) => {
  return {
    id: `user-${Math.floor(Math.random() * 1000)}`,
    name: 'User Test',
    email: 'user@example.com',
    ...overrides,
  };
};

// Factory para Salas/Recursos Fakes
export const createFakeRoom = (overrides = {}) => {
  return {
    id: `room-${Math.floor(Math.random() * 1000)}`,
    name: 'Sala de Reunião A',
    capacity: 10,
    ...overrides,
  };
};

// Factory Principal de Reservas com sobrescrita flexível
export const createFakeReservation = (overrides = {}) => {
  const dates = getHelperDates();

  return {
    id: `res-${Math.floor(Math.random() * 10000)}`,
    userId: `user-123`,
    roomId: `room-456`,
    startDate: dates.futureMoreThan24h,
    endDate: new Date(new Date(dates.futureMoreThan24h).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'CONFIRMED',
    ...overrides,
  };
};
