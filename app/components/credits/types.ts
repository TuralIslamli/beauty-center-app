import { IDoctor, IServiceCreditBank, IServiceType, IUser } from '@/app/types';

export type CreditStatus = 'active' | 'finished' | 'rejected';
export type CreditSessionStatus = 'arrived' | 'pending' | 'rejected';

export interface ICreditSession {
  id: number;
  date: Date | null;
  doctor?: IDoctor;
  status: CreditSessionStatus;
}

export type ICreditBank = IServiceCreditBank;

export interface ICreditVisit {
  id: number;
  status: number;
  doctor?: IUser;
  reservation_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICredit {
  id: number;
  created_at: string;
  updated_at?: string;
  client_name: string;
  client_phone: string;
  status?: CreditStatus;
  sessions_count?: number;
  bank: ICreditBank | string | null;
  amount: number | string;
  received_amount?: number;
  comment?: string;
  service_types: IServiceType[];
  visits?: ICreditVisit[];
  sessions?: ICreditSession[];
}

export interface IServiceCreditsData {
  data: ICredit[];
  meta: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total: number;
  };
}

export interface IServiceCreditData {
  data: ICredit;
}

export interface IServiceCreditBankIncome {
  bank: string;
  totalAmount: number | string;
}

export interface IServiceCreditBankIncomesData {
  data: IServiceCreditBankIncome[];
}

export interface ICreditFormPayload {
  client_name: string;
  client_phone: string;
  service_types: IServiceType[];
  sessions_count: number;
  bank: ICreditBank | string | null;
  comment?: string;
  sessions: ICreditSession[];
  amount: number;
  received_amount: number;
}
