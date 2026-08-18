"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Ticket = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "Open" | "Resolved";
  createdAt: string;
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  function loadTickets() {
    fetch("/api/admin/support/tickets")
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch(() => setTickets([]));
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function toggleStatus(ticket: Ticket) {
    const nextStatus = ticket.status === "Open" ? "Resolved" : "Open";

    const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error("Could not update ticket");
      return;
    }

    toast.success(`Marked ${nextStatus.toLowerCase()}`);
    loadTickets();
  }

  const openCount = tickets?.filter((t) => t.status === "Open").length ?? 0;

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Customers
      </p>
      <h1 className="mb-8 mt-2 flex items-center gap-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        <LifeBuoy className="h-8 w-8 text-brand-600" /> Support Requests
        {openCount > 0 && <Badge variant="warning">{openCount} open</Badge>}
      </h1>

      {tickets === null ? (
        <div className="h-40 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
      ) : tickets.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-16 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <LifeBuoy className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
            No support requests yet
          </p>
          <p className="mt-2 text-neutral-500">
            Escalations from the AI Shopping Assistant will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">{ticket.name}</p>
                  <p className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <Mail className="h-3.5 w-3.5" /> {ticket.email}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={ticket.status === "Open" ? "warning" : "success"}>
                    {ticket.status}
                  </Badge>
                  <span className="text-xs text-neutral-400">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-200">
                {ticket.message}
              </p>

              <Button variant="outline" className="mt-4" onClick={() => toggleStatus(ticket)}>
                Mark as {ticket.status === "Open" ? "Resolved" : "Open"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
