'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';

import api from './api';
import { getRoleName } from './utils';
import { IUser, IUserRS } from './types';
import { setToastInstance } from '@/lib/axios';

import UsersTable from './components/users/UsersTable';
import ServiceTypesTable from './components/serviceTypes/ServiceTypesTable';
import ServicesTable from './components/services/ServicesTable';
import BonusesTable from './components/bonuses/BonusesTable';
import BookingTimesTable from './components/reservationTimes/BookingTimesTable';
import BookingTable from './components/bookings/BookingTable';
import LogsTable from './components/logs/LogsTable';
import AdvanceTransfersTable from './components/advanceTransfers/AdvanceTransfersTable';
import ReportsTable from './components/reports/ReportsTable';
import ExpensesTable from './components/Expenses/ExpensesTable';

const STORAGE_KEYS = {
  TOKEN: 'token',
  ACTIVE_TAB: 'activeTabIndex',
} as const;

const RESERVER_ROLE_ID = 5;

function Page() {
  const [userData, setUserData] = useState<IUser>();
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedIndex = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      return savedIndex ? parseInt(savedIndex, 10) : 0;
    }
    return 0;
  });
  
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const userPermissions = useMemo(
    () => userData?.role.permissions.map((item) => item?.name) ?? [],
    [userData?.role.permissions]
  );

  const handleLogout = useCallback(() => {
    localStorage.clear();
    router.push('/login');
  }, [router]);

  const handleTabChange = useCallback((index: number) => {
    setActiveIndex(index);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, index.toString());
  }, []);

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data }: IUserRS = await api.getSelfInfo();
        
        // Для reserver роли устанавливаем вкладку по умолчанию
        if (data?.role?.id === RESERVER_ROLE_ID) {
          const savedIndex = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
          if (!savedIndex) {
            setActiveIndex(1);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, '1');
          }
        }
        
        setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Установка toast instance
  useEffect(() => {
    if (toast.current) {
      setToastInstance(toast.current);
    }
  }, []);

  // Проверка наличия разрешения
  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  if (!userData?.name) {
    return null;
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-info">
          <Avatar
            shape="circle"
            label={userData.name[0]?.toUpperCase()}
            className="avatar-primary"
          />
          <div>
            <div>{`${userData.name} ${userData.surname}`}</div>
            <small>{getRoleName(userData.role?.id)}</small>
          </div>
        </div>
        <Button
          icon="pi pi-sign-out"
          severity="info"
          aria-label="Выход"
          onClick={handleLogout}
        />
      </header>

      <Divider />

      <main className="app-main">
        <TabView
          activeIndex={activeIndex}
          onTabChange={(e) => handleTabChange(e.index)}
        >
          {hasPermission('service.get_all') && (
            <TabPanel header="Xidmətlər">
              <ServicesTable
                userPermissions={userPermissions}
                role={userData.role}
              />
            </TabPanel>
          )}
          
          {hasPermission('reservation.get_all') && (
            <TabPanel header="Rezervlər">
              <BookingTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          
          {hasPermission('report.get_all') && (
            <TabPanel header="Kassa">
              <ReportsTable
                userPermissions={userPermissions}
                role={userData.role}
              />
            </TabPanel>
          )}
          
          {hasPermission('reservation_time.get_all') && (
            <TabPanel header="Rezerv saatları">
              <BookingTimesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          
          {hasPermission('expense.get_all') && (
            <TabPanel header="Xərclər">
              <ExpensesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          
          {hasPermission('advance_transfer.get_all') && (
            <TabPanel header="Növbələr">
              <AdvanceTransfersTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          
          {hasPermission('service_type.get_all') && (
            <TabPanel header="Xidmət növləri">
              <ServiceTypesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          
          {hasPermission('user.get_all') && (
            <TabPanel header="İstifadəçilər">
              <UsersTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          
          {hasPermission('service.bonus_reports') && (
            <TabPanel header="Bonuslar">
              <BonusesTable />
            </TabPanel>
          )}
          
          {hasPermission('action_log.get_all') && (
            <TabPanel header="Loglar">
              <LogsTable userPermissions={userPermissions} />
            </TabPanel>
          )}
        </TabView>
      </main>

      <Toast ref={toast} />
    </>
  );
}

export default Page;
