import {
  IDoctor,
  IDoctorRS,
  IService,
  IServiceFields,
  IServiceRS,
  IServiceType,
  IServiceTypeRS,
  IUser,
} from "@/app/types";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { RadioButton, RadioButtonChangeEvent } from "primereact/radiobutton";
import api from "@/app/api";
import { paymentTypes, serviceStatuses } from "../consts";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
  userPermissions: string[];
  showSuccess: (message: string) => void;
  setServices: Dispatch<SetStateAction<IService[]>>;
  service?: IService;
  setService: Dispatch<SetStateAction<IService | undefined>>;
}

const CreateUpdateDialog = ({
  dialog,
  setDialog,
  userPermissions,
  showSuccess,
  setServices,
  service,
  setService,
}: IDialogProps) => {
  const [selectedServiceType, setSelectedServiceType] =
    useState<IServiceType>();
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor>();
  const [selectedPayment, setSelectedPayment] = useState({
    name: "Cash",
    id: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<{
    id: number;
    name: string;
  }>();
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();

  const schema = yup.object().shape({
    service_type_id: yup.number().required(),
    client_name: yup.string().required(),
    client_phone: userPermissions.includes("service.variable.phone")
      ? yup.string().required()
      : yup.string(),
    amount: userPermissions.includes("service.variable.amount")
      ? yup.number().required()
      : yup.number(),
    payment_type: userPermissions.includes("service.variable.payment_type")
      ? yup.number().required()
      : yup.number(),
    user_id: userPermissions.includes("service.variable.user_id")
      ? yup.number().required()
      : yup.number(),
    reject_comment:
      selectedStatus?.id === 2 &&
      userPermissions.includes("service.variable.reject_comment")
        ? yup.string().required()
        : yup.string().nullable(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<IServiceFields>({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<IServiceFields> = async (
    payload: IServiceFields
  ) => {
    try {
      const { data }: IServiceRS = service?.id
        ? await api.updateService({
            ...payload,
            id: service.id,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ""),
          })
        : await api.createService({
            ...payload,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ""),
          });
      showSuccess(`Service has been successfull created`);
      setServices((prev) => {
        if (service?.id) {
          return prev.map((item) => (item.id === service.id ? data : item));
        } else {
          return [data, ...prev];
        }
      });
      setDialog(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (service?.id) {
      setValue("client_name", service.client_name);
      setValue("client_phone", service.client_phone);
      setValue("user_id", service.user.id);
      setValue("service_type_id", service.service_type?.id);
      setValue("amount", +service.amount);

      setValue("payment_type", service.payment_type || 0);
      setValue("reject_comment", service.reject_comment);
      const actualStatus = () => {
        return service.status !== 0
          ? serviceStatuses.find((status) => status?.id === service.status)
          : {
              id: 1,
              name: "Accepted",
            };
      };
      setValue("status", actualStatus()?.id);
      setSelectedStatus(actualStatus);
      setSelectedDoctor(doctors?.find((doc) => doc.id === service.user.id));
      setSelectedServiceType(
        serviceTypes?.find((ser) => ser.id === service.service_type?.id)
      );
    }
  }, [service, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      if (userPermissions.includes("user.input_search")) {
        const { data: doctorsData }: IDoctorRS = await api.getDoctors();
        setDoctors(doctorsData);
      }
      if (userPermissions.includes("service_type.input_search")) {
        const { data: servicesData }: IServiceTypeRS =
          await api.getInputServices();
        setServiceTypes(servicesData);
      }
    };
    fetchData();
  }, []);

  const onHide = () => {
    setDialog(false);
    reset();
    setService({} as IService);
  };
  return (
    <Dialog
      visible={dialog}
      modal
      onHide={onHide}
      style={{ minWidth: "500px" }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {userPermissions.includes("service.variable.client_name") && (
          <>
            <label style={{ marginBottom: "5px" }} htmlFor="name">
              Müştəri adı:
            </label>
            <Controller
              name="client_name"
              control={control}
              render={({ field }) => (
                <InputText
                  style={{ marginBottom: "10px" }}
                  id="name"
                  invalid={!!errors.client_name}
                  {...field}
                />
              )}
            />
          </>
        )}

        {userPermissions.includes("service.variable.phone") && (
          <>
            <label style={{ marginBottom: "5px" }} htmlFor="name">
              Telefon:
            </label>
            <Controller
              name="client_phone"
              control={control}
              rules={{ minLength: 12 }}
              render={({ field }) => (
                <InputMask
                  style={{ marginBottom: "10px" }}
                  id="client_phone"
                  mask="+999 99 999-99-99"
                  placeholder="+994 99 999-99-99"
                  invalid={!!errors.client_phone}
                  {...field}
                />
              )}
            />
          </>
        )}

        {userPermissions.includes("service.variable.user_id") && (
          <>
            <label style={{ marginBottom: "5px" }} htmlFor="email">
              Həkim:
            </label>
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  filter
                  style={{ marginBottom: "10px" }}
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.value);
                    setValue("user_id", e.value.id);
                  }}
                  optionLabel="full_name"
                  options={doctors}
                  placeholder="Doktor seçin"
                  invalid={!!errors.user_id}
                />
              )}
            />
          </>
        )}
        {userPermissions.includes("service.variable.service_type_id") && (
          <>
            <label style={{ marginBottom: "5px" }} htmlFor="email">
              Xidmət:
            </label>
            <Controller
              name="service_type_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  filter
                  style={{ marginBottom: "10px" }}
                  value={selectedServiceType}
                  onChange={(e) => {
                    setSelectedServiceType(e.value);
                    setValue("service_type_id", e.value.id);
                    setValue("amount", e.value.price);
                  }}
                  options={serviceTypes}
                  optionLabel="name"
                  placeholder="Xidmət seçin"
                  className="w-full md:w-14rem"
                  invalid={!!errors.service_type_id}
                />
              )}
            />
          </>
        )}
        <label style={{ marginBottom: "5px" }} htmlFor="email">
          Məbləğ:
        </label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <InputNumber
              onBlur={field.onBlur}
              disabled={!userPermissions.includes("service.variable.amount")}
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
        {userPermissions.includes("service.variable.reject_comment") &&
          selectedStatus?.id === 2 && (
            <>
              <label style={{ marginBottom: "5px" }} htmlFor="name">
                Reject comment:
              </label>
              <Controller
                name="reject_comment"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InputText
                    style={{ marginBottom: "10px" }}
                    id="name"
                    invalid={!!errors.reject_comment}
                    {...field}
                    value={field.value ?? ""}
                  />
                )}
              />
            </>
          )}

        {userPermissions.includes("service.variable.payment_type") && (
          <div style={{ display: "flex", marginBottom: "10px" }}>
            {paymentTypes.map((payment) => {
              return (
                <div key={payment.id}>
                  <RadioButton
                    inputId={payment?.name}
                    name="payment"
                    value={payment}
                    onChange={(e: RadioButtonChangeEvent) => {
                      setSelectedPayment(e.value);
                      setValue("payment_type", e.value.id);
                    }}
                    checked={selectedPayment?.id === payment.id}
                  />
                  <label
                    htmlFor={payment?.name}
                    style={{ marginRight: "10px", marginLeft: "4px" }}
                  >
                    {payment?.name}
                  </label>
                </div>
              );
            })}
          </div>
        )}
        {userPermissions.includes("service.variable.status") && service?.id && (
          <div style={{ display: "flex", marginBottom: "10px" }}>
            {serviceStatuses.map((status) => {
              return (
                status?.id !== 0 && (
                  <div key={status?.id}>
                    <RadioButton
                      inputId={status?.name}
                      name="status"
                      value={status}
                      onChange={(e: RadioButtonChangeEvent) => {
                        setSelectedStatus(e.value);
                        setValue("status", e.value.id);
                      }}
                      checked={selectedStatus?.id === status?.id}
                    />
                    <label
                      htmlFor={status?.name}
                      style={{ marginRight: "10px", marginLeft: "4px" }}
                    >
                      {status?.name}
                    </label>
                  </div>
                )
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button label="Save" type="submit" />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateUpdateDialog;
