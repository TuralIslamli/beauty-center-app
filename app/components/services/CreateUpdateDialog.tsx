import { IServiceFields } from "@/app/types";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "primereact/button";

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
}

const CreateUpdateDialog = ({ dialog, setDialog }: IDialogProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IServiceFields>();

  const onSubmit: SubmitHandler<IServiceFields> = async ({ client_phone }) => {
    console.log(client_phone, 888);
  };
  return (
    <Dialog visible={dialog} modal onHide={() => setDialog(false)}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <label style={{ marginBottom: "5px" }} htmlFor="name">
          Client name:
        </label>
        <Controller
          name="client_name"
          control={control}
          //   rules={{ required: true }}
          render={({ field }) => (
            <InputText
              style={{ marginBottom: "10px" }}
              id="name"
              invalid={!!errors.client_name}
              {...field}
            />
          )}
        />
        <label style={{ marginBottom: "5px" }} htmlFor="name">
          Client phone:
        </label>
        <Controller
          name="client_phone"
          control={control}
          rules={{ required: true, minLength: 9 }}
          render={({ field }) => (
            <InputMask
              style={{ marginBottom: "10px" }}
              id="client_phone"
              mask="0999999999"
              invalid={!!errors.client_phone}
              {...field}
            />
          )}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button label="Save" type="submit" />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateUpdateDialog;
