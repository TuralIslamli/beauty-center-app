import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { IUser, IUserData } from "../../types";
import DeleteUserDialog from "./DeleteUserDialog";
import EditUserDialog from "./EditUserDialog";
import api from "../../api";
import { Toast } from "primereact/toast";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { roles } from "../consts";
import { getRoleName } from "@/app/utils";
import { Checkbox } from "primereact/checkbox";

interface IUserTableProps {
  userPermissions?: string[];
}

function UsersTable({ userPermissions }: IUserTableProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [first, setFirst] = useState(0);
  const [user, setUser] = useState<IUser>({} as IUser);

  const [userEditDialog, setUserEditDialog] = useState(false);
  const [userDeleteDialog, setUserDeleteDialog] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<number>(10);
  const [page, setPage] = useState(1);
  const toast = useRef<Toast>(null);

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: "success",
      summary: "Success",
      detail: message,
      life: 3000,
    });
  };
  const editUser = (user: IUser) => {
    setUser(user);
    setUserEditDialog(true);
  };

  const confirmDeleteUser = (user: IUser) => {
    setUser(user);
    setUserDeleteDialog(true);
  };

  const fetchData = async (page: number) => {
    try {
      const { data, meta }: IUserData = await api.getUsers({
        page,
        size: rows,
      });
      setUsers(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, []);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    fetchData(event.page + 1);
    setPage(event.page + 1);
    setFirst(event.first);
  };

  const actionBodyTemplate = (rowData: IUser) => {
    return (
      <React.Fragment>
        {userPermissions?.includes("user.update") && (
          <Button
            icon="pi pi-pencil"
            rounded
            text
            severity="secondary"
            style={{ marginRight: "10px" }}
            onClick={() => editUser(rowData)}
          />
        )}

        {userPermissions?.includes("user.delete") && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            text
            severity="danger"
            onClick={() => confirmDeleteUser(rowData)}
          />
        )}
      </React.Fragment>
    );
  };

  const header = (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      {userPermissions?.includes("user.create") && (
        <Button
          label="Əlavə et"
          icon="pi pi-plus"
          onClick={() => setUserEditDialog(true)}
        />
      )}
    </div>
  );

  const roleBody = (rowData: IUser) => {
    return <div>{getRoleName(rowData.role.id)}</div>;
  };

  const visibilityHandler = (rowData: IUser) => {
    return <Checkbox checked={!!rowData.customer_visible} disabled />;
  };

  return (
    <>
      <DataTable
        value={users}
        editMode="row"
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: "50rem" }}
        style={{ marginBottom: "10px" }}
      >
        <Column field="name" header="Ad" style={{ width: "20%" }}></Column>
        <Column
          field="surname"
          header="Soyad"
          style={{ width: "20%" }}
        ></Column>
        <Column field="email" header="Mail" style={{ width: "20%" }}></Column>
        <Column
          field="role"
          body={roleBody}
          header="Rol"
          style={{ width: "15%" }}
        ></Column>
        <Column
          field="customer_visible"
          header="Göstərilmə"
          body={visibilityHandler}
          style={{ width: "10%" }}
        ></Column>
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "15%" }}
        ></Column>
      </DataTable>
      <Paginator first={first} rows={rows} totalRecords={total} onPageChange={onPageChange} />
      <Toast ref={toast} />
      <DeleteUserDialog
        user={user}
        userDeleteDialog={userDeleteDialog}
        setUserDeleteDialog={setUserDeleteDialog}
        setUsers={setUsers}
        showSuccess={showSuccess}
      />
      {}
      <EditUserDialog
        user={user}
        setUsers={setUsers}
        userEditDialog={userEditDialog}
        setUserEditDialog={setUserEditDialog}
        showSuccess={showSuccess}
      />
    </>
  );
}

export default UsersTable;
