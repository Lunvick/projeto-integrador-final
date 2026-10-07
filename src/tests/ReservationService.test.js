import { jest } from "@jest/globals";
import { ReservationService } from "../services/ReservationService.js";
import {
  createFakeReservation,
  createFakeUser,
  createFakeRoom,
} from "../factories/reservationFactory.js";

describe("ReservationService", () => {
  let reservationRepositoryMock;
  let roomRepositoryMock;
  let userRepositoryMock;
  let paymentServiceMock;
  let notificationServiceMock;
  let reservationService;

  beforeEach(() => {
    reservationRepositoryMock = {
      findById: jest.fn(),
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
      refund: jest.fn(),
    };

    notificationServiceMock = {
      send: jest.fn(),
    };

    reservationService = new ReservationService({
      reservationRepository: reservationRepositoryMock,
      roomRepository: roomRepositoryMock,
      userRepository: userRepositoryMock,
      paymentService: paymentServiceMock,
      notificationService: notificationServiceMock,
    });
  });

  describe("createReservation", () => {
    test("Deve criar uma reserva com sucesso (Pessoa 5)", async () => {
      const validData = {
        roomId: "room-1",
        userId: "user-1",
        startTime: "2026-11-10T10:00:00Z",
        endTime: "2026-11-10T12:00:00Z",
        guestCount: 5,
      };
      const fakeUser = createFakeUser({ id: "user-1", isDelinquent: false });
      const fakeRoom = createFakeRoom({ id: "room-1", capacity: 10 });

      userRepositoryMock.findById.mockResolvedValue(fakeUser);
      roomRepositoryMock.findById.mockResolvedValue(fakeRoom);
      reservationRepositoryMock.findByRoomAndDateRange.mockResolvedValue([]);
      reservationRepositoryMock.save.mockImplementation((payload) =>
        Promise.resolve({ id: "res-1", ...payload })
      );

      const result = await reservationService.createReservation(validData);

      expect(result).toHaveProperty("id", "res-1");
      expect(result.status).toBe("CONFIRMED");
      expect(userRepositoryMock.findById).toHaveBeenCalledWith("user-1");
    });

    test("Deve falhar por usuário inadimplente (Pessoa 6)", async () => {
      const validData = {
        roomId: "room-1",
        userId: "user-1",
        startTime: "2026-11-10T10:00:00Z",
        endTime: "2026-11-10T12:00:00Z",
        guestCount: 5,
      };

      roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });
      userRepositoryMock.findById.mockResolvedValue({ id: "user-1", isDelinquent: true });

      await expect(reservationService.createReservation(validData)).rejects.toThrow(
        "Usuário inadimplente não pode realizar reservas."
      );
    });

    test("Deve falhar por capacidade excedida (Pessoa 6)", async () => {
      const validData = {
        roomId: "room-1",
        userId: "user-1",
        startTime: "2026-11-10T10:00:00Z",
        endTime: "2026-11-10T12:00:00Z",
        guestCount: 15,
      };

      userRepositoryMock.findById.mockResolvedValue({ id: "user-1", isDelinquent: false });
      roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });

      await expect(reservationService.createReservation(validData)).rejects.toThrow(
        "A quantidade de pessoas (15) excede a capacidade máxima da sala (10)."
      );
    });

    test("Deve falhar por conflito de horário / overbooking (Pessoa 6)", async () => {
      const validData = {
        roomId: "room-1",
        userId: "user-1",
        startTime: "2026-11-10T11:00:00Z",
        endTime: "2026-11-10T13:00:00Z",
        guestCount: 2,
      };

      userRepositoryMock.findById.mockResolvedValue({ id: "user-1", isDelinquent: false });
      roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });
      reservationRepositoryMock.findByRoomAndDateRange.mockResolvedValue([
        {
          startTime: new Date("2026-11-10T10:00:00Z"),
          endTime: new Date("2026-11-10T12:00:00Z"),
        },
      ]);

      await expect(reservationService.createReservation(validData)).rejects.toThrow(
        "Conflito de horário: A sala já possui uma reserva no período selecionado."
      );
    });
  });

  describe("cancelReservation", () => {
    test("Deve cancelar reserva com 100% de reembolso se antecedência > 24h (Pessoa 5)", async () => {
      const futureMoreThan24h = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const futureMoreThan24hEnd = new Date(Date.now() + 50 * 60 * 60 * 1000);
      const reservation = createFakeReservation({
        id: "res-1",
        startTime: futureMoreThan24h,
        endTime: futureMoreThan24hEnd,
        status: "CONFIRMED",
      });

      reservationRepositoryMock.findById.mockResolvedValue(reservation);
      reservationRepositoryMock.save.mockImplementation((payload) => Promise.resolve(payload));

      const result = await reservationService.cancelReservation("res-1");

      expect(result.status).toBe("CANCELLED");
      expect(paymentServiceMock.refund).toHaveBeenCalledWith(expect.any(Object), 100);
      expect(notificationServiceMock.send).toHaveBeenCalled();
    });

    test("Deve aplicar retenção de taxa (50% reembolso) se antecedência < 24h (Pessoa 4 / Pessoa 5)", async () => {
      const futureLessThan24h = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const futureLessThan24hEnd = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const reservation = createFakeReservation({
        id: "res-1",
        startTime: futureLessThan24h,
        endTime: futureLessThan24hEnd,
        status: "CONFIRMED",
      });

      reservationRepositoryMock.findById.mockResolvedValue(reservation);
      reservationRepositoryMock.save.mockImplementation((payload) => Promise.resolve(payload));

      const result = await reservationService.cancelReservation("res-1");

      expect(result.status).toBe("CANCELLED");
      expect(paymentServiceMock.refund).toHaveBeenCalledWith(expect.any(Object), 50);
    });

    test("Deve falhar ao tentar cancelar reserva inexistente (Pessoa 6)", async () => {
      reservationRepositoryMock.findById.mockResolvedValue(null);

      await expect(reservationService.cancelReservation("res-invalida")).rejects.toThrow(
        "Reserva não encontrada."
      );
    });

    test("Deve falhar ao tentar cancelar reserva já cancelada (Pessoa 6)", async () => {
      const reservation = createFakeReservation({ id: "res-1", status: "CANCELLED" });
      reservationRepositoryMock.findById.mockResolvedValue(reservation);

      await expect(reservationService.cancelReservation("res-1")).rejects.toThrow(
        "A reserva já está cancelada."
      );
    });

    test("Deve falhar ao tentar cancelar reserva já concluída ou em andamento (Pessoa 6)", async () => {
      const pastReservation = createFakeReservation({
        id: "res-1",
        startTime: new Date("2025-01-01T10:00:00Z"),
        endTime: new Date("2025-01-01T12:00:00Z"),
        status: "CONFIRMED",
      });

      reservationRepositoryMock.findById.mockResolvedValue(pastReservation);

      await expect(reservationService.cancelReservation("res-1")).rejects.toThrow(
        "Não é possível cancelar uma reserva já concluída ou em andamento."
      );
    });
  });
});