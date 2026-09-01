import { BadRequestException, NotAcceptableException } from '@nestjs/common';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { customAlphabet } from 'nanoid';

export const normalizePhoneNumber = (phoneNumber: string) => {
  const parsed = parsePhoneNumberFromString(phoneNumber, 'NG');

  if (!parsed || !parsed.isValid()) {
    throw new NotAcceptableException({
      message: 'Invalid phone number format.',
      success: false,
      status: 406,
    });
  }

  return parsed.number;
};

export const generateRefCode = (): string => {
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTVWXYZ0123456789', 8);

  const code = `AT-${nanoid()}`;
  return code;
};

export const generatePaymentReference = (
  payload,
  refType: 'PAYMENT' | 'WITHDRAWAL',
) => {
  const { userId, plan } = payload;

  if (!userId || !plan) {
    throw new BadRequestException({
      message: 'User ID and plan are required.',
      success: false,
      status: 400,
    });
  }

  const ref = `${refType}_${plan}_${userId}_${Date.now()}`;

  return ref;
};

export function addDays(date: Date, days: number): Date {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  if (typeof days !== 'number') {
    throw new Error('Days must be a number');
  }

  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}
