import { jest } from "@jest/globals";
import { ReservationService } from "../services/ReservationService.js";
import { 
  getHelperDates 
} from '../factories/reservationFactory.js';

describe("ReservationService - Core", () => {
  let reservationRepositoryMock;
  let roomRepositoryMock;
  let userRepositoryMock;
  let paymentServiceMock;
  let notificationServiceMock;
  let reservationService;

  beforeEach(() => {
    jest.clearAllMocks();

    reservationRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByRoomAndDateRange: jest.fn(),
      save: jest.fn(),
    };

    roomRepositoryMock = {
      findById: jest.fn(),
    };

    userRepositoryMock = {
      findById: jest.fn(),
    };

    paymentServiceMock = {
      refund: jest.fn().mockResolvedValue(true),
    };

    notificationServiceMock = {
      send: jest.fn().mockResolvedValue(true),
    };

    reservationService = new ReservationService({
      reservationRepository: reservationRepositoryMock,
      roomRepository: roomRepositoryMock,
      userRepository: userRepositoryMock,
      paymentService: paymentServiceMock,
      notificationService: notificationServiceMock,
    });
  });

  test("Deve criar uma reserva com sucesso", async () => {
    const validData = {
      roomId: "room-1",
      userId: "user-1",
      startTime: "2026-11-10T10:00:00Z",
      endTime: "2026-11-10T12:00:00Z",
      guestCount: 5,
    };

    userRepositoryMock.findById.mockResolvedValue({ id: "user-1", isDelinquent: false });
    roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });
    reservationRepositoryMock.findByRoomAndDateRange.mockResolvedValue([]);
    reservationRepositoryMock.save.mockImplementation((payload) =>
      Promise.resolve({ id: "res-1", ...payload })
    );

    const result = await reservationService.createReservation(validData);

    expect(result).toHaveProperty("id", "res-1");
    expect(result.status).toBe("CONFIRMED");
  });

  test("Deve falhar por capacidade excedida", async () => {
    const data = {
      roomId: "room-1",
      userId: "user-1",
      startTime: "2026-11-10T10:00:00Z",
      endTime: "2026-11-10T12:00:00Z",
      guestCount: 15,
    };

    userRepositoryMock.findById.mockResolvedValue({ id: "user-1", isDelinquent: false });
    roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });

    await expect(reservationService.createReservation(data)).rejects.toThrow(
      "A quantidade de pessoas (15) excede a capacidade máxima da sala (10)."
    );
  });

  test("Deve falhar por conflito de horário (overbooking)", async () => {
    const data = {
      roomId: "room-1",
      userId: "user-2",
      startTime: "2026-11-10T11:00:00Z",
      endTime: "2026-11-10T13:00:00Z",
      guestCount: 2,
    };

    userRepositoryMock.findById.mockResolvedValue({ id: "user-2", isDelinquent: false });
    roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });
    reservationRepositoryMock.findByRoomAndDateRange.mockResolvedValue([
      {
        startTime: new Date("2026-11-10T10:00:00Z"),
        endTime: new Date("2026-11-10T12:00:00Z"),
      },
    ]);

    await expect(reservationService.createReservation(data)).rejects.toThrow(
      "Conflito de horário: A sala já possui uma reserva no período selecionado."
    );
  });

  test("deve lançar exceção quando o usuário estiver inadimplente ou bloqueado", async () => {
    const startTime = getHelperDates().futureMoreThan24h;
    const endTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString();

    roomRepositoryMock.findById.mockResolvedValue({ id: "room-123", capacity: 10 });
    userRepositoryMock.findById.mockResolvedValue({ id: "user-blocked", isDelinquent: true });

    const reservationData = {
      userId: "user-blocked",
      roomId: "room-123",
      startTime,
      endTime,
      guestCount: 2,
    };

    await expect(
      reservationService.createReservation(reservationData)
    ).rejects.toThrow("Usuário inadimplente não pode realizar reservas.");
  });

  test("deve lançar exceção ao tentar cancelar uma reserva fora do prazo limite", async () => {
    const pastReservation = {
      id: "res-123",
      userId: "user-123",
      roomId: "room-456",
      startTime: new Date("2025-01-01T10:00:00Z"),
      endTime: new Date("2025-01-01T12:00:00Z"),
      status: "CONFIRMED",
    };

    reservationRepositoryMock.findById.mockResolvedValue(pastReservation);

    await expect(
      reservationService.cancelReservation("res-123")
    ).rejects.toThrow("Não é possível cancelar uma reserva já concluída ou em andamento.");
  });

  test("deve lançar exceção ao tentar cancelar reserva inexistente ou inválida", async () => {
    reservationRepositoryMock.findById.mockResolvedValue(null);
    
    await expect(
      reservationService.cancelReservation("Id-Inexistente")
    ).rejects.toThrow("Reserva não encontrada.");
  });
});
