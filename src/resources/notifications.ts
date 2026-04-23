import type { VynFiClient } from "../client.js";
import type { Notification } from "../types.js";

export class Notifications {
  constructor(private readonly client: VynFiClient) {}

  async list(): Promise<Notification[]> {
    return this.client.requestList("GET", "/v1/notifications");
  }

  async markRead(id: string): Promise<Notification> {
    return this.client.request("POST", `/v1/notifications/${id}/read`);
  }

  async markAllRead(): Promise<{ marked: number }> {
    return this.client.request("POST", "/v1/notifications/read-all");
  }
}
