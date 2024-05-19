import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { IService, IServicesData, IUser, IUserData } from "../../types";
import api from "../../api";
import { Toast } from "primereact/toast";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { roles, serviceStatuses } from "../consts";
import { getRoleName } from "@/app/utils";
import CreateUpdateDialog from "./CreateUpdateDialog";
import { Tag } from "primereact/tag";

function ServicesTable() {
  const [services, setServices] = useState<IService[]>([]);

  const [service, setService] = useState<IUser>({} as IUser);
  const [dialog, setDialog] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<number>(10);
  const toast = useRef<Toast>(null);

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: "success",
      summary: "Success",
      detail: message,
      life: 3000,
    });
  };
  const editService = (user: IUser) => {
    setService(user);
    setDialog(true);
  };

  const fetchData = async (page = 1) => {
    try {
      const { data, meta }: IServicesData = await api.getServices({
        page,
        size: rows,
      });
      setServices(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    fetchData(event.page + 1);
  };

  const actionBodyTemplate = (rowData: IUser) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          style={{ marginRight: "10px" }}
          onClick={() => editService(rowData)}
        />
        {/* <Button
          icon="pi pi-trash"
          rounded
          outlined
          text
          severity="danger"
          onClick={() => confirmDeleteUser(rowData)}
        /> */}
      </React.Fragment>
    );
  };

  const header = (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Button label="Add" icon="pi pi-plus" onClick={() => setDialog(true)} />
    </div>
  );

  const dateBodyTemplate = (rowData: IService) => {
    return rowData.created_at.split(" ")[0];
  };

  const getDoctorFullName = (rowData: IService) => {
    return `${rowData.user.name} ${rowData.user.surname}`;
  };

  const priceBodyTemplate = (rowData: IService) => {
    const formatter = new Intl.NumberFormat("az-AZ", {
      style: "currency",
      currency: "AZN",
    });

    const parts = formatter.formatToParts(+rowData.amount);
    const currencySymbol =
      parts.find((part) => part.type === "currency")?.value ?? "AZN";
    const formattedPrice = parts
      .filter((part) => part.type !== "currency")
      .map((part) => part.value)
      .join("");

    return `${formattedPrice} ${currencySymbol}`;
  };

  const getSeverity = (status?: string) => {
    switch (status) {
      case "Rejected":
        return "danger";

      case "Accepted":
        return "success";

      case "New":
        return "info";
    }
  };

  const statusBody = (rowData: IService) => {
    // return serviceStatuses.find((status) => status?.id === rowData.status)
    //   ?.name;
    const status = serviceStatuses.find(
      (status) => status?.id === rowData.status
    )?.name;
    return (
      <Tag
        // onClick={() => console.log(888)}
        icon={status === "Rejected" && "pi pi-info-circle"}
        value={status}
        severity={getSeverity(status)}
      />
    );
  };
  return (
    <>
      <DataTable
        value={services}
        editMode="row"
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: "50rem" }}
        style={{ marginBottom: "10px" }}
      >
        <Column field="id" header="Id" style={{ width: "2%" }}></Column>
        <Column
          dataType="date"
          header="Date"
          body={dateBodyTemplate}
          style={{ width: "10%" }}
        ></Column>
        <Column
          field="client_name"
          header="Client"
          style={{ width: "10%" }}
        ></Column>
        <Column
          field="client_phone"
          header="Phone"
          style={{ width: "10%" }}
        ></Column>
        <Column
          field="service_type.name"
          header="Service"
          style={{ width: "10%" }}
        ></Column>
        <Column
          field="service_type.name"
          header="Doctor"
          body={getDoctorFullName}
          style={{ width: "10%" }}
        ></Column>
        <Column
          header="Amount"
          body={priceBodyTemplate}
          style={{ width: "10%" }}
        ></Column>
        <Column
          header="Status"
          body={statusBody}
          style={{ width: "10%" }}
        ></Column>
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "2%" }}
        ></Column>
      </DataTable>
      <Paginator rows={rows} totalRecords={total} onPageChange={onPageChange} />
      <Toast ref={toast} />
      {/* <DeleteUserDialog
        user={user}
        userDeleteDialog={userDeleteDialog}
        setUserDeleteDialog={setUserDeleteDialog}
        setServices={setServices}
        showSuccess={showSuccess}
      />
      <EditUserDialog
        user={user}
        setUser={setUser}
        setServices={setServices}
        userEditDialog={userEditDialog}
        setUserEditDialog={setUserEditDialog}
        showSuccess={showSuccess}
      /> */}
      <CreateUpdateDialog dialog={dialog} setDialog={setDialog} />
    </>
  );
}

export default ServicesTable;
