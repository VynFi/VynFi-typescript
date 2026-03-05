import type { VynFiClient } from "../client.js";
import type { Subscription, Invoice, PaymentMethod } from "../types.js";

export class Billing {
  constructor(private readonly client: VynFiClient) {}

  /** Get the current subscription details. */
  async subscription(): Promise<Subscription> {
    return this.client.request("GET", "/v1/billing/subscription");
  }

  /** List all invoices. */
  async invoices(): Promise<Invoice[]> {
    return this.client.requestList("GET", "/v1/billing/invoices");
  }

  /** Get the payment method on file. */
  async paymentMethod(): Promise<PaymentMethod> {
    return this.client.request("GET", "/v1/billing/payment-method");
  }
}
