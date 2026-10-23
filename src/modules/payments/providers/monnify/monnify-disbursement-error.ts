export type DisbursementOutcome = 'REJECTED' | 'UNKNOWN';

export class MonnifyDisbursementError extends Error {
  constructor(
    message: string,
    public readonly outcome: DisbursementOutcome,
    public readonly providerHttpStatus?: number,
    public readonly providerResponse?: unknown,
  ) {
    super(message);
    this.name = 'MonnifyDisbursementError';
  }
}
