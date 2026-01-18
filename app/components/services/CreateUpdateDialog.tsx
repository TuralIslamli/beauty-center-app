import React, { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { MultiSelect } from 'primereact/multiselect';
import { Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form';
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

type ServiceFormFields = Omit<IServiceFields, 'client_name'> & {
  client_name: string;
  client_first_name: string;
  client_last_name: string;
};

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

  const clientNameBase = yup.string().transform((value) => value ?? '').defined();

  const schema = yup.object().shape({
    service_types: yup
      .array()
      .of(yup.object().shape({ id: yup.number().required() }))
      .required(),
    client_first_name: hasPermission('service.variable.client_name')
      ? yup
        .string()
        .transform((value) => value ?? '')
        .defined()
        .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
        .required('Müştəri adı mütləqdir')
      : clientNameBase,
    client_last_name: hasPermission('service.variable.client_name')
      ? yup
        .string()
        .transform((value) => value ?? '')
        .defined()
        .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
        .required('Müştəri soyadı mütləqdir')
      : clientNameBase,
    client_name: clientNameBase,
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
  } = useForm<ServiceFormFields>({
    resolver: yupResolver(schema),
    defaultValues: {
      client_name: '',
      client_first_name: '',
      client_last_name: '',
    },
  });

  const splitClientName = useCallback((fullName?: string) => {
    const trimmed = (fullName || '').trim();
    if (!trimmed) {
      return { firstName: '', lastName: '' };
    }
    const [firstName, ...rest] = trimmed.split(/\s+/);
    return { firstName, lastName: rest.join(' ') };
  }, []);

  const watchedFirstName = useWatch({ control, name: 'client_first_name' });
  const watchedLastName = useWatch({ control, name: 'client_last_name' });

  useEffect(() => {
    const fullName = [watchedFirstName, watchedLastName].filter(Boolean).join(' ').trim();
    setValue('client_name', fullName);
  }, [watchedFirstName, watchedLastName, setValue]);

  const handleFormHide = useCallback(() => {
    onHide();
    reset();
    setService(undefined);
    setSelectedServiceTypes(undefined);
    setSelectedDoctor(undefined);
    setSelectedStatus(undefined);
    setTotalPrice(0);
  }, [onHide, reset, setService]);

  const onSubmit: SubmitHandler<ServiceFormFields> = useCallback(async (payload) => {
    const amount = payload?.amount || 0;
    const fullName = [payload.client_first_name, payload.client_last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    setIsSubmitting(true);
    try {
      const requestData = {
        ...payload,
        amount,
        client_name: fullName,
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
      const { firstName, lastName } = splitClientName(service.client_name);
      setValue('client_first_name', firstName);
      setValue('client_last_name', lastName);
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
  }, [service, setValue, doctors, isDoctor, splitClientName]);

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
          <div className="form-row">
            <FormField label="Müştəri adı:" htmlFor="client_first_name" error={errors.client_first_name?.message}>
              <Controller
                name="client_first_name"
                control={control}
                render={({ field }) => (
                  <InputText id="client_first_name" invalid={!!errors.client_first_name} {...field} />
                )}
              />
            </FormField>
            <FormField label="Müştəri soyadı:" htmlFor="client_last_name" error={errors.client_last_name?.message}>
              <Controller
                name="client_last_name"
                control={control}
                render={({ field }) => (
                  <InputText id="client_last_name" invalid={!!errors.client_last_name} {...field} />
                )}
              />
            </FormField>
          </div>
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
