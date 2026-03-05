export interface ErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

export class VynFiError extends Error {
  public readonly statusCode: number;
  public readonly body?: ErrorBody;

  constructor(message: string, statusCode: number, body?: ErrorBody) {
    super(message);
    this.name = "VynFiError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

export class AuthenticationError extends VynFiError {
  constructor(body?: ErrorBody) {
    super(body?.error ?? "Authentication failed", 401, body);
    this.name = "AuthenticationError";
  }
}

export class InsufficientCreditsError extends VynFiError {
  constructor(body?: ErrorBody) {
    super(body?.error ?? "Insufficient credits", 402, body);
    this.name = "InsufficientCreditsError";
  }
}

export class NotFoundError extends VynFiError {
  constructor(body?: ErrorBody) {
    super(body?.error ?? "Resource not found", 404, body);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends VynFiError {
  constructor(body?: ErrorBody) {
    super(body?.error ?? "Conflict", 409, body);
    this.name = "ConflictError";
  }
}

export class ValidationError extends VynFiError {
  constructor(body?: ErrorBody) {
    super(body?.error ?? "Validation error", 422, body);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends VynFiError {
  constructor(body?: ErrorBody) {
    super(body?.error ?? "Rate limit exceeded", 429, body);
    this.name = "RateLimitError";
  }
}

export class ServerError extends VynFiError {
  constructor(statusCode: number, body?: ErrorBody) {
    super(body?.error ?? "Internal server error", statusCode, body);
    this.name = "ServerError";
  }
}
