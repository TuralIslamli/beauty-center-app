import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import React, { Dispatch, SetStateAction } from "react";
import { IServiceType } from "../../types";
import api from "@/app/api";

interface IDeleteServiceTypeProps {
  showSuccess: (message: string) => void;
  serviceType?: IServiceType;
  deleteDialog: boolean;
  setDeleteDialog: (state: boolean) => void;
  setServicesTypes: Dispatch<SetStateAction<IServiceType[]>>;
}

function DeleteServiceTypeDialog({
  serviceType,
  deleteDialog,
  setDeleteDialog,
  setServicesTypes,
  showSuccess,
}: IDeleteServiceTypeProps) {
  const deleteServiceType = () => {
    setServicesTypes((prev) =>
      prev.filter((item) => item.id !== serviceType?.id)
    );
    try {
      api.deleteServiceType(serviceType?.id);
      setDeleteDialog(false);
      showSuccess("Service type has been successfully deleted");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProductDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteServiceType}
      />
    </React.Fragment>
  );

  return (
    <Dialog
      visible={deleteDialog}
      style={{ width: "32rem" }}
      breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      header="Confirm"
      modal
      footer={deleteProductDialogFooter}
      onHide={() => setDeleteDialog(false)}
    >
      <div className="confirmation-content">
        <i
          className="pi pi-exclamation-triangle"
          style={{ fontSize: "2rem", marginRight: "10px" }}
        />
        {serviceType && (
          <span>
            Are you sure you want to delete <b>{serviceType.name}</b>?
          </span>
        )}
      </div>
    </Dialog>
  );
}

export default DeleteServiceTypeDialog;
