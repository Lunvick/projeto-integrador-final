import { jest } from "@jest/globals";
import { ReservationService } from "../services/ReservationService.js";

describe("ReservationService", () => {
  let reservationRepositoryMock;
  let roomRepositoryMock;
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

    paymentServiceMock = {
      refund: jest.fn(),
    };

    notificationServiceMock = {
      send: jest.fn(),
    };

    reservationService = new ReservationService({
      reservationRepository: reservationRepositoryMock,
      roomRepository: roomRepositoryMock,
      paymentService: paymentServiceMock,
      notificationService: notificationServiceMock,
    });
  });

  test("cria uma reserva com sucesso", async () => {
    // Arrange
    const reservationData = {
      roomId: "room-1",
      userId: "user-1",
      startTime: "2026-11-10T10:00:00Z",
      endTime: "2026-11-10T12:00:00Z",
      guestCount: 5,
    };
    const savedReservation = { id: "reservation-1", ...reservationData };

    roomRepositoryMock.findById.mockResolvedValue({
      id: "room-1",
      capacity: 10,
    });
    reservationRepositoryMock.findByRoomAndDateRange.mockResolvedValue([]);
    reservationRepositoryMock.save.mockResolvedValue(savedReservation);

    // Act
    const result = await reservationService.createReservation(reservationData);

    // Assert
    expect(result).toEqual(savedReservation);
    expect(roomRepositoryMock.findById).toHaveBeenCalledWith("room-1");
    expect(
      reservationRepositoryMock.findByRoomAndDateRange
    ).toHaveBeenCalledWith(
      "room-1",
      new Date("2026-11-10T10:00:00Z"),
      new Date("2026-11-10T12:00:00Z")
    );
    expect(reservationRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ...reservationData,
        startTime: new Date("2026-11-10T10:00:00Z"),
        endTime: new Date("2026-11-10T12:00:00Z"),
        status: "CONFIRMED",
      })
    );
  });

  test("cancela uma reserva com reembolso integral e notifica o usuário", async () => {
    // Arrange
    const reservation = {
      id: "reservation-1",
      userId: "user-1",
      roomId: "room-1",
      status: "CONFIRMED",
    };
    const cancelledReservation = {
      ...reservation,
      status: "CANCELLED",
    };

    reservationRepositoryMock.findById.mockResolvedValue(reservation);
    reservationRepositoryMock.save.mockResolvedValue(cancelledReservation);

    // Act
    const result = await reservationService.cancelReservation("reservation-1");

    // Assert
    expect(result).toEqual(cancelledReservation);
    expect(reservationRepositoryMock.findById).toHaveBeenCalledWith(
      "reservation-1"
    );
    expect(paymentServiceMock.refund).toHaveBeenCalledWith(reservation, 100);
    expect(reservationRepositoryMock.save).toHaveBeenCalledWith(
      cancelledReservation
    );
    expect(notificationServiceMock.send).toHaveBeenCalledWith(
      cancelledReservation
    );
  });
});
