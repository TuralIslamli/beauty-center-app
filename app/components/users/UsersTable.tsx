import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Checkbox } from 'primereact/checkbox';

import api from '../../api';
import { IUser, IUserData } from '../../types';
import { daysOfWeek } from '../consts';
import { getRoleName } from '@/app/utils';
import { TableHeader } from '../shared';
import DeleteUserDialog from './DeleteUserDialog';
import EditUserDialog from './EditUserDialog';

interface UsersTableProps {
  userPermissions?: string[];
}

const UsersTable: React.FC<UsersTableProps> = ({ userPermissions = [] }) => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [first, setFirst] = useState(0);
  const [user, setUser] = useState<IUser>({} as IUser);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows] = useState(10);
  const [page, setPage] = useState(1);

  const toast = useRef<Toast>(null);

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const fetchData = useCallback(async (currentPage: number) => {
    try {
      const { data, meta }: IUserData = await api.getUsers({
        page: currentPage,
        size: rows,
      });
      setUsers(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [rows]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const handlePageChange = useCallback((event: PaginatorPageChangeEvent) => {
    fetchData(event.page + 1);
    setPage(event.page + 1);
    setFirst(event.first);
  }, [fetchData]);

  const handleEditUser = useCallback((userData: IUser) => {
    setUser(userData);
    setIsEditDialogVisible(true);
  }, []);

  const handleDeleteClick = useCallback((userData: IUser) => {
    setUser(userData);
    setIsDeleteDialogVisible(true);
  }, []);

  // Body Templates
  const roleBodyTemplate = useCallback((rowData: IUser) => (
    <div>{getRoleName(rowData.role.id)}</div>
  ), []);

  const visibilityBodyTemplate = useCallback((rowData: IUser) => (
    <Checkbox checked={!!rowData.customer_visible} disabled />
  ), []);

  const dayOffBodyTemplate = useCallback((rowData: IUser) => {
    const day = daysOfWeek.find((d) => d.id === rowData.day_off);
    return <div>{day?.name || '-'}</div>;
  }, []);

  const actionBodyTemplate = useCallback((rowData: IUser) => (
    <>
      {hasPermission('user.update') && (
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          className="btn-icon-right"
          onClick={() => handleEditUser(rowData)}
        />
      )}
      {hasPermission('user.delete') && (
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
  ), [hasPermission, handleEditUser, handleDeleteClick]);

  const headerContent = (
    <TableHeader
      rightContent={
        hasPermission('user.create') && (
          <Button
            label="Əlavə et"
            icon="pi pi-plus"
            onClick={() => setIsEditDialogVisible(true)}
          />
        )
      }
    />
  );

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={users}
          editMode="row"
          dataKey="id"
          header={headerContent}
          tableStyle={{ minWidth: '50rem' }}
          className="table-container"
        >
        <Column field="name" header="Ad" style={{ width: '20%' }} />
        <Column field="surname" header="Soyad" style={{ width: '20%' }} />
        <Column field="email" header="Mail" style={{ width: '20%' }} />
        <Column field="role" body={roleBodyTemplate} header="Rol" style={{ width: '15%' }} />
        <Column
          field="customer_visible"
          header="Göstərilmə"
          body={visibilityBodyTemplate}
          style={{ width: '10%' }}
        />
        <Column
          field="day_off"
          header="İstirahət günü"
          body={dayOffBodyTemplate}
          style={{ width: '10%' }}
        />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }} />
        </DataTable>
      </div>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={handlePageChange}
      />

      <Toast ref={toast} />

      <DeleteUserDialog
        user={user}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        setUsers={setUsers}
        onSuccess={showSuccess}
      />

      <EditUserDialog
        user={user}
        setUsers={setUsers}
        visible={isEditDialogVisible}
        onHide={() => {
          setIsEditDialogVisible(false);
          setUser({} as IUser);
        }}
        onSuccess={showSuccess}
      />
    </>
  );
};

export default UsersTable;
