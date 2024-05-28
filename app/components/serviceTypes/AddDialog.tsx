import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import api from "../../api";
import { IServiceTypeFields, IServiceTypeRS, IServiceType } from "@/app/types";
import { Dispatch, SetStateAction } from "react";

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
  showSuccess: (message: string) => void;
  setServicesTypes: Dispatch<SetStateAction<IServiceType[]>>;
}

function AddDialog({
  dialog,
  setDialog,
  showSuccess,
  setServicesTypes,
}: IDialogProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IServiceTypeFields>();

  const onSubmit: SubmitHandler<IServiceTypeFields> = async ({
    name,
    price,
  }: IServiceTypeFields) => {
    price = price || 0;

    try {
      const { data }: IServiceTypeRS = await api.createServiceType({
        name,
        price,
      });
      setServicesTypes((prev: any) => {
        return [...prev, data];
      });
      showSuccess("Service type has been successfully created");
      setDialog(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <Dialog
      visible={dialog}
      style={{ width: "25rem" }}
      header="Service type details"
      modal
      onHide={() => setDialog(false)}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <label style={{ marginBottom: "5px" }} htmlFor="name">
          Name:
        </label>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              style={{ marginBottom: "10px" }}
              id="name"
              invalid={!!errors.name}
              {...field}
            />
          )}
        />
        <label style={{ marginBottom: "5px" }} htmlFor="surname">
          Price:
        </label>
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <InputNumber
              onBlur={field.onBlur}
              ref={field.ref}
              value={field?.value || 0}
              onValueChange={(e) => field.onChange(e)}
              mode="currency"
              currency="AZN"
              locale="de-DE"
              style={{ marginBottom: "10px" }}
              invalid={!!errors.price}
            />
          )}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button label="Save" type="submit" />
        </div>
      </form>
    </Dialog>
  );
}

export default AddDialog;
