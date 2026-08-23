import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import { Skeleton } from 'primereact/skeleton';
import { useDebounce } from 'primereact/hooks';

import api from '../../api';
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
import { serviceStatuses, PERFORMER_ROLE_IDS } from '../consts';
import {
  formatDate,
  formatPrice,
  formatPhone,
  haveFilterPermissions,
  isToday,
  isSameDay,
  isTodayString,
  useHasPermission,
} from '@/app/utils';
import {
  FilterDateCalendar,
  TableHeader,
  ConfirmDialog,
  useSelectedFirstOptions,
} from '../shared';
import CreateUpdateDialog from './CreateUpdateDialog';
import ReportsDialog from './ReportsDialog';
import DeleteServiceDialog from './DeleteServiceDialog';

interface ServicesTableProps {
  userPermissions: string[];
  role: IRole;
}

const ServicesTable: React.FC<ServicesTableProps> = ({
  userPermissions,
  role,
}) => {
  // State
  const [services, setServices] = useState<IService[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [service, setService] = useState<IService>();
  const [doctor, setDoctor] = useState<IDoctor>();
  const [serviceTypesFilter, setServiceTypesFilter] =
    useState<IServiceType[]>();

  // Dialogs
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [isReportsDialogVisible, setIsReportsDialogVisible] = useState(false);
  const [isRejectDialogVisible, setIsRejectDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isAdvanceTransferDialogVisible, setIsAdvanceTransferDialogVisible] =
    useState(false);

  // Filters
  const [filter, setFilter] = useState(false);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce<
    number | null
  >(null, 400);
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);

  // Pagination
  const [page, setPage] = useState(1);
  const [first, setFirst] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows] = useState(10);

  // Other
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState<ITotalAmount>();
  const [advanceInfo, setAdvanceInfo] = useState<IAdvanceInfo>();
  const [notToday, setNotToday] = useState(false);
  const [rejectComment, setRejectComment] = useState<string>();

  const toast = useRef<Toast>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const isPerformer = PERFORMER_ROLE_IDS.includes(role?.id);
  const areDatesEqual =
    dates.length === 2 &&
    !!dates[0] &&
    !!dates[1] &&
    isSameDay(new Date(dates[0]), new Date(dates[1]));
  const isTodayDate = dates[0] ? isToday(new Date(dates[0])) : false;

  const hasPermission = useHasPermission(userPermissions);

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const getServices = useCallback(
    async (currentPage: number, isOnPageChange = false) => {
      setIsLoading(true);
      try {
        const fromDate = dates[0] ? formatDate(dates[0]) : undefined;
        const toDate = dates[1] ? formatDate(dates[1]) : fromDate;

        const { data, meta }: IServicesData = await api.getServices({
          page: currentPage,
          size: rows,
          status: filteredStatus?.id,
          from_date: fromDate,
          to_date: toDate,
          client_name: debouncedClientName,
          client_phone: debouncedClientPhone,
          service_types: serviceTypesFilter?.map((i) => i.id),
          user_id: doctor?.id,
        });

        setServices(data);
        setTotal(meta?.total);

        if (hasPermission('service.get_all.total_amount') && fromDate) {
          const { data: advanceInfoData }: IAdvanceInfoRs =
            await api.getAdvanceInfo(fromDate);
          setAdvanceInfo(advanceInfoData);
        } else {
          setAdvanceInfo(undefined);
        }

        if (hasPermission('service.advance.info')) {
          const totalData: ITotalAmount = await api.getTotalAmount({
            status: filteredStatus?.id,
            from_date: fromDate,
            to_date: toDate,
            client_name: debouncedClientName,
            client_phone: debouncedClientPhone,
            service_types: serviceTypesFilter?.map((i) => i.id),
            user_id: doctor?.id,
          });
          setTotalAmount(totalData);
        }

        const timeZone: ITimeZone = await api.getTimeZone();
        setNotToday(!isTodayString(timeZone.date_time));
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setIsLoading(false);
        if (isOnPageChange) {
          navigationRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    [
      rows,
      filteredStatus?.id,
      dates,
      debouncedClientName,
      debouncedClientPhone,
      serviceTypesFilter,
      doctor?.id,
      hasPermission,
    ],
  );

  useEffect(() => {
    if (dates[0] && !dates[1]) return;

    getServices(page);
  }, [
    filteredStatus?.name,
    dates,
    debouncedClientName,
    debouncedClientPhone,
    serviceTypesFilter?.length,
    doctor,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (hasPermission('user.input_search')) {
        const { data }: IDoctorRS = await api.getDoctors();
        setDoctors(data);
      }
      if (hasPermission('service_type.input_search')) {
        const { data }: IServiceTypeRS = await api.getInputServices();
        setServiceTypes(data);
      }
    };
    fetchData();
  }, [hasPermission]);

  const handlePageChange = useCallback(
    (event: PaginatorPageChangeEvent) => {
      setFirst(event.first);
      getServices(event.page + 1, true);
      setPage(event.page + 1);
    },
    [getServices],
  );

  const handleEditService = useCallback((serviceData: IService) => {
    setService(serviceData);
    setIsCreateDialogVisible(true);
  }, []);

  const handleDeleteClick = useCallback((serviceData: IService) => {
    setService(serviceData);
    setIsDeleteDialogVisible(true);
  }, []);

  const handleExportAll = useCallback(() => {
    const fromDate = dates[0] ? formatDate(dates[0]) : undefined;
    const toDate = dates[1] ? formatDate(dates[1]) : fromDate;

    api.getAllReportsExcel({
      status: filteredStatus?.id,
      from_date: fromDate,
      to_date: toDate,
      client_name: debouncedClientName,
      client_phone: debouncedClientPhone,
      service_types: serviceTypesFilter?.map((i) => i.id),
      user_id: doctor?.id,
    });
  }, [
    filteredStatus?.id,
    dates,
    debouncedClientName,
    debouncedClientPhone,
    serviceTypesFilter,
    doctor?.id,
  ]);

  const handleAdvanceTransfer = useCallback(async () => {
    const fromDate = dates[0] ? formatDate(dates[0]) : undefined;
    if (!fromDate) return;

    try {
      await api.advanceTransfer();
      setIsAdvanceTransferDialogVisible(false);
      const { data }: IAdvanceInfoRs = await api.getAdvanceInfo(fromDate);
      setAdvanceInfo(data);
      showSuccess('Növbə bağlandı');
    } catch (error) {
      console.error('Failed to transfer advance:', error);
    }
  }, [dates, showSuccess]);

  const handleAdvanceCancel = useCallback(async () => {
    const fromDate = dates[0] ? formatDate(dates[0]) : undefined;
    if (!fromDate) return;

    try {
      await api.advanceCancel(fromDate);
      const { data }: IAdvanceInfoRs = await api.getAdvanceInfo(fromDate);
      setAdvanceInfo(data);
      showSuccess('Növbə yenidən açıldı');
    } catch (error) {
      console.error('Failed to cancel advance:', error);
    }
  }, [dates, showSuccess]);

  // Body Templates
  const idBodyTemplate = useCallback(
    (rowData: IService, options: { rowIndex: number }) =>
      isLoading ? (
        <Skeleton width="20px" />
      ) : (
        <div>{total - options.rowIndex - first}</div>
      ),
    [isLoading, total, first],
  );

  const dateBodyTemplate = useCallback(
    (rowData: IService) =>
      isLoading ? <Skeleton width="100px" /> : rowData.created_at.slice(0, -3),
    [isLoading],
  );

  const clientNameBodyTemplate = useCallback(
    (rowData: IService) =>
      isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>,
    [isLoading],
  );

  const clientPhoneBodyTemplate = useCallback(
    (rowData: IService) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>{formatPhone(rowData.client_phone)}</div>
      ),
    [isLoading],
  );

  const doctorBodyTemplate = useCallback(
    (rowData: IService) =>
      isLoading ? (
        <Skeleton width="150px" />
      ) : (
        `${rowData.user?.name} ${rowData.user?.surname}`
      ),
    [isLoading],
  );

  const priceBodyTemplate = useCallback(
    (rowData: IService) => {
      const amount = +rowData?.amount
        ? +rowData.amount + rowData.advance_amount
        : +rowData.services_total;
      return isLoading ? <Skeleton width="100px" /> : formatPrice(amount);
    },
    [isLoading],
  );

  const serviceTypesBodyTemplate = useCallback(
    (rowData: IService) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>
          {rowData.service_types.map((i) => (
            <div key={i.id}>{i.name}</div>
          ))}
        </div>
      ),
    [isLoading],
  );

  const getSeverity = useCallback((status?: string) => {
    switch (status) {
      case 'Rejected':
        return 'danger';
      case 'Accepted':
        return 'success';
      case 'New':
        return 'info';
      default:
        return undefined;
    }
  }, []);

  const statusBodyTemplate = useCallback(
    (rowData: IService) => {
      const status = serviceStatuses.find(
        (s) => s?.id === rowData.status,
      )?.name;

      const handleClick = () => {
        if (status === 'Rejected') {
          setRejectComment(rowData.reject_comment);
          setIsRejectDialogVisible(true);
        }
      };

      return isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <Tag
          onClick={handleClick}
          icon={status === 'Rejected' ? 'pi pi-info-circle' : undefined}
          value={status}
          severity={getSeverity(status)}
          className="status-badge"
        />
      );
    },
    [isLoading, getSeverity],
  );

  const actionBodyTemplate = useCallback(
    (rowData: IService) =>
      isLoading ? (
        <Skeleton width="60px" />
      ) : (
        <>
          {((rowData?.status === 0 && isPerformer) || !isPerformer) && (
            <Button
              icon="pi pi-pencil"
              rounded
              text
              severity="secondary"
              className="btn-icon-right"
              onClick={() => handleEditService(rowData)}
            />
          )}
          {hasPermission('service.delete') && (
            <Button
              icon="pi pi-trash"
              rounded
              outlined
              text
              severity="danger"
              onClick={() => handleDeleteClick(rowData)}
            />
          )}
        </>
      ),
    [isLoading, isPerformer, hasPermission, handleEditService, handleDeleteClick],
  );

  // Filter Templates
  const statusFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.status') ? (
        <Dropdown
          value={filteredStatus}
          options={serviceStatuses}
          onChange={(e: DropdownChangeEvent) => setFilteredStatus(e.value)}
          itemTemplate={(option) => (
            <Tag value={option.name} severity={getSeverity(option.name)} />
          )}
          placeholder="Status"
          className="p-column-filter"
          showClear
          style={{ minWidth: '10rem' }}
          optionLabel="name"
        />
      ) : null,
    [hasPermission, filteredStatus, getSeverity],
  );

  const dateFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.date') ? (
        <FilterDateCalendar
          value={dates}
          onChange={(e) => {
            setDates((e.value as Date[]) ?? []);
            setPage(1);
            setFirst(0);
          }}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          dateFormat="dd/mm/yy"
        />
      ) : null,
    [hasPermission, dates],
  );

  const clientNameFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.client_name') ? (
        <InputText
          placeholder="Ad ilə axtarış"
          className="filter-input"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      ) : null,
    [hasPermission, clientName, setClientName],
  );

  const clientPhoneFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.client_phone') ? (
        <InputNumber
          className="input-phone-filter"
          id="client_phone"
          placeholder="+994 99 999-99-99"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.value)}
          prefix="+"
          useGrouping={false}
        />
      ) : null,
    [hasPermission, clientPhone, setClientPhone],
  );

  const serviceTypeOptions = useSelectedFirstOptions(
    serviceTypes,
    serviceTypesFilter,
  );

  const serviceTypeFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.service_type') ? (
        <MultiSelect
          filter
          value={serviceTypesFilter}
          onChange={(e) => setServiceTypesFilter(e.value)}
          {...serviceTypeOptions}
          placeholder="Xidmət seçin"
          optionLabel="name"
          showClear
        />
      ) : null,
    [hasPermission, serviceTypesFilter, serviceTypeOptions],
  );

  const doctorFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.doctor') ? (
        <Dropdown
          filter
          value={doctor}
          onChange={(e) => setDoctor(e.value)}
          options={doctors}
          placeholder="Həkim seçin"
          optionLabel="full_name"
          showClear
        />
      ) : null,
    [hasPermission, doctor, doctors],
  );

  const totalContent = useMemo(
    () => (
      <div className="total-info-content">
        <div className="ml-2">Depozit: {totalAmount?.advance} AZN</div>
        <div className="ml-2">Xidmətlər: {totalAmount?.amount} AZN</div>
        <div className="ml-2">Toplam: {totalAmount?.total} AZN</div>
      </div>
    ),
    [totalAmount],
  );

  const advanceContent = useMemo(
    () => (
      <div className="flex gap-3">
        <div>
          <div className="ml-2">Növbə bağlanıb</div>
          <div className="ml-2">
            {advanceInfo?.user?.name} {advanceInfo?.user?.surname}
          </div>
          <div className="ml-2">{advanceInfo?.transferred_at}</div>
        </div>
        {hasPermission('reservation.next_day_transfer.cancel') && (
          <Button
            icon="pi pi-undo"
            tooltip="Növbəni yenidən aç"
            onClick={handleAdvanceCancel}
            disabled={!isTodayDate}
          />
        )}
      </div>
    ),
    [advanceInfo, hasPermission, handleAdvanceCancel, isTodayDate],
  );

  const headerContent = useMemo(
    () => (
      <TableHeader
        onFilterToggle={
          haveFilterPermissions(userPermissions)
            ? () => setFilter((prev) => !prev)
            : undefined
        }
        onRefresh={() => getServices(page)}
        rightContent={
          <>
            {hasPermission('service.all_reports') && !!services.length && (
              <Button
                label="Export"
                icon="pi pi-upload"
                severity="success"
                onClick={handleExportAll}
              />
            )}
            {hasPermission('service.daily_report') && (
              <Button
                label="Gün sonu"
                icon="pi pi-file-excel"
                severity="success"
                onClick={() => setIsReportsDialogVisible(true)}
              />
            )}
            {hasPermission('service.create') && (
              <Button
                label="Əlavə et"
                icon="pi pi-plus"
                onClick={() => setIsCreateDialogVisible(true)}
              />
            )}
          </>
        }
      />
    ),
    [
      userPermissions,
      page,
      services.length,
      hasPermission,
      handleExportAll,
      getServices,
    ],
  );

  if (notToday) {
    return <div>Ağıllısanda😂</div>;
  }

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={services}
          dataKey="id"
          header={headerContent}
          tableStyle={{ minWidth: '60rem' }}
          className="table-container"
          filterDisplay={filter ? 'row' : undefined}
        >
          <Column
            body={idBodyTemplate}
            header="#"
            style={{ width: '3rem', minWidth: '3rem' }}
          />
          <Column
            dataType="date"
            header="Tarix"
            body={dateBodyTemplate}
            style={{ minWidth: '14rem' }}
            showFilterMenu={false}
            filter
            filterElement={dateFilterTemplate}
          />
          <Column
            field="client_name"
            header="Müştəri"
            style={{ minWidth: '12rem' }}
            filter
            filterElement={clientNameFilterTemplate}
            showFilterMenu={false}
            body={clientNameBodyTemplate}
          />
          {hasPermission('service.variable.select_phone') && (
            <Column
              field="client_phone"
              header="Telefon"
              style={{ minWidth: '12rem' }}
              filter
              filterElement={clientPhoneFilterTemplate}
              showFilterMenu={false}
              body={clientPhoneBodyTemplate}
            />
          )}
          <Column
            header="Xidmət"
            style={{ minWidth: '14rem' }}
            showFilterMenu={false}
            filter={hasPermission('service.variable.service_type_id')}
            filterElement={serviceTypeFilterTemplate}
            body={serviceTypesBodyTemplate}
          />
          <Column
            header="Həkim"
            body={doctorBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter={hasPermission('service.variable.user_id')}
            filterElement={doctorFilterTemplate}
          />
          <Column
            header="Məbləğ"
            body={priceBodyTemplate}
            style={{ minWidth: '8rem' }}
          />
          <Column
            header="Status"
            body={statusBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={statusFilterTemplate}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: '8rem' }}
          />
        </DataTable>
      </div>

      <div ref={navigationRef}>
        <Paginator
          first={first}
          rows={rows}
          totalRecords={total}
          onPageChange={handlePageChange}
        />
      </div>

      {hasPermission('service.get_all.total_amount') && (
        <div className="total-info">
          <Message
            className="info-message mr-5"
            severity="info"
            content={totalContent}
          />
          {areDatesEqual &&
            !isLoading &&
            (advanceInfo?.id && hasPermission('service.advance.info') ? (
              <Message content={advanceContent} />
            ) : (
              hasPermission('reservation.next_day_transfer') && (
                <Button
                  onClick={() => setIsAdvanceTransferDialogVisible(true)}
                  disabled={!isTodayDate}
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
        visible={isCreateDialogVisible}
        onHide={() => {
          setIsCreateDialogVisible(false);
          setService(undefined);
        }}
        onSuccess={showSuccess}
        service={service}
        setService={setService}
        getServices={getServices}
        role={role}
        page={page}
      />

      <ReportsDialog
        visible={isReportsDialogVisible}
        onHide={() => setIsReportsDialogVisible(false)}
      />

      <Dialog
        header="Reject comment"
        visible={isRejectDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => {
          setIsRejectDialogVisible(false);
          setRejectComment('');
        }}
      >
        <p className="m-0">{rejectComment}</p>
      </Dialog>

      <ConfirmDialog
        visible={isAdvanceTransferDialogVisible}
        onHide={() => setIsAdvanceTransferDialogVisible(false)}
        onConfirm={handleAdvanceTransfer}
        header="Növbəni bağla"
        message="Növbənin bağlanılmasına əminsiniz?"
      />

      <DeleteServiceDialog
        service={service}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        onSuccess={showSuccess}
        getServices={getServices}
        currentPage={page}
        currentCount={services.length}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          setFirst((nextPage - 1) * rows);
        }}
      />
    </>
  );
};

export default ServicesTable;
