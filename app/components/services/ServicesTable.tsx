import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import { IService, IServicesData } from "../../types";
import api from "../../api";
import { Toast } from "primereact/toast";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import {  serviceStatuses } from "../consts";
import CreateUpdateDialog from "./CreateUpdateDialog";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import ReportsDialog from "./ReportsDialog";

interface IServicesTableProps {
  userPermissions: string[];
}
function ServicesTable({ userPermissions }: IServicesTableProps) {
  const [services, setServices] = useState<IService[]>([]);

  const [service, setService] = useState<IService>();
  const [dialog, setDialog] = useState(false);
  const [reportsDialog, setReportsDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState<string>();
  const [first, setFirst] = useState(0);
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
  const editService = (newService: IService) => {
    setService(newService);
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
    setFirst(event.first);
  };

  const actionBodyTemplate = (rowData: IService) => {
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
      </React.Fragment>
    );
  };

  const header = userPermissions.includes("service.create") && (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Button
        label="Reports"
        icon="pi pi-file-excel"
        severity="success"
        onClick={() => setReportsDialog(true)}
        style={{ marginRight: "10px" }}
      />
      <Button label="Add" icon="pi pi-plus" onClick={() => setDialog(true)} />
    </div>
  );

  const dateBodyTemplate = (rowData: IService) => {
    return rowData.created_at.split(" ")[0];
  };

  const getDoctorFullName = (rowData: IService) => {
    return `${rowData.user?.name} ${rowData.user?.surname}`;
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
    const status = serviceStatuses.find(
      (status) => status?.id === rowData.status
    )?.name;
    const onRejectClick = () => {
      if (status === "Rejected") {
        setRejectComment(rowData.reject_comment);
        setRejectDialog(true);
      }
    };
    return (
      <Tag
        onClick={onRejectClick}
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
        {userPermissions.includes("service.update") && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "2%" }}
          ></Column>
        )}
      </DataTable>
      <Paginator first={first} rows={rows} totalRecords={total} onPageChange={onPageChange} />
      <Toast ref={toast} />
      <CreateUpdateDialog
        userPermissions={userPermissions}
        dialog={dialog}
        setDialog={setDialog}
        showSuccess={showSuccess}
        setServices={setServices}
        service={service}
        setService={setService}
      />
      <ReportsDialog dialog={reportsDialog} setDialog={setReportsDialog} />
      <Dialog
        header="Reject comment"
        visible={rejectDialog}
        style={{ width: "50vw" }}
        onHide={() => {
          if (!rejectDialog) return;
          setRejectDialog(false);
          setRejectComment("");
        }}
      >
        <p className="m-0">{rejectComment}</p>
      </Dialog>
    </>
  );
}

export default ServicesTable;
