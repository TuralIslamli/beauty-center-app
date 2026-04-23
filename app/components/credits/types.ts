import { IDoctor, IServiceType } from '@/app/types';

export type CreditStatus = 'active' | 'finished' | 'rejected';
export type CreditSessionStatus = 'arrived' | 'pending' | 'rejected';

export interface ICreditSession {
  id: number;
  date: Date | null;
  doctor?: IDoctor;
  status: CreditSessionStatus;
}

export interface ICredit {
  id: number;
  created_at: string;
  client_name: string;
  client_phone: string;
  status: CreditStatus;
  sessions_count: number;
  bank: string;
  amount: number;
  received_amount: number;
  comment?: string;
  service_types: IServiceType[];
  sessions: ICreditSession[];
}

export interface ICreditFormPayload {
  client_name: string;
  client_phone: string;
  service_types: IServiceType[];
  sessions_count: number;
  bank: string;
  comment?: string;
  sessions: ICreditSession[];
  amount: number;
  received_amount: number;
}
