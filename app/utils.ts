import { roles } from "./components/consts";

export const getRoleName = (userRoleId: number) => {
  return roles.find((role) => role.id === userRoleId)?.name;
};
