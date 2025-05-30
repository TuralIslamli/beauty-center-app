import {
  IDoctor,
  IDoctorRS,
  IRole,
  IService,
  IServiceFields,
  IServiceType,
  IServiceTypeRS,
} from '@/app/types';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import api from '@/app/api';
import { serviceStatuses } from '../consts';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { MultiSelect } from 'primereact/multiselect';

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
  userPermissions: string[];
  showSuccess: (message: string) => void;
  getServices: (page: number) => Promise<void>;
  service?: IService;
  setService: Dispatch<SetStateAction<IService | undefined>>;
  role: IRole;
  page: number;
}

const CreateUpdateDialog = ({
  dialog,
  setDialog,
  userPermissions,
  showSuccess,
  getServices,
  service,
  setService,
  role,
  page,
}: IDialogProps) => {
  const [selectedServiceTypes, setSelectedServiceTypes] =
    useState<IServiceType[]>();
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor>();
  const [totalprice, setTotalPrice] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<{
    id: number;
    name: string;
  }>();
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [isDisabled, setIsDisabled] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();
  const isDoctor = role?.id === 4;

  const schema = yup.object().shape({
    service_types: yup
      .array()
      .of(
        yup.object().shape({
          id: yup.number().required(),
        })
      )
      .required(),
    client_name: yup
      .string()
      .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
      .required('Müştəri adı mütləqdir'),
    client_phone: userPermissions.includes('service.variable.phone')
      ? yup.string().required()
      : yup.string().nullable(),
    user_id: userPermissions.includes('service.variable.user_id')
      ? yup.number().required()
      : yup.number(),
    reject_comment:
      selectedStatus?.id === 2 &&
      userPermissions.includes('service.variable.reject_comment')
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
    const amount = payload?.amount || 0;

    setIsDisabled(true);
    try {
      service?.id
        ? await api.updateService({
            ...payload,
            id: service.id,
            amount,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ''),
          })
        : await api.createService({
            ...payload,
            amount,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ''),
          });
      showSuccess(`Service has been successfull created`);
      getServices(page);
      setDialog(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDisabled(false);
    }
  };

  useEffect(() => {
    if (service?.id) {
      setValue('client_name', service.client_name);
      setValue('client_phone', service.client_phone);
      setValue('user_id', service.user?.id);
      handleMultiSelectChange({ value: service?.service_types });
      setValue('amount', +service.amount);
      setValue('advance_amount', +service.advance_amount);
      setValue('reject_comment', service.reject_comment);
      const actualStatus = () => {
        return service.status !== 0
          ? serviceStatuses.find((status) => status?.id === service.status)
          : isDoctor
          ? {
              id: 0,
              name: 'New',
            }
          : {
              id: 1,
              name: 'Accepted',
            };
      };
      setValue('status', actualStatus()?.id);
      setSelectedStatus(actualStatus());
      setSelectedDoctor(doctors?.find((doc) => doc.id === service.user?.id));
    }
  }, [service, setValue, doctors]);
  useEffect(() => {
    const fetchData = async () => {
      if (userPermissions.includes('user.input_search')) {
        const { data: doctorsData }: IDoctorRS = await api.getDoctors();
        setDoctors(doctorsData);
      }
      if (userPermissions.includes('service_type.input_search')) {
        const { data: servicesData }: IServiceTypeRS =
          await api.getInputServices();
        setServiceTypes(servicesData);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (serviceTypes?.length && service?.service_types?.length) {
      const matchedServices = service.service_types.map((selected) =>
        serviceTypes.find((service) => service.id === selected.id)
      );
      setSelectedServiceTypes(
        matchedServices.filter(Boolean) as IServiceType[]
      );
      setValue(
        'service_types',
        service.service_types?.map((i) => ({ id: i.id }))
      );
    }
  }, [serviceTypes, service?.service_types]);

  const handleMultiSelectChange = (e: any) => {
    const selectedTypes = e.value;

    setSelectedServiceTypes(selectedTypes);
    setValue(
      'service_types',
      selectedTypes?.map((i: IServiceType) => ({ id: i.id }))
    );
    setTotalPrice(
      selectedTypes.reduce(
        (accumulator: number, currentValue: IServiceType) =>
          accumulator + +currentValue.price,
        0
      )
    );
  };

  const onHide = () => {
    setDialog(false);
    reset();
    setService(undefined);
    setSelectedServiceTypes(undefined);
    setSelectedDoctor(undefined);
    setSelectedStatus(undefined);
    setTotalPrice(0);
  };

  return (
    <Dialog
      visible={dialog}
      modal
      onHide={onHide}
      header="Xidmət"
      style={{
        maxWidth: '500px',
        width: '100%',
      }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {userPermissions.includes('service.variable.client_name') && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="name">
              Müştəri adı:
            </label>
            <Controller
              name="client_name"
              control={control}
              render={({ field }) => (
                <InputText
                  id="name"
                  invalid={!!errors.client_name}
                  {...field}
                />
              )}
            />
            <div style={{ marginBottom: '10px' }}>
              {errors?.client_name?.message}
            </div>
          </>
        )}
        {userPermissions.includes('service.variable.phone') && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="name">
              Telefon:
            </label>
            <Controller
              name="client_phone"
              control={control}
              rules={{ minLength: 12 }}
              render={({ field }) => (
                <InputMask
                  style={{ marginBottom: '10px' }}
                  id="client_phone"
                  mask="+999 99 999-99-99"
                  placeholder="+994 99 999-99-99"
                  invalid={!!errors.client_phone}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </>
        )}
        {userPermissions.includes('service.variable.user_id') && !isDoctor && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="email">
              Həkim:
            </label>
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  filter
                  style={{ marginBottom: '10px' }}
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.value);
                    setValue('user_id', e.value.id);
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
        {userPermissions.includes('service.variable.service_type_id') && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="email">
              Xidmət:
            </label>
            <Controller
              name="service_types"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  style={{ marginBottom: '10px' }}
                  value={selectedServiceTypes}
                  onChange={handleMultiSelectChange}
                  options={serviceTypes}
                  optionLabel="name"
                  placeholder="Xidmət seçin"
                  className="w-full md:w-20rem"
                  invalid={!!errors.service_types}
                />
              )}
            />
          </>
        )}
        <div style={{ display: 'flex', gap: '20px', width: '206px' }}>
          <div>
            <label htmlFor="email">Toplam: </label>
            <InputNumber
              disabled
              value={totalprice}
              mode="currency"
              currency="AZN"
              locale="de-DE"
              style={{ marginBottom: '10px', marginTop: '5px' }}
            />
          </div>
          <div>
            <label>Depozit:</label>
            <InputNumber
              disabled
              value={service?.advance_amount || 0}
              mode="currency"
              currency="AZN"
              locale="de-DE"
              style={{ marginBottom: '10px', marginTop: '5px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', width: '206px' }}>
          {!isDoctor && (
            <div>
              <label>Alınacaq məbləğ:</label>
              <InputNumber
                disabled
                value={totalprice - (service?.advance_amount || 0)}
                mode="currency"
                currency="AZN"
                locale="de-DE"
                style={{ marginBottom: '10px', marginTop: '5px' }}
              />
            </div>
          )}
          <div>
            <label>{isDoctor ? 'Alınacaq' : 'Alındı'}:</label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  onBlur={field.onBlur}
                  ref={field.ref}
                  value={field?.value || 0}
                  onValueChange={(e) => {
                    field.onChange(e);
                  }}
                  mode="currency"
                  currency="AZN"
                  locale="de-DE"
                  style={{ marginBottom: '10px', marginTop: '5px' }}
                  invalid={!!errors.amount}
                />
              )}
            />
          </div>
        </div>

        {userPermissions.includes('service.variable.reject_comment') &&
          selectedStatus?.id === 2 && (
            <>
              <label style={{ marginBottom: '5px' }} htmlFor="name">
                Reject comment:
              </label>
              <Controller
                name="reject_comment"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InputText
                    style={{ marginBottom: '10px' }}
                    id="name"
                    invalid={!!errors.reject_comment}
                    {...field}
                    value={field.value ?? ''}
                  />
                )}
              />
            </>
          )}
        {userPermissions.includes('service.variable.status') &&
          service?.id &&
          !isDoctor && (
            <div style={{ display: 'flex', marginBottom: '10px' }}>
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
                          setValue('status', e.value.id);
                        }}
                        checked={selectedStatus?.id === status?.id}
                      />
                      <label
                        htmlFor={status?.name}
                        style={{ marginRight: '10px', marginLeft: '4px' }}
                      >
                        {status?.name}
                      </label>
                    </div>
                  )
                );
              })}
            </div>
          )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button label="Save" disabled={isDisabled} type="submit" />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateUpdateDialog;
