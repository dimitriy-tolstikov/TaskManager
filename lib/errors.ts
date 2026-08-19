export class DomainError extends Error {}

export class ValidationError extends DomainError {}

export class ConflictError extends DomainError {}

export class NotFoundError extends DomainError {}

export class UnauthorizedError extends DomainError {}
