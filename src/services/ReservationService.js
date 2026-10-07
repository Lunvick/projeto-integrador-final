export class ReservationService {
  constructor({
    reservationRepository,
    roomRepository,
    userRepository,
    paymentService,
    notificationService,
  }) {
    this.reservationRepository = reservationRepository;
    this.roomRepository = roomRepository;
    this.userRepository = userRepository;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
  }

  async createReservation(reservationData) {
    const { roomId, userId, startTime, endTime, guestCount } = reservationData;

    if (!roomId || !userId || !startTime || !endTime || !guestCount) {
      throw new Error("Dados obrigatórios ausentes para a reserva.");
    }

    // Bloqueio de Usuários Inadimplentes
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }
    if (user.isDelinquent) {
      throw new Error("Usuário inadimplente não pode realizar reservas.");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Datas de início ou término inválidas.");
    }

    if (start >= end) {
      throw new Error("A data/hora de início deve ser anterior à data/hora de término.");
    }

    // Validação de capacidade da sala
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error("Sala/Recurso não encontrado.");
    }

    if (guestCount > room.capacity) {
      throw new Error(
        `A quantidade de pessoas (${guestCount}) excede a capacidade máxima da sala (${room.capacity}).`
      );
    }

    //Prevenção de Overbooking
    const existingReservations = await this.reservationRepository.findByRoomAndDateRange(
      roomId,
      start,
      end
    );

    const hasOverlap = existingReservations.some((existing) => {
      const existingStart = new Date(existing.startTime);
      const existingEnd = new Date(existing.endTime);
      return start < existingEnd && end > existingStart;
    });

    if (hasOverlap) {
      throw new Error("Conflito de horário: A sala já possui uma reserva no período selecionado.");
    }

    return await this.reservationRepository.save({
      ...reservationData,
      startTime: start,
      endTime: end,
      status: "CONFIRMED",
      createdAt: new Date(),
    });
  }

  async cancelReservation(reservationId, cancelDate = new Date()) {
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new Error("Reserva não encontrada.");
    }

    if (reservation.status === "CANCELLED") {
      throw new Error("A reserva já está cancelada.");
    }

    const reservationStart = new Date(reservation.startTime);
    const cancellationTime = new Date(cancelDate);
    const hoursDifference = (reservationStart.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

    // Impedir cancelamento no passado/concluído
    if (reservation.status === "COMPLETED" || hoursDifference <= 0) {
      throw new Error("Não é possível cancelar uma reserva já concluída ou em andamento.");
    }

    // Reembolso dinâmico (24h)
    let refundPercentage = 100;
    let cancellationFee = 0;

    if (hoursDifference < 24) {
      refundPercentage = 50;
      cancellationFee = 50;
    }

    const cancelledReservation = {
      ...reservation,
      status: "CANCELLED",
      refundPercentage,
      cancellationFee,
      cancelledAt: cancellationTime,
    };

    if (this.paymentService) {
      await this.paymentService.refund(cancelledReservation, refundPercentage);
    }

    const updatedReservation = await this.reservationRepository.save(cancelledReservation);

    if (this.notificationService) {
      await this.notificationService.send({
        ...updatedReservation,
        message: `Sua reserva foi cancelada com sucesso. Reembolso: ${refundPercentage}%.`,
      });
    }

    return updatedReservation;
  }
}