"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Divider } from "primereact/divider";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";

import api from "./api";
import UsersTable from "./components/users/UsersTable";
import styles from "./page.module.css";
import ServiceTypesTable from "./components/serviceTypes/ServiceTypesTable";
import { getRoleName } from "./utils";
import ServicesTable from "./components/services/ServicesTable";
import { IUser, IUserRS } from "./types";
import { setToastInstance } from "@/lib/axios";

function Page() {
  const [userData, setUserData] = useState<IUser>();
  const router = useRouter();
  const userPermissions = userData?.role.permissions.map((item) => item?.name);
  const onLogOut = () => {
    localStorage.clear();
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data }: IUserRS = await api.getSelfInfo();
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
            style={{ backgroundColor: "#60A5FA" }}
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
        <TabView>
          {userPermissions?.includes("service.get_all") && (
            <TabPanel header="Xidmətlər">
              <ServicesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes("service_type.get_all") && (
            <TabPanel header="Xidmət növləri">
              <ServiceTypesTable userPermissions={userPermissions} />
            </TabPanel>
          )}
          {userPermissions?.includes("user.get_all") && (
            <TabPanel header="İstifadəçilər">
              <UsersTable userPermissions={userPermissions} />
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
