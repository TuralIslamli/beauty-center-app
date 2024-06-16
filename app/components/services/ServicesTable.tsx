import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import {
  IDoctor,
  IDoctorRS,
  IService,
  IServiceType,
  IServiceTypeRS,
  IServicesData,
  ITotalAmount,
} from "../../types";
import api from "../../api";
import { serviceStatuses } from "../consts";
import CreateUpdateDialog from "./CreateUpdateDialog";
import ReportsDialog from "./ReportsDialog";
import React from "react";
import { Calendar } from "primereact/calendar";
import { formatDate } from "@/app/utils";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { Message } from "primereact/message";
import { MultiSelect } from "primereact/multiselect";

interface IServicesTableProps {
  userPermissions: string[];
}

function ServicesTable({ userPermissions }: IServicesTableProps) {
  const [services, setServices] = useState<IService[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [service, setService] = useState<IService>();
  const [doctor, setDoctor] = useState<IDoctor>();
  const [dialog, setDialog] = useState(false);
  const [filter, setFilter] = useState(false);
  const [reportsDialog, setReportsDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [clientName, setClientName] = useState<string>();
  const [serviceTypesFilter, setServiceTypesFilter] =
    useState<IServiceType[]>();
  const [clientPhone, setClientPhone] = useState<string>("+994");
  const [rejectComment, setRejectComment] = useState<string>();
  const [first, setFirst] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<number>(10);
  const [totalAmount, setTotalAmount] = useState<ITotalAmount>();
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
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

  const getServices = async (page = 1) => {
    try {
      const { data, meta }: IServicesData = await api.getServices({
        page,
        size: rows,
        status: filteredStatus?.id,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        client_name: clientName,
        client_phone:
          clientPhone !== "+994"
            ? clientPhone?.toString()?.replace(/[\s-_]/g, "")
            : "",
        service_types: serviceTypesFilter?.map((i) => i.id),
        user_id: doctor?.id,
      });
      setServices(data);
      setTotal(meta?.total);

      const total: ITotalAmount = await api.getTotalAmount({
        status: filteredStatus?.id,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        client_name: clientName,
        client_phone:
          clientPhone !== "+994"
            ? clientPhone?.toString()?.replace(/[\s-_]/g, "")
            : "",
        service_types: serviceTypesFilter?.map((i) => i.id),
        user_id: doctor?.id,
      });

      setTotalAmount(total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dates[1]) {
      getServices();
    }
  }, [
    filteredStatus?.name,
    dates[1],
    clientName,
    clientPhone,
    serviceTypesFilter?.length,
    doctor,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (userPermissions.includes("user.input_search")) {
        const { data: doctorsData }: IDoctorRS = await api.getDoctors();
        setDoctors(doctorsData);
      }
      if (userPermissions.includes("service_type.input_search")) {
        const { data: servicesData }: IServiceTypeRS =
          await api.getInputServices();
        setServiceTypes(servicesData);
      }
    };
    fetchData();
  }, []);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    getServices(event.page + 1);
    setFirst(event.first);
  };

  const onDownloadAllReports = () => {
    api.getAllReportsExcel({
      status: filteredStatus?.id,
      from_date: formatDate(dates[0]),
      to_date: formatDate(dates[1]),
      client_name: clientName,
      client_phone:
        clientPhone !== "+994"
          ? clientPhone?.toString()?.replace(/[\s-_]/g, "")
          : "",
      service_types: serviceTypesFilter?.map((i) => i.id),
      user_id: doctor?.id,
    });
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
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        {userPermissions.includes("service.all_reports") && (
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Filter"
            onClick={() => setFilter((prev) => !prev)}
            style={{ marginRight: "20px" }}
          />
        )}

        <Button
          icon="pi pi-refresh"
          rounded
          raised
          onClick={() => getServices()}
        />
      </div>
      <div>
        {userPermissions.includes("service.all_reports") &&
          !!services.length && (
            <Button
              label="Export"
              icon="pi pi-upload"
              severity="success"
              onClick={onDownloadAllReports}
              style={{ marginRight: "10px" }}
            />
          )}
        {userPermissions.includes("service.daily_report") && (
          <Button
            label="Gün sonu"
            icon="pi pi-file-excel"
            severity="success"
            onClick={() => setReportsDialog(true)}
            style={{ marginRight: "10px" }}
          />
        )}
        <Button
          label="Əlavə et"
          icon="pi pi-plus"
          onClick={() => setDialog(true)}
        />
      </div>
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

  const serviceTypesBody = (rowData: IService) => (
    <div>
      {rowData.service_types.map((i) => (
        <div>{i.name}</div>
      ))}
    </div>
  );
  const statusItemTemplate = (option: any) => {
    return <Tag value={option.name} severity={getSeverity(option.name)} />;
  };

  const statusRowFilterTemplate = () => {
    return (
      <Dropdown
        value={filteredStatus}
        options={serviceStatuses}
        onChange={(e: DropdownChangeEvent) => {
          setFilteredStatus(e.value);
        }}
        itemTemplate={statusItemTemplate}
        placeholder="Select one"
        className="p-column-filter"
        showClear
        style={{ minWidth: "10rem" }}
        optionLabel="name"
      />
    );
  };

  const serviceTypeRowFilterTemplate = () => {
    return (
      <MultiSelect
        filter
        style={{ marginBottom: "10px" }}
        value={serviceTypesFilter}
        onChange={(e) => {
          setServiceTypesFilter(e.value);
        }}
        options={serviceTypes}
        placeholder="Xidmət seçin"
        optionLabel="name"
        showClear
      />
    );
  };

  const doctorsRowFilterTemplate = () => {
    return (
      <Dropdown
        filter
        style={{ marginBottom: "10px" }}
        value={doctor}
        onChange={(e) => {
          setDoctor(e.value);
        }}
        options={doctors}
        placeholder="Həkim seçin"
        optionLabel="full_name"
        showClear
      />
    );
  };

  const dateRowFilterTemplate = () => {
    return (
      <Calendar
        value={dates}
        onChange={(e) => setDates(e.value)}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
        style={{ width: "220px" }}
        dateFormat="dd/mm/yy"
      />
    );
  };

  const clientRowFilterTemplate = () => {
    return (
      <InputText
        placeholder="Ad ilə axtarış"
        style={{ width: "160px" }}
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />
    );
  };

  const phoneRowFilterTemplate = () => {
    return (
      <InputMask
        style={{ width: "180px" }}
        id="client_phone"
        mask="+999 99 999-99-99"
        placeholder="+994 99 999-99-99"
        value={clientPhone}
        onChange={(e) => setClientPhone(e.target.value || "")}
      />
    );
  };

  const content = (
    <div>
      <div className="ml-2">Nağd: {totalAmount?.cash} AZN</div>
      <div className="ml-2">Kart: {totalAmount?.pos} AZN</div>
      <div className="ml-2">Toplam: {totalAmount?.total} AZN</div>
    </div>
  );

  return (
    <>
      <DataTable
        value={services}
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: "50rem" }}
        style={{ marginBottom: "10px" }}
        filterDisplay={filter ? "row" : undefined}
      >
        <Column field="id" header="Id" style={{ width: "2%" }}></Column>
        <Column
          dataType="date"
          header="Tarix"
          body={dateBodyTemplate}
          style={{ width: "10%" }}
          showFilterMenu={false}
          filter
          filterElement={dateRowFilterTemplate}
        ></Column>
        <Column
          field="client_name"
          header="Müştəri"
          style={{ width: "10%" }}
          filter
          filterElement={clientRowFilterTemplate}
          showFilterMenu={false}
        ></Column>
        {userPermissions.includes("service.variable.select_phone") && (
          <Column
            field="client_phone"
            header="Telefon"
            style={{ width: "10%" }}
            filter
            filterElement={phoneRowFilterTemplate}
            showFilterMenu={false}
          ></Column>
        )}
        <Column
          header="Xidmət"
          style={{ width: "10%" }}
          showFilterMenu={false}
          filter={userPermissions.includes("service.variable.service_type_id")}
          filterElement={serviceTypeRowFilterTemplate}
          body={serviceTypesBody}
        ></Column>
        <Column
          header="Həkim"
          body={getDoctorFullName}
          style={{ width: "10%" }}
          showFilterMenu={false}
          filter={userPermissions.includes("service.variable.user_id")}
          filterElement={doctorsRowFilterTemplate}
        ></Column>
        <Column
          header="Məbləğ"
          body={priceBodyTemplate}
          style={{ width: "10%" }}
        ></Column>
        <Column
          header="Status"
          body={statusBody}
          style={{ width: "10%" }}
          showFilterMenu={false}
          filter
          filterElement={statusRowFilterTemplate}
        ></Column>
        {userPermissions.includes("service.update") && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "2%" }}
          ></Column>
        )}
      </DataTable>
      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={onPageChange}
      />
      <Message
        style={{
          border: "solid #696cff",
          borderWidth: "0 0 0 6px",
          marginTop: "20px",
        }}
        severity="info"
        content={content}
      />
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
