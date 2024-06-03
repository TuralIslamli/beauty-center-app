import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import React, { Dispatch, SetStateAction } from "react";
import { IUser } from "../../types";
import api from "@/app/api";

interface IDeleteUserProps {
  user?: IUser;
  userDeleteDialog: boolean;
  setUserDeleteDialog: (state: boolean) => void;
  showSuccess: (message: string) => void;
  setUsers: Dispatch<SetStateAction<IUser[]>>;
}

function DeleteUserDialog({
  userDeleteDialog,
  setUserDeleteDialog,
  user,
  showSuccess,
  setUsers,
}: IDeleteUserProps) {
  const deleteUser = () => {
    setUsers((prev) => prev.filter((item) => item.id !== user?.id));
    try {
      api.deleteUser(user?.id);
      setUserDeleteDialog(false);
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
        onClick={() => setUserDeleteDialog(false)}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteUser}
      />
    </React.Fragment>
  );

  return (
    <Dialog
      visible={userDeleteDialog}
      style={{ width: "32rem" }}
      breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      header="Confirm"
      modal
      footer={deleteProductDialogFooter}
      onHide={() => setUserDeleteDialog(false)}
    >
      <div className="confirmation-content">
        <i
          className="pi pi-exclamation-triangle"
          style={{ fontSize: "2rem", marginRight: "10px" }}
        />
        {user && (
          <span>
            Are you sure you want to delete{" "}
            <b>
              {user?.name} {user?.surname}
            </b>
            ?
          </span>
        )}
      </div>
    </Dialog>
  );
}

export default DeleteUserDialog;
