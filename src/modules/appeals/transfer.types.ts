export type TransferErrorCode =
  | 'ATHLETE_NOT_FOUND'
  | 'ENROLLMENT_NOT_FOUND'
  | 'PROGRAM_FULL';

export type ParsedTransferMessage = {
  voucherEmail: string;
  currentProviderId: string;
  desiredProviderId: string;
  currentSport: string;
  desiredSport: string;
};

export type ChildTransferResult = {
  childId: string;
  childIin: string;
  childName: string;
  transferred: boolean;
  enrollmentId?: string;
  error?: {
    code: TransferErrorCode | 'UNKNOWN_ERROR';
    message: string;
  };
};

export type TransferResponse = {
  success: boolean;
  allTransferred: boolean;
  results: ChildTransferResult[];
};
