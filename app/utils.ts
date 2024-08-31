import { roles } from "./components/consts";

export const getRoleName = (userRoleId: number) => {
  return roles.find((role) => role.id === userRoleId)?.name;
};

export const formatDate = (date: any) => {
  const year = date?.getFullYear();
  const month = String(date?.getMonth() + 1).padStart(2, "0");
  const day = String(date?.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const haveFilterPermissions = (permissions: string[]) => {
  const filters = [
    "service.filter.status",
    "service.filter.date",
    "service.filter.client_name",
    "service.filter.client_phone",
    "service.filter.service_type",
    "service.filter.doctor",
    "reservation.filter.status",
    "reservation.filter.date",
    "reservation.filter.client_name",
    "reservation.filter.client_phone",
    "reservation.filter.service_type",
    "reservation.filter.doctor",
  ];
  for (const filter of filters) {
    if (permissions.includes(filter)) {
      return true;
    }
  }
  return false;
};
