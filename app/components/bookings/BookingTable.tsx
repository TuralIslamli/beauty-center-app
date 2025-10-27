import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import {
  IBooking,
  IBookingsData,
  IService,
  IServiceType,
  ITotalAmount,
} from '../../types';
import api from '../../api';
import { bookingStatuses, serviceStatuses } from '../consts';
import CreateUpdateDialog from './CreateUpdateDialog';
import React from 'react';
import { Calendar } from 'primereact/calendar';
import { formatDate, haveFilterPermissions } from '@/app/utils';
import { InputText } from 'primereact/inputtext';
import { Skeleton } from 'primereact/skeleton';
import { InputNumber } from 'primereact/inputnumber';
import { useDebounce } from 'primereact/hooks';
import DeleteBookingDialoq from './DeleteBookingDialoq';

interface IBookingTableProps {
  userPermissions: string[];
}

function BookingTable({ userPermissions }: IBookingTableProps) {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [booking, setBooking] = useState<IBooking>();
  const [dialog, setDialog] = useState(false);
  const [filter, setFilter] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [serviceDeleteDialog, setServiceDeleteDialog] = useState(false);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [serviceTypesFilter, setServiceTypesFilter] =
    useState<IServiceType[]>();
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce<
    number | null
  >(null, 400);
  const [rejectComment, setRejectComment] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const toast = useRef<Toast>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  };

  const editService = (newBooking: IBooking) => {
    setBooking(newBooking);
    setDialog(true);
  };

  const getBookings = async (isOnPageChange?: boolean) => {
    setIsLoading(true);
    try {
      const { data, meta }: IBookingsData = await api.getBookings({
        status: filteredStatus?.id,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        client_name: debouncedClientName,
        client_phone: debouncedClientPhone,
      });

      setBookings(data);
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
      getBookings();
    }
  }, [
    filteredStatus?.name,
    dates[1],
    debouncedClientName,
    debouncedClientPhone,
    serviceTypesFilter?.length,
  ]);

  const confirmDeleteService = (booking: IBooking) => {
    setBooking(booking);
    setServiceDeleteDialog(true);
  };

  const actionBodyTemplate = (rowData: IBooking) =>
    isLoading ? (
      <Skeleton width="60px" />
    ) : (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          style={{ marginRight: '10px' }}
          onClick={() => editService(rowData)}
        />

        {userPermissions?.includes('reservation.delete') && (
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
          onClick={() => getBookings()}
        />
      </div>
      <Button
        label="Əlavə et"
        icon="pi pi-plus"
        onClick={() => setDialog(true)}
      />
    </div>
  );

  const dateBodyTemplate = (rowData: IBooking) =>
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      rowData.reservation_date.slice(0, -3)
    );

  const getDoctorFullName = (rowData: IBooking) =>
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      rowData.doctor?.name &&
      `${rowData.doctor?.name} ${rowData.doctor?.surname}`
    );

  const clientNameBody = (rowData: IBooking) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>;

  const clientPhoneBody = (rowData: IBooking) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_phone}</div>;

  const getSeverity = (status?: string) => {
    switch (status) {
      case 'Ləğv':
        return 'danger';

      case 'Gəldi':
        return 'warning';

      case 'Qəbul edildi':
        return 'success';

      case 'Gözlənilir':
        return 'info';

      case 'Online':
        return 'info';
    }
  };

  const statusBody = (rowData: IBooking) => {
    const status = bookingStatuses.find(
      (status) => status?.id === rowData.status
    )?.name;
    return isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <Tag value={status} severity={getSeverity(status)} />
    );
  };

  const statusItemTemplate = (option: any) => {
    return <Tag value={option.name} severity={getSeverity(option.name)} />;
  };

  const statusRowFilterTemplate = () => {
    return (
      userPermissions.includes('reservation.filter.status') && (
        <Dropdown
          value={filteredStatus}
          options={bookingStatuses}
          onChange={(e: DropdownChangeEvent) => {
            setFilteredStatus(e.value);
          }}
          itemTemplate={statusItemTemplate}
          placeholder="Status"
          className="p-column-filter"
          showClear
          style={{ minWidth: '10rem' }}
          optionLabel="name"
        />
      )
    );
  };

  const dateRowFilterTemplate = () => {
    return (
      userPermissions.includes('reservation.filter.date') && (
        <Calendar
          minDate={
            userPermissions?.includes('reservation.get_past_data')
              ? undefined
              : new Date()
          }
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
      userPermissions.includes('reservation.filter.client_name') && (
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
      userPermissions.includes('reservation.filter.client_phone') && (
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

  const idBodyTemplate = (rowData: IBooking, options: any) =>
    isLoading ? (
      <Skeleton width="20px" />
    ) : (
      <div>
        {!filteredStatus
          ? bookings?.length - options?.rowIndex
          : options?.rowIndex + 1}
      </div>
    );

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

  const priceBodyTemplate = (rowData: IBooking) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(+rowData.advance_amount);
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

  return (
    <>
      <DataTable
        value={bookings}
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: '50rem' }}
        style={{ marginBottom: '10px' }}
        filterDisplay={filter ? 'row' : undefined}
        paginator
        rows={10}
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
        <Column
          field="client_phone"
          header="Telefon"
          style={{ width: '10%' }}
          filter
          filterElement={phoneRowFilterTemplate}
          showFilterMenu={false}
          body={clientPhoneBody}
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
          header="Xidmət"
          style={{ width: '10%' }}
          showFilterMenu={false}
          body={serviceTypesBody}
        ></Column>
        <Column
          header="Həkim"
          body={getDoctorFullName}
          style={{ width: '10%' }}
          showFilterMenu={false}
        ></Column>
        <Column
          header="Depozit"
          body={priceBodyTemplate}
          style={{ width: '10%' }}
        ></Column>
        {userPermissions.includes('reservation.update') && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: '10%' }}
          ></Column>
        )}
      </DataTable>

      <Toast ref={toast} />
      <CreateUpdateDialog
        userPermissions={userPermissions}
        dialog={dialog}
        setDialog={setDialog}
        showSuccess={showSuccess}
        booking={booking}
        setBooking={setBooking}
        getBookings={getBookings}
      />
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
      <DeleteBookingDialoq
        booking={booking}
        deleteDialog={serviceDeleteDialog}
        setDeleteDialog={setServiceDeleteDialog}
        showSuccess={showSuccess}
        getBookings={getBookings}
      />
    </>
  );
}

export default BookingTable;
