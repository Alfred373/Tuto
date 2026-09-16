export interface SubscriptionCheckoutRequest {
  userId: string;
  email: string;
  planId: string;
  amountKobo: number;
  interval?: 'MONTHLY' | 'ANNUAL';
  currency?: string;
  redirectUrl: string;
  subscriptionId?: string;
  customTxRef?: string;
}

export interface SubscriptionCheckoutResponse {
  ok: boolean;
  paymentLink?: string;
  reference?: string;
  reason?: string;
}

export interface PaymentProvider {
  /**
   * Initializes a subscription checkout session and returns a hosted link.
   */
  createSubscriptionCheckout(req: SubscriptionCheckoutRequest): Promise<SubscriptionCheckoutResponse>;
  
  /**
   * Verifies a transaction by its reference.
   */
  verifyTransaction(reference: string, transactionId?: string): Promise<{ ok: boolean, data?: any, reason?: string }>;
}
