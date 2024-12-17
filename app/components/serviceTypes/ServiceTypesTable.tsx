import React, { useEffect, useRef, useState } from "react";
import api from "../../api";
import { IServiceType, IServiceTypesData } from "@/app/types";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column, ColumnEditorOptions } from "primereact/column";
import {
  InputNumber,
  InputNumberValueChangeEvent,
} from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import AddDialog from "./AddDialog";
import DeleteServiceTypeDialog from "./DeleteDialog";

interface IServiceTypeProps {
  userPermissions?: string[];
}

function ServiceTypesTable({ userPermissions }: IServiceTypeProps) {
  const [servicesType, setServicesType] = useState<IServiceType>();
  const [deleteDialog, setDeleteDiaolog] = useState(false);
  const [servicesTypes, setServicesTypes] = useState<IServiceType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [dialog, setDialog] = useState(false);
  const toast = useRef<Toast>(null);
  const [first, setFirst] = useState(0);

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: "success",
      summary: "Success",
      detail: message,
      life: 3000,
    });
  };

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setFirst(event.first);
    fetchData(event.page + 1);
  };

  const onRowEditComplete = ({ newData }: DataTableRowEditCompleteEvent) => {
    let { id, name, price } = newData;
    price = price || 0;
    try {
      api.updateServiceType({ id, name, price });
      const updatedServiceType = {
        ...newData,
        name,
        price,
        id,
      };

      const updatedServices = servicesTypes.map((service) =>
        service.id === updatedServiceType.id ? updatedServiceType : service
      );
      setServicesTypes(updatedServices);

      showSuccess("Service type has been successfully updated");
    } catch (error) {
      console.error(error);
    }
  };

  const priceEditor = (options: ColumnEditorOptions) => {
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e: InputNumberValueChangeEvent) =>
          options.editorCallback!(e.value)
        }
        mode="currency"
        currency="AZN"
        locale="de-DE"
      />
    );
  };

  const textEditor = (options: ColumnEditorOptions) => {
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          options.editorCallback!(e.target.value)
        }
      />
    );
  };

  const priceBodyTemplate = (rowData: IServiceType) => {
    const formatter = new Intl.NumberFormat("az-AZ", {
      style: "currency",
      currency: "AZN",
    });

    const parts = formatter.formatToParts(+rowData.price);
    const currencySymbol =
      parts.find((part) => part.type === "currency")?.value ?? "AZN";
    const formattedPrice = parts
      .filter((part) => part.type !== "currency")
      .map((part) => part.value)
      .join("");

    return `${formattedPrice} ${currencySymbol}`;
  };

  const allowEdit = (rowData: IServiceType) => {
    return rowData?.name !== "Blue Band";
  };

  const fetchData = async (page = 1) => {
    try {
      const { data, meta }: IServiceTypesData = await api.getServiceTypes({
        page,
        size: rows,
      });
      setServicesTypes(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDeleteServiceType = (servicesType: IServiceType) => {
    setServicesType(servicesType);
    setDeleteDiaolog(true);
  };

  const header = userPermissions?.includes("service_type.create") && (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Button label="Əlavə et" icon="pi pi-plus" onClick={() => setDialog(true)} />
    </div>
  );

  const actionBodyTemplate = (rowData: IServiceType) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteServiceType(rowData)}
        />
      </React.Fragment>
    );
  };

  return (
    <div>
      <DataTable
        value={servicesTypes}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        tableStyle={{ minWidth: "50rem" }}
        header={header}
        style={{ marginBottom: "10px" }}
      >
        <Column
          field="name"
          header="Ad"
          editor={(options) => textEditor(options)}
          style={{ width: "40%" }}
        ></Column>
        <Column
          field="price"
          header="Qiymət"
          body={priceBodyTemplate}
          editor={(options) => priceEditor(options)}
          style={{ width: "40%" }}
        ></Column>
        {userPermissions?.includes("service_type.update") && (
          <Column
            rowEditor={allowEdit}
            headerStyle={{ width: "10%" }}
            bodyStyle={{ textAlign: "center" }}
          ></Column>
        )}
        {userPermissions?.includes("service_type.delete") && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "1%" }}
          ></Column>
        )}
      </DataTable>
      <Paginator first={first} rows={rows} totalRecords={total} onPageChange={onPageChange} />
      <Toast ref={toast} />
      <AddDialog
        dialog={dialog}
        setDialog={setDialog}
        showSuccess={showSuccess}
        setServicesTypes={setServicesTypes}
      />
      <DeleteServiceTypeDialog
        serviceType={servicesType}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDiaolog}
        setServicesTypes={setServicesTypes}
        showSuccess={showSuccess}
      />
    </div>
  );
}

export default ServiceTypesTable;
