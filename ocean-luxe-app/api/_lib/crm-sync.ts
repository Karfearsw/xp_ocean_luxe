import { getSupabaseAdmin } from "./supabase-admin";

async function sendDiscordWebhook(payload: Record<string, unknown>) {
  if (!process.env.DISCORD_WEBHOOK_URL) return { ok: true, skipped: true };
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `Ocean Luxe booking confirmed: ${payload.bookingId}`,
      embeds: [
        {
          title: "Ocean Luxe booking synced",
          description: JSON.stringify(payload, null, 2).slice(0, 3900),
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Discord webhook failed: ${response.status}`);
  return { ok: true };
}

async function sendCrmRest(payload: Record<string, unknown>) {
  if (!process.env.CRM_API_BASE_URL || !process.env.CRM_API_TOKEN) {
    return { ok: true, skipped: true };
  }

  const response = await fetch(`${process.env.CRM_API_BASE_URL.replace(/\/$/, "")}/opportunities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRM_API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`CRM sync failed: ${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

export function buildCrmPayload(booking: Record<string, any>) {
  return {
    bookingId: booking.id,
    guestName: booking.guest_name,
    guestEmail: booking.guest_email,
    guestPhone: booking.guest_phone,
    resortId: booking.resort_id,
    packageId: booking.package_id,
    bookingStatus: booking.booking_status,
    paymentStatus: booking.payment_status,
    stripePaymentIntentId: booking.stripe_payment_intent_id,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    customerPrice: booking.customer_price,
    margin: booking.margin,
  };
}

export async function processPendingQueue(limit = 20) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { processed: 0, skipped: true };

  const { data: jobs, error } = await supabase
    .from("crm_sync_queue")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !jobs) throw new Error(error?.message ?? "Unable to load sync queue.");

  let processed = 0;

  for (const job of jobs) {
    await supabase.from("crm_sync_queue").update({ status: "processing", locked_at: new Date().toISOString() }).eq("id", job.id);
    try {
      if (job.destination === "crm_rest") {
        await sendCrmRest(job.payload);
      } else {
        await sendDiscordWebhook(job.payload);
      }
      await supabase.from("crm_sync_queue").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      processed += 1;
    } catch (reason) {
      const attempts = Number(job.attempt_count ?? 0) + 1;
      const terminal = attempts >= 5;
      await supabase.from("crm_sync_queue").update({
        status: terminal ? "dead_letter" : "failed",
        attempt_count: attempts,
        last_error: reason instanceof Error ? reason.message : "Unknown sync failure",
        next_attempt_at: new Date(Date.now() + Math.min(attempts * 300000, 3600000)).toISOString(),
      }).eq("id", job.id);
    }
  }

  return { processed };
}
