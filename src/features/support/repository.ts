import { prisma } from "@/lib/prisma";

export function createTicket(data: {
  userId: string | null;
  name: string;
  email: string;
  message: string;
}) {
  return prisma.supportTicket.create({ data });
}

export function findAllTickets() {
  return prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" } });
}

export function findTicketById(id: string) {
  return prisma.supportTicket.findUnique({ where: { id } });
}

export function updateTicketStatus(id: string, status: string) {
  return prisma.supportTicket.update({ where: { id }, data: { status } });
}
