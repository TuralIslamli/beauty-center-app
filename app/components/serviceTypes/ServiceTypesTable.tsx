import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import {
  InputNumber,
  InputNumberValueChangeEvent,
} from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { useDebounce } from 'primereact/hooks';

import api from '../../api';
import { IServiceType, IServiceTypesData } from '@/app/types';
import { formatPrice } from '@/app/utils';
import { TableHeader } from '../shared';
import AddDialog from './AddDialog';
import DeleteServiceTypeDialog from './DeleteDialog';

interface ServiceTypesTableProps {
  userPermissions?: string[];
}

const ServiceTypesTable: React.FC<ServiceTypesTableProps> = ({
  userPermissions = [],
}) => {
  const [serviceType, setServiceType] = useState<IServiceType>();
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>([]);
  const [total, setTotal] = useState(0);
  const [rows] = useState(10);
  const [first, setFirst] = useState(0);
  const [filter, setFilter] = useState(false);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [name, debouncedName, setName] = useDebounce('', 400);

  const toast = useRef<Toast>(null);

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        const { data, meta }: IServiceTypesData = await api.getServiceTypes({
          page,
          size: rows,
          name: debouncedName || undefined,
        });
        setServiceTypes(data);
        setTotal(meta?.total);
      } catch (error) {
        console.error('Failed to fetch service types:', error);
      }
    },
    [rows, debouncedName],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback(
    (event: PaginatorPageChangeEvent) => {
      setFirst(event.first);
      fetchData(event.page + 1);
    },
    [fetchData],
  );

  const handleRowEditComplete = useCallback(
    async ({ newData }: DataTableRowEditCompleteEvent) => {
      const { id, name, price = 0, customer_visible } = newData;

      try {
        await api.updateServiceType({ id, name, price, customer_visible });

        setServiceTypes((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...newData, name, price, id, customer_visible }
              : item,
          ),
        );

        showSuccess('Xidmət növü uğurla yeniləndi');
      } catch (error) {
        console.error('Failed to update service type:', error);
      }
    },
    [showSuccess],
  );

  const handleDeleteClick = useCallback((serviceType: IServiceType) => {
    setServiceType(serviceType);
    setIsDeleteDialogVisible(true);
  }, []);

  const handleFilterToggle = useCallback(() => {
    setFilter((prev) => !prev);
  }, []);

  // Editor Components
  const textEditor = useCallback(
    (options: ColumnEditorOptions) => (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback!(e.target.value)}
      />
    ),
    [],
  );

  const priceEditor = useCallback(
    (options: ColumnEditorOptions) => (
      <InputNumber
        value={options.value}
        onValueChange={(e: InputNumberValueChangeEvent) =>
          options.editorCallback!(e.value)
        }
        mode="currency"
        currency="AZN"
        locale="de-DE"
      />
    ),
    [],
  );

  const visibilityEditor = useCallback(
    (options: ColumnEditorOptions) => (
      <Checkbox
        checked={!!options.value}
        onChange={(e) => options.editorCallback!(e.checked)}
      />
    ),
    [],
  );

  // Body Templates
  const priceBodyTemplate = useCallback(
    (rowData: IServiceType) => formatPrice(rowData.price),
    [],
  );

  const visibilityBodyTemplate = useCallback(
    (rowData: IServiceType) => (
      <Checkbox checked={!!rowData.customer_visible} disabled />
    ),
    [],
  );

  const actionBodyTemplate = useCallback(
    (rowData: IServiceType) => (
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => handleDeleteClick(rowData)}
      />
    ),
    [handleDeleteClick],
  );

  // Filter Templates
  const nameFilterTemplate = useCallback(
    () => (
      <InputText
        placeholder="Ad ilə axtarış"
        className="filter-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    ),
    [name, setName],
  );

  const allowEdit = useCallback(
    (rowData: IServiceType) => rowData?.name !== 'Blue Band',
    [],
  );

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions],
  );

  const headerContent = (
    <TableHeader
      onFilterToggle={handleFilterToggle}
      rightContent={
        hasPermission('service_type.create') && (
          <Button
            label="Əlavə et"
            icon="pi pi-plus"
            onClick={() => setIsAddDialogVisible(true)}
          />
        )
      }
    />
  );

  return (
    <div>
      <div className="table-responsive">
        <DataTable
          value={serviceTypes}
          editMode="row"
          dataKey="id"
          onRowEditComplete={handleRowEditComplete}
          tableStyle={{ minWidth: '60rem' }}
          header={headerContent}
          className="table-container"
          filterDisplay={filter ? 'row' : undefined}
        >
          <Column
            field="name"
            header="Ad"
            editor={textEditor}
            style={{ minWidth: '12rem' }}
            filter
            filterElement={nameFilterTemplate}
            showFilterMenu={false}
          />
          <Column
            field="price"
            header="Qiymət"
            body={priceBodyTemplate}
            editor={priceEditor}
            style={{ minWidth: '8rem' }}
          />
          <Column
            field="customer_visible"
            header="Göstərilmə"
            body={visibilityBodyTemplate}
            editor={visibilityEditor}
            style={{ minWidth: '8rem' }}
          />
          {hasPermission('service_type.update') && (
            <Column
              rowEditor={allowEdit}
              headerStyle={{ minWidth: '4rem' }}
              bodyStyle={{ textAlign: 'center' }}
            />
          )}
          {hasPermission('service_type.delete') && (
            <Column
              body={actionBodyTemplate}
              exportable={false}
              style={{ minWidth: '4rem' }}
            />
          )}
        </DataTable>
      </div>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={handlePageChange}
      />

      <Toast ref={toast} />

      <AddDialog
        visible={isAddDialogVisible}
        onHide={() => setIsAddDialogVisible(false)}
        onSuccess={showSuccess}
        setServiceTypes={setServiceTypes}
      />

      <DeleteServiceTypeDialog
        serviceType={serviceType}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        setServiceTypes={setServiceTypes}
        onSuccess={showSuccess}
      />
    </div>
  );
};

export default ServiceTypesTable;
