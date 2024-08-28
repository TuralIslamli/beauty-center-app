import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import React, { Dispatch, SetStateAction } from "react";
import api from "@/app/api";
import { IBooking, IService } from "@/app/types";

interface IProps {
  booking?: IBooking;
  deleteDialog: boolean;
  setDeleteDialog: (state: boolean) => void;
  showSuccess: (message: string) => void;
  getBookings: (page: number) => Promise<void>;
}

function DeleteBookingDialoq({
  deleteDialog,
  setDeleteDialog,
  booking,
  showSuccess,
  getBookings,
}: IProps) {
  const onDelete = () => {
    api
      .deleteBooking(booking?.id)
      .then(() => {
        setDeleteDialog(false);
        getBookings(1);
        showSuccess("Rezerv silindi");
      })
      .catch((error) => {
        console.error(error);
      });
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
        onClick={onDelete}
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
        {booking && (
          <span>
            Are you sure you want to delete <b>{booking?.client_name}</b>?
          </span>
        )}
      </div>
    </Dialog>
  );
}

export default DeleteBookingDialoq;
