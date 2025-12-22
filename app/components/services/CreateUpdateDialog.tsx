import React, { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { MultiSelect } from 'primereact/multiselect';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/app/api';
import {
  IDoctor,
  IDoctorRS,
  IRole,
  IService,
  IServiceFields,
  IServiceType,
  IServiceTypeRS,
} from '@/app/types';
import { serviceStatuses } from '../consts';
import { FormField } from '../shared';

interface CreateUpdateDialogProps {
  visible: boolean;
  onHide: () => void;
  userPermissions: string[];
  onSuccess: (message: string) => void;
  getServices: (page: number) => Promise<void>;
  service?: IService;
  setService: Dispatch<SetStateAction<IService | undefined>>;
  role: IRole;
  page: number;
}

const CreateUpdateDialog: React.FC<CreateUpdateDialogProps> = ({
  visible,
  onHide,
  userPermissions,
  onSuccess,
  getServices,
  service,
  setService,
  role,
  page,
}) => {
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<IServiceType[]>();
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor>();
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<{ id: number; name: string }>();
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();

  const isDoctor = role?.id === 4;

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  const schema = yup.object().shape({
    service_types: yup
      .array()
      .of(yup.object().shape({ id: yup.number().required() }))
      .required(),
    client_name: yup
      .string()
      .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
      .required('Müştəri adı mütləqdir'),
    client_phone: hasPermission('service.variable.phone')
      ? yup.string().required()
      : yup.string().nullable(),
    user_id: hasPermission('service.variable.user_id')
      ? yup.number().required()
      : yup.number(),
    reject_comment:
      selectedStatus?.id === 2 && hasPermission('service.variable.reject_comment')
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

  const handleFormHide = useCallback(() => {
    onHide();
    reset();
    setService(undefined);
    setSelectedServiceTypes(undefined);
    setSelectedDoctor(undefined);
    setSelectedStatus(undefined);
    setTotalPrice(0);
  }, [onHide, reset, setService]);

  const onSubmit: SubmitHandler<IServiceFields> = useCallback(async (payload) => {
    const amount = payload?.amount || 0;

    setIsSubmitting(true);
    try {
      const requestData = {
        ...payload,
        amount,
        client_phone: payload.client_phone?.toString().replace(/[\s-]/g, ''),
      };

      service?.id
        ? await api.updateService({ ...requestData, id: service.id })
        : await api.createService(requestData);

      onSuccess('Xidmət uğurla saxlanıldı');
      getServices(page);
      handleFormHide();
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [service?.id, onSuccess, getServices, page, handleFormHide]);

  useEffect(() => {
    if (service?.id) {
      setValue('client_name', service.client_name);
      setValue('client_phone', service.client_phone);
      setValue('user_id', service.user?.id);
      handleMultiSelectChange({ value: service?.service_types });
      setValue('amount', +service.amount);
      setValue('advance_amount', +service.advance_amount);
      setValue('reject_comment', service.reject_comment);
      setValue('comment', service.comment);

      const actualStatus = service.status !== 0
        ? serviceStatuses.find((status) => status?.id === service.status)
        : isDoctor
          ? { id: 0, name: 'New' }
          : { id: 1, name: 'Accepted' };

      setValue('status', actualStatus?.id);
      setSelectedStatus(actualStatus);
      setSelectedDoctor(doctors?.find((doc) => doc.id === service.user?.id));
    }
  }, [service, setValue, doctors, isDoctor]);

  useEffect(() => {
    const fetchData = async () => {
      if (hasPermission('user.input_search')) {
        const { data }: IDoctorRS = await api.getDoctors();
        setDoctors(data);
      }
      if (hasPermission('service_type.input_search')) {
        const { data }: IServiceTypeRS = await api.getInputServices();
        setServiceTypes(data);
      }
    };
    fetchData();
  }, [hasPermission]);

  useEffect(() => {
    if (serviceTypes?.length && service?.service_types?.length) {
      const matchedServices = service.service_types
        .map((selected) => serviceTypes.find((st) => st.id === selected.id))
        .filter(Boolean) as IServiceType[];
      setSelectedServiceTypes(matchedServices);
      setValue('service_types', service.service_types.map((i) => ({ id: i.id })));
    }
  }, [serviceTypes, service?.service_types, setValue]);

  const handleMultiSelectChange = useCallback((e: { value: IServiceType[] }) => {
    const selectedTypes = e.value;
    setSelectedServiceTypes(selectedTypes);
    setValue('service_types', selectedTypes?.map((i) => ({ id: i.id })));

    const newTotalPrice = selectedTypes?.reduce(
      (acc, curr) => acc + +curr.price,
      0
    ) || 0;
    setTotalPrice(newTotalPrice);
    setValue('amount', newTotalPrice - (service?.advance_amount || 0));
  }, [setValue, service?.advance_amount]);

  return (
    <Dialog
      visible={visible}
      modal
      onHide={handleFormHide}
      header="Xidmət"
      style={{ maxWidth: '500px', width: '100%' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="dialog-form">
        {hasPermission('service.variable.client_name') && (
          <FormField label="Müştəri adı:" htmlFor="client_name" error={errors.client_name?.message}>
            <Controller
              name="client_name"
              control={control}
              render={({ field }) => (
                <InputText id="client_name" invalid={!!errors.client_name} {...field} />
              )}
            />
          </FormField>
        )}

        {hasPermission('service.variable.phone') && (
          <FormField label="Telefon:" htmlFor="client_phone">
            <Controller
              name="client_phone"
              control={control}
              rules={{ minLength: 12 }}
              render={({ field }) => (
                <InputMask
                  id="client_phone"
                  mask="+999 99 999-99-99"
                  placeholder="+994 99 999-99-99"
                  invalid={!!errors.client_phone}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </FormField>
        )}

        {hasPermission('service.variable.user_id') && !isDoctor && (
          <FormField label="Həkim:" htmlFor="user_id">
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  filter
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
          </FormField>
        )}

        {hasPermission('service.variable.service_type_id') && (
          <FormField label="Xidmət:" htmlFor="service_types">
            <Controller
              name="service_types"
              control={control}
              render={() => (
                <MultiSelect
                  filter
                  value={selectedServiceTypes}
                  onChange={handleMultiSelectChange}
                  options={serviceTypes}
                  optionLabel="name"
                  placeholder="Xidmət seçin"
                  className="w-full"
                  invalid={!!errors.service_types}
                />
              )}
            />
          </FormField>
        )}

        <div className="form-row">
          <div>
            <label>Toplam:</label>
            <InputNumber
              disabled
              value={totalPrice}
              mode="currency"
              currency="AZN"
              locale="de-DE"
              className="mt-2 mb-3"
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
              className="mt-2 mb-3"
            />
          </div>
        </div>

        <div className="form-row">
          {!isDoctor && (
            <div>
              <label>Alınacaq məbləğ:</label>
              <InputNumber
                disabled
                value={totalPrice - (service?.advance_amount || 0)}
                mode="currency"
                currency="AZN"
                locale="de-DE"
                className="mt-2 mb-3"
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
                  onValueChange={(e) => field.onChange(e)}
                  mode="currency"
                  currency="AZN"
                  locale="de-DE"
                  className="mt-2 mb-3"
                  invalid={!!errors.amount}
                />
              )}
            />
          </div>
        </div>

        {hasPermission('service.variable.reject_comment') && (
          <FormField label="Comment:" htmlFor="comment">
            <Controller
              name="comment"
              control={control}
              render={({ field }) => (
                <InputText id="comment" {...field} value={field.value ?? ''} />
              )}
            />
          </FormField>
        )}

        {hasPermission('service.variable.reject_comment') && selectedStatus?.id === 2 && (
          <FormField label="Reject comment:" htmlFor="reject_comment">
            <Controller
              name="reject_comment"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InputText
                  id="reject_comment"
                  invalid={!!errors.reject_comment}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </FormField>
        )}

        {hasPermission('service.variable.status') && service?.id && !isDoctor && (
          <div className="flex mb-3">
            {serviceStatuses.map((status) =>
              status?.id !== 0 && (
                <div key={status?.id} className="flex align-center mr-3">
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
                  <label htmlFor={status?.name} className="ml-2">{status?.name}</label>
                </div>
              )
            )}
          </div>
        )}

        <div className="dialog-footer">
          <Button label="Saxla" disabled={isSubmitting} type="submit" />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateUpdateDialog;
