import { jest } from "@jest/globals";
import { ReservationService } from "../services/ReservationService.js";

describe("ReservationService - Core", () => {
let reservationRepositoryMock;
let roomRepositoryMock;
let reservationService;

  beforeEach(() => {
    reservationRepositoryMock = {
      findByRoomAndDateRange: jest.fn(),
      save: jest.fn(),
    };

    roomRepositoryMock = {
      findById: jest.fn(),
    };

    reservationService = new ReservationService({
      reservationRepository: reservationRepositoryMock,
      roomRepository: roomRepositoryMock,
    });
  });
  test("Deve criar uma reserva com sucesso", async () => {
    // ARRANGE
    const validData = {
      roomId: "room-1",
      userId: "user-1",
      startTime: "2026-11-10T10:00:00Z",
      endTime: "2026-11-10T12:00:00Z",
      guestCount: 5,
    };

    roomRepositoryMock.findById.mockResolvedValue({ id: "room-1", capacity: 10 });
    reservationRepositoryMock.findByRoomAndDateRange.mockResolvedValue([]);
    reservationRepositoryMock.save.mockImplementation((payload) =>
      Promise.resolve({ id: "res-1", ...payload })
    );

    // ACT
    const result = await reservationService.createReservation(validData);

    // ASSERT
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
});