import { config } from '../../config';
import { PaymentProvider, SubscriptionCheckoutRequest, SubscriptionCheckoutResponse } from '../interface';

export class FlutterwaveAdapter implements PaymentProvider {
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  async createSubscriptionCheckout(req: SubscriptionCheckoutRequest): Promise<SubscriptionCheckoutResponse> {
    if (!config.FLW_SECRET_KEY) {
      return { ok: false, reason: 'Flutterwave keys not configured' };
    }

    // Generate a unique transaction reference
    const txRef = req.customTxRef || (req.subscriptionId ? `TUTO_SUB_${req.subscriptionId}_${Date.now()}` : `TUTO_CHECKOUT_${req.userId}_${req.planId}_${Date.now()}`);

    // Note: Amount in our system is kobo. Flutterwave expects NGN (naira).
    const amountNGN = req.amountKobo / 100;

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: amountNGN,
          currency: req.currency || 'NGN',
          redirect_url: req.redirectUrl,
          payment_options: 'card,banktransfer,ussd,account,qr',
          customer: {
            email: req.email,
          },
          customizations: {
            title: 'Tuto Subscription',
            description: `Subscription for ${req.interval || 'Plan'}`,
            logo: `${config.NEXT_PUBLIC_APP_URL}/logo.png`,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        return {
          ok: true,
          paymentLink: data.data.link,
          reference: txRef,
        };
      } else {
        return { ok: false, reason: data.message || 'Payment initialization failed' };
      }
    } catch (error: any) {
      return { ok: false, reason: error.message };
    }
  }

  async verifyTransaction(
    reference: string,
    transactionId?: string
  ): Promise<{ ok: boolean; data?: any; reason?: string }> {
    if (!config.FLW_SECRET_KEY) return { ok: false, reason: 'Flutterwave keys not configured' };

    try {
      let txId = transactionId;

      // 1. If transactionId was not directly passed, search by reference
      if (!txId && reference) {
        if (/^\d+$/.test(reference)) {
          txId = reference;
        } else {
          const listResponse = await fetch(`${this.baseUrl}/transactions?tx_ref=${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${config.FLW_SECRET_KEY}` },
          });
          const listData = await listResponse.json();
          if (listResponse.ok && listData.data && listData.data.length > 0) {
            txId = listData.data[0].id;
          }
        }
      }

      if (!txId) {
        return { ok: false, reason: 'Transaction not found' };
      }

      // 2. Verify transaction directly with Flutterwave
      const verifyResponse = await fetch(`${this.baseUrl}/transactions/${txId}/verify`, {
        headers: { Authorization: `Bearer ${config.FLW_SECRET_KEY}` },
      });
      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.status === 'success') {
        return { ok: true, data: verifyData.data };
      }

      return { ok: false, reason: verifyData.message || 'Verification failed' };
    } catch (error: any) {
      return { ok: false, reason: error.message };
    }
  }
}

export const payments = new FlutterwaveAdapter();
