import * as supportRepository from "@/features/support/repository";
import { SupportValidationError } from "@/features/support/errors";

export function createTicket(input: {
  userId?: string | null;
  name: string;
  email: string;
  message: string;
}) {
  if (!input.name?.trim() || !input.email?.trim() || !input.message?.trim()) {
    throw new SupportValidationError("Name, email, and message are required");
  }

  return supportRepository.createTicket({
    userId: input.userId ?? null,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
  });
}

export function listTickets() {
  return supportRepository.findAllTickets();
}

export async function setTicketStatus(id: string, status: "Open" | "Resolved") {
  const ticket = await supportRepository.findTicketById(id);

  if (!ticket) {
    throw new SupportValidationError("Ticket not found");
  }

  return supportRepository.updateTicketStatus(id, status);
}
