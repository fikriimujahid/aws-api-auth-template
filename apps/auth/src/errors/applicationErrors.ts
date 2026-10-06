export class InvalidIdTokenError extends Error {
  constructor() {
    super("Invalid ID token in refresh response");
    this.name = "InvalidIdTokenError";
  }
}