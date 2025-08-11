import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import {
  IAdvanceInfo,
  IAdvanceInfoRs,
  IDoctor,
  IDoctorRS,
  IRole,
  IService,
  IServiceType,
  IServiceTypeRS,
  IServicesData,
  ITimeZone,
  ITotalAmount,
} from '../../types';
import api from '../../api';
import { serviceStatuses } from '../consts';
import CreateUpdateDialog from './CreateUpdateDialog';
import ReportsDialog from './ReportsDialog';
import React from 'react';
import { Calendar } from 'primereact/calendar';
import { formatDate, haveFilterPermissions } from '@/app/utils';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import { Skeleton } from 'primereact/skeleton';
import { InputNumber } from 'primereact/inputnumber';
import { useDebounce } from 'primereact/hooks';
import DeleteServiceDialog from './DeleteServiceDialog';

interface IServicesTableProps {
  userPermissions: string[];
  role: IRole;
}

function ServicesTable({ userPermissions, role }: IServicesTableProps) {
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
  const [serviceDeleteDialog, setServiceDeleteDialog] = useState(false);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [page, setPage] = useState(1);
  const [serviceTypesFilter, setServiceTypesFilter] =
    useState<IServiceType[]>();
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce<
    number | null
  >(null, 400);
  const [rejectComment, setRejectComment] = useState<string>();
  const [first, setFirst] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState<ITotalAmount>();
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const toast = useRef<Toast>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const [advanceTransferModal, setAdvanceTransferModal] = useState(false);
  const [advanceInfo, setAdvanceInfo] = useState<IAdvanceInfo>();
  const [notToday, setNotToday] = useState(false);
  const areDatesEqual =
    dates.length === 2 &&
    new Date(dates[0]).getTime() === new Date(dates[1]).getTime();

  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  const isToday = isSameDay(new Date(dates[0]), new Date());

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  };

  const editService = (newService: IService) => {
    setService(newService);
    setDialog(true);
  };
  const isTodayTest = (dateString: string): boolean => {
    const inputDate = new Date(dateString);
    const today = new Date();

    return (
      inputDate.getFullYear() === today.getFullYear() &&
      inputDate.getMonth() === today.getMonth() &&
      inputDate.getDate() === today.getDate()
    );
  };
  const getServices = async (page: number, isOnPageChange?: boolean) => {
    setIsLoading(true);
    try {
      const { data, meta }: IServicesData = await api.getServices({
        page,
        size: rows,
        status: filteredStatus?.id,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        client_name: debouncedClientName,
        client_phone: debouncedClientPhone,
        service_types: serviceTypesFilter?.map((i) => i.id),
        user_id: doctor?.id,
      });

      setServices(data);
      setTotal(meta?.total);

      if (userPermissions.includes('service.get_all.total_amount')) {
        const { data: advanceInfo }: IAdvanceInfoRs = await api.getAdvanceInfo(
          formatDate(dates[0])
        );

        setAdvanceInfo(advanceInfo);
      }

      if (userPermissions.includes('service.advance.info')) {
        const total: ITotalAmount = await api.getTotalAmount({
          status: filteredStatus?.id,
          from_date: formatDate(dates[0]),
          to_date: formatDate(dates[1]),
          client_name: debouncedClientName,
          client_phone: debouncedClientPhone,
          service_types: serviceTypesFilter?.map((i) => i.id),
          user_id: doctor?.id,
        });

        setTotalAmount(total);
      }
      const timeZone: ITimeZone = await api.getTimeZone();
      setNotToday(!isTodayTest(timeZone.date_time));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      isOnPageChange &&
        navigationRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (dates[1]) {
      getServices(page);
    }
  }, [
    filteredStatus?.name,
    dates[1],
    debouncedClientName,
    debouncedClientPhone,
    serviceTypesFilter?.length,
    doctor,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (userPermissions.includes('user.input_search')) {
        const { data: doctorsData }: IDoctorRS = await api.getDoctors();
        setDoctors(doctorsData);
      }
      if (userPermissions.includes('service_type.input_search')) {
        const { data: servicesData }: IServiceTypeRS =
          await api.getInputServices();
        setServiceTypes(servicesData);
      }
    };
    fetchData();
  }, []);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setFirst(event.first);
    getServices(event.page + 1, true);
    setPage(event.page + 1);
  };

  const onDownloadAllReports = () => {
    api.getAllReportsExcel({
      status: filteredStatus?.id,
      from_date: formatDate(dates[0]),
      to_date: formatDate(dates[1]),
      client_name: debouncedClientName,
      client_phone: debouncedClientPhone,
      service_types: serviceTypesFilter?.map((i) => i.id),
      user_id: doctor?.id,
    });
  };

  const confirmDeleteService = (service: IService) => {
    setService(service);
    setServiceDeleteDialog(true);
  };

  const actionBodyTemplate = (rowData: IService) =>
    isLoading ? (
      <Skeleton width="60px" />
    ) : (
      <React.Fragment>
        {rowData?.status === 0 && role.id === 4 && (
          <Button
            icon="pi pi-pencil"
            rounded
            text
            severity="secondary"
            style={{ marginRight: '10px' }}
            onClick={() => editService(rowData)}
          />
        )}

        {role.id !== 4 && (
          <Button
            icon="pi pi-pencil"
            rounded
            text
            severity="secondary"
            style={{ marginRight: '10px' }}
            onClick={() => editService(rowData)}
          />
        )}

        {userPermissions?.includes('service.delete') && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            text
            severity="danger"
            onClick={() => confirmDeleteService(rowData)}
          />
        )}
      </React.Fragment>
    );

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        {haveFilterPermissions(userPermissions) && (
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Filter"
            onClick={() => setFilter((prev) => !prev)}
            style={{ marginRight: '20px' }}
          />
        )}

        <Button
          icon="pi pi-refresh"
          rounded
          raised
          onClick={() => getServices(page)}
        />
      </div>
      <div>
        {userPermissions.includes('service.all_reports') &&
          !!services.length && (
            <Button
              label="Export"
              icon="pi pi-upload"
              severity="success"
              onClick={onDownloadAllReports}
              style={{ marginRight: '10px' }}
            />
          )}
        {userPermissions.includes('service.daily_report') && (
          <Button
            label="Gün sonu"
            icon="pi pi-file-excel"
            severity="success"
            onClick={() => setReportsDialog(true)}
            style={{ marginRight: '10px' }}
          />
        )}
        {userPermissions.includes('service.create') && (
          <Button
            label="Əlavə et"
            icon="pi pi-plus"
            onClick={() => setDialog(true)}
          />
        )}
      </div>
    </div>
  );

  const dateBodyTemplate = (rowData: IService) =>
    isLoading ? <Skeleton width="100px" /> : rowData.created_at.slice(0, -3);

  const getDoctorFullName = (rowData: IService) =>
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      `${rowData.user?.name} ${rowData.user?.surname}`
    );

  const clientNameBody = (rowData: IService) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>;

  const clientPhoneBody = (rowData: IService) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_phone}</div>;

  const priceBodyTemplate = (rowData: IService) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(
      +rowData?.amount
        ? +rowData?.amount + rowData?.advance_amount
        : +rowData?.services_total
    );
    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return isLoading ? (
      <Skeleton width="100px" />
    ) : (
      `${formattedPrice} ${currencySymbol}`
    );
  };

  const getSeverity = (status?: string) => {
    switch (status) {
      case 'Rejected':
        return 'danger';

      case 'Accepted':
        return 'success';

      case 'New':
        return 'info';
    }
  };

  const statusBody = (rowData: IService) => {
    const status = serviceStatuses.find(
      (status) => status?.id === rowData.status
    )?.name;
    const onRejectClick = () => {
      if (status === 'Rejected') {
        setRejectComment(rowData.reject_comment);
        setRejectDialog(true);
      }
    };
    return isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <Tag
        onClick={onRejectClick}
        icon={status === 'Rejected' && 'pi pi-info-circle'}
        value={status}
        severity={getSeverity(status)}
      />
    );
  };

  const serviceTypesBody = (rowData: IService) =>
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <div>
        {rowData.service_types.map((i) => (
          <div key={i.id}>{i.name}</div>
        ))}
      </div>
    );

  const statusItemTemplate = (option: any) => {
    return <Tag value={option.name} severity={getSeverity(option.name)} />;
  };

  const statusRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.status') && (
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
          style={{ minWidth: '10rem' }}
          optionLabel="name"
        />
      )
    );
  };

  const serviceTypeRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.service_type') && (
        <MultiSelect
          filter
          value={serviceTypesFilter}
          onChange={(e) => {
            setServiceTypesFilter(e.value);
          }}
          options={serviceTypes}
          placeholder="Xidmət seçin"
          optionLabel="name"
          showClear
        />
      )
    );
  };

  const doctorsRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.doctor') && (
        <Dropdown
          filter
          value={doctor}
          onChange={(e) => {
            setDoctor(e.value);
          }}
          options={doctors}
          placeholder="Həkim seçin"
          optionLabel="full_name"
          showClear
        />
      )
    );
  };

  const dateRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.date') && (
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value)}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          style={{ width: '220px' }}
          dateFormat="dd/mm/yy"
        />
      )
    );
  };

  const clientRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.client_name') && (
        <InputText
          placeholder="Ad ilə axtarış"
          style={{ width: '160px' }}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      )
    );
  };

  const phoneRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.client_phone') && (
        <InputNumber
          style={{ width: '180px' }}
          id="client_phone"
          placeholder="+994 99 999-99-99"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.value)}
          prefix="+"
          useGrouping={false}
        />
      )
    );
  };

  const content = (
    <div>
      <div className="ml-2">Depozit: {totalAmount?.advance} AZN</div>
      <div className="ml-2">Xidmətlər: {totalAmount?.amount} AZN</div>
      <div className="ml-2">Toplam: {totalAmount?.total} AZN</div>
    </div>
  );

  const idBodyTemplate = (rowData: IService, options: any) =>
    isLoading ? (
      <Skeleton width="20px" />
    ) : (
      <div>{total - options.rowIndex - first}</div>
    );

  const onAdvanceTransfer = () => {
    api
      .advanceTransfer()
      .then(async () => {
        setAdvanceTransferModal(false);
        const { data: advanceInfo }: IAdvanceInfoRs = await api.getAdvanceInfo(
          formatDate(dates[0])
        );

        setAdvanceInfo(advanceInfo);
        showSuccess('Növbə bağlandı');
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const onAdvanceCancel = () => {
    api
      .advanceCancel(formatDate(dates[0]))
      .then(async () => {
        setAdvanceTransferModal(false);
        const { data: advanceInfo }: IAdvanceInfoRs = await api.getAdvanceInfo(
          formatDate(dates[0])
        );

        setAdvanceInfo(advanceInfo);
        showSuccess('Növbə yenidən açıldı');
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const advanceContent = (
    <div style={{ display: 'flex', gap: '12px' }}>
      <div>
        <div className="ml-2">Növbə bağlanıb</div>
        <div className="ml-2">
          {advanceInfo?.user?.name} {advanceInfo?.user?.surname}
        </div>
        <div className="ml-2">{advanceInfo?.transferred_at}</div>
      </div>
      {userPermissions.includes('reservation.next_day_transfer.cancel') && (
        <Button
          icon="pi pi-undo"
          tooltip="Növbəni yenidən aç"
          onClick={onAdvanceCancel}
          disabled={!isToday}
        />
      )}
    </div>
  );

  if (notToday) {
    return <div>Ağıllısanda😂</div>;
  }

  return (
    <>
      <DataTable
        value={services}
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: '50rem' }}
        style={{ marginBottom: '10px' }}
        filterDisplay={filter ? 'row' : undefined}
      >
        <Column
          body={idBodyTemplate}
          header="#"
          style={{ width: '2%' }}
        ></Column>
        <Column
          dataType="date"
          header="Tarix"
          body={dateBodyTemplate}
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter
          filterElement={dateRowFilterTemplate}
        ></Column>
        <Column
          field="client_name"
          header="Müştəri"
          style={{ width: '10%' }}
          filter
          filterElement={clientRowFilterTemplate}
          showFilterMenu={false}
          body={clientNameBody}
        ></Column>
        {userPermissions.includes('service.variable.select_phone') && (
          <Column
            field="client_phone"
            header="Telefon"
            style={{ width: '10%' }}
            filter
            filterElement={phoneRowFilterTemplate}
            showFilterMenu={false}
            body={clientPhoneBody}
          ></Column>
        )}
        <Column
          header="Xidmət"
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter={userPermissions.includes('service.variable.service_type_id')}
          filterElement={serviceTypeRowFilterTemplate}
          body={serviceTypesBody}
        ></Column>
        <Column
          header="Həkim"
          body={getDoctorFullName}
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter={userPermissions.includes('service.variable.user_id')}
          filterElement={doctorsRowFilterTemplate}
        ></Column>
        <Column
          header="Məbləğ"
          body={priceBodyTemplate}
          style={{ width: '10%' }}
        ></Column>
        <Column
          header="Status"
          body={statusBody}
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter
          filterElement={statusRowFilterTemplate}
        ></Column>
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: '10%' }}
        ></Column>
      </DataTable>
      <div ref={navigationRef}>
        <Paginator
          first={first}
          rows={rows}
          totalRecords={total}
          onPageChange={onPageChange}
        />
      </div>
      {userPermissions.includes('service.get_all.total_amount') && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Message
            style={{
              border: 'solid #696cff',
              borderWidth: '0 0 0 6px',
              marginTop: '20px',
              marginRight: '20px',
            }}
            severity="info"
            content={content}
          />
          {areDatesEqual &&
            !isLoading &&
            (advanceInfo?.id &&
            userPermissions.includes('service.advance.info') ? (
              <Message
                content={advanceContent}
                style={{
                  marginTop: '20px',
                }}
              />
            ) : (
              userPermissions.includes('reservation.next_day_transfer') && (
                <Button
                  onClick={() => setAdvanceTransferModal(true)}
                  disabled={!isToday}
                >
                  Növbəni bağla
                </Button>
              )
            ))}
        </div>
      )}

      <Toast ref={toast} />
      <CreateUpdateDialog
        userPermissions={userPermissions}
        dialog={dialog}
        setDialog={setDialog}
        showSuccess={showSuccess}
        service={service}
        setService={setService}
        getServices={getServices}
        role={role}
        page={page}
      />
      <ReportsDialog dialog={reportsDialog} setDialog={setReportsDialog} />
      <Dialog
        header="Reject comment"
        visible={rejectDialog}
        style={{ width: '50vw' }}
        onHide={() => {
          if (!rejectDialog) return;
          setRejectDialog(false);
          setRejectComment('');
        }}
      >
        <p className="m-0">{rejectComment}</p>
      </Dialog>
      <Dialog
        visible={advanceTransferModal}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header="Növbəni bağla"
        modal
        footer={
          <React.Fragment>
            <Button
              label="Xeyr"
              icon="pi pi-times"
              outlined
              onClick={() => setAdvanceTransferModal(false)}
            />
            <Button
              label="Bəli"
              icon="pi pi-check"
              severity="danger"
              onClick={onAdvanceTransfer}
            />
          </React.Fragment>
        }
        onHide={() => setAdvanceTransferModal(false)}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: '2rem', marginRight: '10px' }}
          />
          <span>Növbənin baölanılmasına əminsiz?</span>
        </div>
      </Dialog>
      <DeleteServiceDialog
        service={service}
        deleteDialog={serviceDeleteDialog}
        setDeleteDialog={setServiceDeleteDialog}
        showSuccess={showSuccess}
        getServices={getServices}
      />
    </>
  );
}

export default ServicesTable;
