export interface IUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: { id: number; name: string };
  permissions: Array<{ id: number; name: string }>;
}

export interface IUserFields {
  name: string;
  surname: string;
  email: string;
  roleId: number;
  password?: string;
  password_repeat?: string;
}

export interface IUpdateUser extends IUserFields {
  id: number;
}

export interface IUserData {
  data: IUser[];
  meta: { total: number };
}

export interface IUserRS {
  data: IUser;
}

export interface ILoginFields {
  email: string;
  password: string;
}

export interface INavigationProps {
  size: number;
  page: number;
}

export interface IServiceTypesData {
  data: IServiceType[];
  meta: { total: number };
}

export interface IServiceType {
  id: number;
  name: string;
  price: number;
}

export interface IServiceTypeFields {
  name: string;
  price: number;
}

export interface IServiceTypeRS {
  data: IServiceType;
}

export interface IService {
  id: number;
  status: number;
  amount: string;
  payment_type: number;
  service_type: IServiceType;
  client_name: string;
  client_phone: string;
  reject_comment?: string;
  created_at: string;
  user: IUser;
}

export interface IServicesData {
  data: IService[];
  meta: { total: number };
}

export interface IServiceFields {
  service_type_id: number;
  client_name: string;
  client_phone: string;
  amount: number;
  payment_type: number;
  user_id: number;
}
