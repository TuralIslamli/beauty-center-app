import { roles } from "./components/consts";

export const getRoleName = (userRoleId: number) => {
  return roles.find((role) => role.id === userRoleId)?.name;
};


export const formatDate = (date: any) => {
  const year = date!.getFullYear();
  const month = String(date!.getMonth() + 1).padStart(2, "0");
  const day = String(date!.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};