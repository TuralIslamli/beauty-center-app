"use client";
import React, { useEffect, useState } from "react";
import { Divider } from "primereact/divider";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { useRouter } from "next/navigation";

import UsersTable from "./components/users/UsersTable";
import styles from "./page.module.css";
import ServiceTypesTable from "./components/serviceTypes/ServiceTypesTable";
import { getRoleName } from "./utils";
import ServicesTable from "./components/services/ServicesTable";

function Page() {
  const userDataJSON = localStorage.getItem("userData") || "{}";
  const userData = JSON.parse(userDataJSON);
  const router = useRouter();

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

  return userData.name ? (
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
        <TabPanel header="Services">
            <ServicesTable />
          </TabPanel>
          <TabPanel header="Service types">
            <ServiceTypesTable />
          </TabPanel>
          <TabPanel header="Users">
            <UsersTable />
          </TabPanel>
        </TabView>
      </main>
    </>
  ) : (
    <></>
  );
}

export default Page;
