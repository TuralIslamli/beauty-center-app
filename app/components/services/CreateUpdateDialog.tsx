import { IServiceFields } from "@/app/types";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { RadioButton, RadioButtonChangeEvent } from "primereact/radiobutton";

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
}

const CreateUpdateDialog = ({ dialog, setDialog }: IDialogProps) => {
  const services = [
    { name: "Service 1", id: 1 },
    { name: "Service 2", id: 2 },
    { name: "Service 3", id: 3 },
  ];
  const doctors = [
    { name: "Doctor 1", id: 1 },
    { name: "Doctor 2", id: 2 },
    { name: "Doctor 3", id: 3 },
  ];

  const paymentTypes = [
    { name: "Cash", id: 0 },
    { name: "Card", key: 1 },
  ];
  const [selectedService, setSelectedService] = useState();
  const [selectedDoctor, setSelectedDoctor] = useState();
  const [selectedPayment, setSelectedPayment] = useState({
    name: "Cash",
    id: 0,
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IServiceFields>();

  const onSubmit: SubmitHandler<IServiceFields> = async ({ client_phone }) => {
    console.log(client_phone, 888);
  };

  const userDataJSON = localStorage.getItem("userData") || "{}";
  const userData = JSON.parse(userDataJSON);

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
        {userData?.role?.id !== 4 && (
          <>
            <label style={{ marginBottom: "5px" }} htmlFor="email">
              Doctor:
            </label>
            <Controller
              name="service_type_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  filter
                  style={{ marginBottom: "10px" }}
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.value);
                  }}
                  options={doctors}
                  optionLabel="name"
                  placeholder="Select a doctor"
                  className="w-full md:w-14rem"
                  invalid={!!errors.service_type_id}
                />
              )}
            />
          </>
        )}
        <label style={{ marginBottom: "5px" }} htmlFor="email">
          Service:
        </label>
        <Controller
          name="service_type_id"
          control={control}
          render={({ field }) => (
            <Dropdown
              filter
              style={{ marginBottom: "10px" }}
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.value);
              }}
              options={services}
              optionLabel="name"
              placeholder="Select a service"
              className="w-full md:w-14rem"
              invalid={!!errors.service_type_id}
            />
          )}
        />
        <label style={{ marginBottom: "5px" }} htmlFor="email">
          Amount:
        </label>
        <Controller
          name="amount"
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
              invalid={!!errors.amount}
            />
          )}
        />
        <div style={{ display: "flex" }}>
          {paymentTypes.map((payment) => {
            return (
              <div key={payment.id}>
                <RadioButton
                  inputId={payment.name}
                  name="category"
                  value={payment}
                  onChange={(e: RadioButtonChangeEvent) =>
                    setSelectedPayment(e.value)
                  }
                  checked={selectedPayment?.id === payment.id}
                />
                <label
                  htmlFor={payment.name}
                  style={{ marginRight: "10px", marginLeft: "4px" }}
                >
                  {payment.name}
                </label>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button label="Save" type="submit" />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateUpdateDialog;
