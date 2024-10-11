export default class extends Error {
  constructor(message, { status = 400, ...args } = {}) {
    super(message, ...args);
    this.status = status;
  }
}
