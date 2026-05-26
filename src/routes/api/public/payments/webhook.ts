import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { sendEmail, renderReportEmail } from "@/lib/email.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

function resolvePriceId(item: any): string {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) { console.error("No userId in subscription metadata"); return; }
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  // Notify on cancellation scheduled or status changes
  if (subscription.cancel_at_period_end || subscription.status === "canceled") {
    const email = (subscription as any)?.customer_email || null;
    if (email) {
      await sendEmail({
        to: email,
        subject: "Vaše predplatné LacnéEnergie",
        html: `<p>Vaše predplatné bolo aktualizované. Stav: <strong>${subscription.status}</strong>.</p>`,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.mode !== "payment") return;
  const md = session.metadata || {};
  const priceId = md.priceId || null;
  let userId: string | null = md.userId || null;
  const quoteId = md.quoteId || null;
  const amount = session.amount_total ?? 0;
  const email = session.customer_details?.email || session.customer_email || null;

  const supabase = getSupabase();

  // Guest recovery: if no userId but we have an email matching an auth user, link it
  if (!userId && email) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (prof?.id) userId = prof.id;
  }

  await supabase.from("orders").upsert(
    {
      user_id: userId,
      email,
      stripe_session_id: session.id,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      price_id: priceId,
      amount_cents: amount,
      currency: session.currency || "eur",
      status: "paid",
      quote_household_id: quoteId,
      environment: env,
      paid_at: new Date().toISOString(),
      product_label: "Personalizovaný report úspory",
    },
    { onConflict: "stripe_session_id" }
  );

  // Generate report row + send email
  if (quoteId) {
    await supabase.from("quotes_household").update({ paid: true }).eq("id", quoteId);

    const { data: quote } = await supabase
      .from("quotes_household")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (quote) {
      // Pick top 3 cheapest validated tariffs for this distribution
      const { data: tariffs } = await supabase
        .from("tariffs")
        .select("id, product_name, unit_price_eur_per_kwh, monthly_fee_eur, supplier_id, suppliers(name)")
        .eq("status", "validated")
        .eq("segment", "household")
        .eq("energy_type", "electricity")
        .or(`distribution_area.eq.${quote.distribution_area},distribution_area.is.null`)
        .order("unit_price_eur_per_kwh", { ascending: true })
        .limit(3);

      const recommendations = (tariffs ?? []).map((t: any) => ({
        supplier: t.suppliers?.name ?? "—",
        product: t.product_name,
        unit_price: t.unit_price_eur_per_kwh,
        monthly_fee: t.monthly_fee_eur,
      }));

      const { data: report } = await supabase.from("reports").insert({
        user_id: userId,
        quote_household_id: quoteId,
        order_id: null,
        email,
        top_recommendations: recommendations,
        estimated_savings_eur: quote.estimated_savings_eur ?? 0,
        instructions_md: "Pozri si TOP 3 odporúčania v účte a podpíš zmluvu s vybraným dodávateľom.",
      }).select("id").single();

      if (email) {
        const origin = process.env.PUBLIC_SITE_URL || "https://frugal-energy-finder.lovable.app";
        await sendEmail({
          to: email,
          subject: "Váš report úspory je pripravený",
          html: renderReportEmail({
            estimatedSavings: Number(quote.estimated_savings_eur ?? 0),
            distribution: quote.distribution_area,
            annualKwh: Number(quote.annual_consumption_kwh ?? 0),
            reportUrl: `${origin}/ucet?session_id=${session.id}`,
          }),
        });
      }

      if (report?.id) {
        await supabase.from("orders").update({ report_url: `/ucet?report=${report.id}` })
          .eq("stripe_session_id", session.id);
      }
    }
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  // Renewal notification
  const email = invoice.customer_email;
  if (email && invoice.billing_reason === "subscription_cycle") {
    await sendEmail({
      to: email,
      subject: "Vaše predplatné LacnéEnergie bolo obnovené",
      html: `<p>Vaše ročné predplatné sledovania cien bolo úspešne obnovené. Ďakujeme.</p>`,
    });
  }
  console.log("invoice.paid", invoice.id, env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid or missing env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
