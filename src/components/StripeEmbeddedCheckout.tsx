import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";

interface Props {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  quoteId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, quantity, customerEmail, userId, quoteId, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const cs = await createCheckoutSession({
      data: {
        priceId,
        quantity,
        customerEmail,
        userId,
        quoteId,
        returnUrl: returnUrl || `${window.location.origin}/ucet?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (!cs) throw new Error("No client secret returned");
    return cs;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
