import { jest } from "@jest/globals";
import { ReservationService } from "../src/services/ReservationService.js";
import {
  createFakeReservation,
  createFakeUser,
  createFakeRoom,
} from "../src/factories/reservationFactory.js";

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
      // Arrange
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

      // Act
      const result = await reservationService.createReservation(validData);

      // Assert
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
      const reservation = createFakeReservation({
        id: "res-1",
        startTime: "2026-11-10T10:00:00Z",
        status: "CONFIRMED",
      });
      const cancelDate = new Date("2026-11-08T10:00:00Z"); // 48h antes

      reservationRepositoryMock.findById.mockResolvedValue(reservation);
      reservationRepositoryMock.save.mockImplementation((payload) => Promise.resolve(payload));

      const result = await reservationService.cancelReservation("res-1", cancelDate);

      expect(result.status).toBe("CANCELLED");
      expect(result.refundPercentage).toBe(100);
      expect(paymentServiceMock.refund).toHaveBeenCalledWith(expect.any(Object), 100);
      expect(notificationServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Sua reserva foi cancelada com sucesso. Reembolso: 100%.",
        })
      );
    });

    test("Deve aplicar retenção de taxa (50% reembolso) se antecedência < 24h (Pessoa 4 / Pessoa 5)", async () => {
      const reservation = createFakeReservation({
        id: "res-1",
        startTime: "2026-11-10T10:00:00Z",
        status: "CONFIRMED",
      });
      const cancelDate = new Date("2026-11-09T18:00:00Z"); // 16h antes

      reservationRepositoryMock.findById.mockResolvedValue(reservation);
      reservationRepositoryMock.save.mockImplementation((payload) => Promise.resolve(payload));

      const result = await reservationService.cancelReservation("res-1", cancelDate);

      expect(result.refundPercentage).toBe(50);
      expect(result.cancellationFee).toBe(50);
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
      const reservation = createFakeReservation({
        id: "res-1",
        startTime: "2026-11-10T10:00:00Z",
        status: "CONFIRMED",
      });
      const cancelDate = new Date("2026-11-10T11:00:00Z"); // Após o início

      reservationRepositoryMock.findById.mockResolvedValue(reservation);

      await expect(reservationService.cancelReservation("res-1", cancelDate)).rejects.toThrow(
        "Não é possível cancelar uma reserva já concluída ou em andamento."
      );
    });
  });
});