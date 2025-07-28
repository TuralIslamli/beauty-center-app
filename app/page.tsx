'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';

import api from './api';
import UsersTable from './components/users/UsersTable';
import styles from './page.module.css';
import ServiceTypesTable from './components/serviceTypes/ServiceTypesTable';
import { getRoleName } from './utils';
import ServicesTable from './components/services/ServicesTable';
import { IUser, IUserRS } from './types';
import { setToastInstance } from '@/lib/axios';
import BonusesTable from './components/bonuses/BonusesTable';
import BookingTimesTable from './components/reservationTimes/BookingTimesTable';
import BookingTable from './components/bookings/BookingTable';
import LogsTable from './components/logs/LogsTable';
import AdvanceTransfersTable from './components/advanceTransfers/AdvanceTransfersTable';
import ReportsTable from './components/reports/ReportsTable';

function Page() {
  const [userData, setUserData] = useState<IUser>();
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const userPermissions = userData?.role.permissions.map((item) => item?.name);

  const onLogOut = () => {
    localStorage.clear();
    router.push('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data }: IUserRS = await api.getSelfInfo();
        if (data?.role?.id === 5) {
          setActiveIndex(1);
        }
        setUserData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (toast.current) {
      setToastInstance(toast.current);
    }
  });

  return userData?.name ? (
    <>
      <header className={styles.header}>
        <div className={styles.info}>
          <Avatar
            shape="circle"
            label={userData?.name[0]?.toUpperCase()}
            style={{ backgroundColor: '#60A5FA' }}
          />
          <div>
            <div>{`${userData?.name} ${userData?.surname}`}</div>
            <small>{getRoleName(userData?.role?.id)}</small>
          </div>
        </div>
        <Button
          icon="pi pi-sign-out"
          severity="info"
          aria-label="User"
          onClick={onLogOut}
        />
      </header>
      <Divider />
      <main className={styles.main}>
        <TabView activeIndex={activeIndex}>
          {userPermissions?.includes('service.get_all') && (
            <TabPanel header="Xidmətlər">
              <ServicesTable
                userPermissions={userPermissions}
                role={userData?.role}
              />
            </TabPanel>
          )}
          {userPermissions?.includes('reservation.get_all') && (
            <TabPanel header="Rezervlər">
              <BookingTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes('report.get_all') && (
            <TabPanel header="Kassa">
              <ReportsTable
                userPermissions={userPermissions}
                role={userData?.role}
              />
            </TabPanel>
          )}
          {userPermissions?.includes('reservation_time.get_all') && (
            <TabPanel header="Rezerv saatları">
              <BookingTimesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes('advance_transfer.get_all') && (
            <TabPanel header="Növbələr">
              <AdvanceTransfersTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes('service_type.get_all') && (
            <TabPanel header="Xidmət növləri">
              <ServiceTypesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes('user.get_all') && (
            <TabPanel header="İstifadəçilər">
              <UsersTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes('service.bonus_reports') && (
            <TabPanel header="Bonuslar">
              <BonusesTable />
            </TabPanel>
          )}
          {userPermissions?.includes('action_log.get_all') && (
            <TabPanel header="Loglar">
              <LogsTable userPermissions={userPermissions} />
            </TabPanel>
          )}
        </TabView>
      </main>
      <Toast ref={toast} />
    </>
  ) : (
    <></>
  );
}

export default Page;
