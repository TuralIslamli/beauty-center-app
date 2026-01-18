import React, { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { Nullable } from 'primereact/ts-helpers';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/app/api';
import {
  IBooking,
  IBookingFields,
  IDoctor,
  IDoctorRS,
  IHour,
  IHourRS,
  IServiceType,
  IServiceTypeRS,
  IUserRS,
} from '@/app/types';
import { bookingStatuses } from '../consts';
import { formatDate } from '@/app/utils';
import { FormField } from '../shared';

interface CreateUpdateDialogProps {
  visible: boolean;
  onHide: () => void;
  userPermissions: string[];
  onSuccess: (message: string) => void;
  getBookings: () => Promise<void>;
  booking?: IBooking;
  setBooking: Dispatch<SetStateAction<IBooking | undefined>>;
}

type BookingFormFields = IBookingFields & {
  client_first_name: string;
  client_last_name: string;
};

const CreateUpdateDialog: React.FC<CreateUpdateDialogProps> = ({
  visible,
  onHide,
  userPermissions,
  onSuccess,
  getBookings,
  booking,
  setBooking,
}) => {
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<IServiceType[]>();
  const [isAmountClicked, setIsAmountClicked] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor>();
  const [isOutOfTurn, setIsOutOfTurn] = useState(false);
  const [selectedHour, setSelectedHour] = useState<IHour>();
  const [selectedStatus, setSelectedStatus] = useState<{ id: number; name: string }>();
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [hours, setHours] = useState<IHour[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();
  const [date, setDate] = useState<Nullable<Date>>(null);

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  const schema = yup.object().shape({
    service_types:
      selectedStatus?.id === 3
        ? yup.array().of(yup.object().shape({ id: yup.number().required() })).min(1).required()
        : yup.array(),
    client_first_name: yup
      .string()
      .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
      .required('Müştəri adı mütləqdir'),
    client_last_name: yup
      .string()
      .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
      .required('Müştəri soyadı mütləqdir'),
    client_name: yup.string().nullable(),
    client_phone: hasPermission('service.variable.phone')
      ? yup.string().required()
      : yup.string(),
    doctor_id: selectedStatus?.id === 3 ? yup.number().required() : yup.number(),
    hour: yup.string().required(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<BookingFormFields>({
    resolver: yupResolver(schema),
  });

  const splitClientName = useCallback((fullName?: string) => {
    const trimmed = (fullName || '').trim();
    if (!trimmed) {
      return { firstName: '', lastName: '' };
    }
    const [firstName, ...rest] = trimmed.split(/\s+/);
    return { firstName, lastName: rest.join(' ') };
  }, []);

  const handleFormHide = useCallback(() => {
    onHide();
    reset();
    setBooking(undefined);
    setSelectedServiceTypes(undefined);
    setSelectedDoctor(undefined);
    setSelectedStatus(undefined);
    setSelectedHour(undefined);
    setDate(null);
    setDoctors([]);
    setIsOutOfTurn(false);
    setIsAmountClicked(false);
  }, [onHide, reset, setBooking]);

  const onSubmit: SubmitHandler<BookingFormFields> = useCallback(async (payload) => {
    setIsSubmitting(true);
    const advance_amount = payload?.advance_amount || 0;
    const fullName = [payload.client_first_name, payload.client_last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    try {
      const requestData = {
        ...payload,
        advance_amount,
        client_name: fullName,
        doctor_id: payload.doctor_id,
        client_phone: payload.client_phone?.toString().replace(/[\s-]/g, ''),
      };

      if (booking?.id) {
        await api.updateBooking({
          ...requestData,
          id: booking.id,
          reservation_date:
            selectedStatus?.id === 2
              ? `${formatDate(date)} ${selectedHour?.time}`
              : booking?.reservation_date,
          status: payload.status,
        });
      } else {
        await api.createBooking({
          ...requestData,
          reservation_date: `${formatDate(date)} ${selectedHour?.time}`,
        });
      }

      onSuccess('Rezerv uğurla saxlanıldı');
      getBookings();
      handleFormHide();
    } catch (error) {
      console.error('Failed to save booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [booking?.id, booking?.reservation_date, selectedStatus?.id, date, selectedHour?.time, onSuccess, getBookings, handleFormHide]);

  // Load booking data
  useEffect(() => {
    if (booking?.id) {
      const { firstName, lastName } = splitClientName(booking.client_name);
      setValue('client_first_name', firstName);
      setValue('client_last_name', lastName);
      setValue('client_name', booking.client_name);
      setValue('client_phone', booking.client_phone);
      setValue('is_out_of_turn', booking.is_out_of_turn);
      setIsOutOfTurn(booking.is_out_of_turn);

      const [day, month, yearAndTime] = booking.reservation_date.split('-');
      const [year, time] = yearAndTime.split(' ');
      const formattedDateString = `${year}-${month}-${day}T${time}`;
      const bookingDate = new Date(formattedDateString);

      setValue('reservation_date', bookingDate);
      setDate(bookingDate);
      setValue('status', booking.status);
      setValue('advance_amount', booking.advance_amount);
      setSelectedStatus(bookingStatuses.find((status) => status?.id === booking.status));
    }
  }, [booking, setValue, splitClientName]);

  // Fetch doctor for existing booking
  useEffect(() => {
    if (booking?.id && booking?.doctor?.id) {
      const fetchDoctor = async () => {
        const { data: doctor }: IUserRS = await api.getDoctorById(booking.doctor.id);
        setValue('doctor_id', booking.doctor?.id);
        setSelectedDoctor({
          id: doctor.id,
          full_name: `${doctor?.name} ${doctor?.surname}`,
        });
        if (!doctors?.map((i) => i?.id).includes(selectedDoctor?.id || 0)) {
          setDoctors((prev) => [
            ...prev,
            { id: doctor.id, full_name: `${doctor?.name} ${doctor?.surname}` },
          ]);
        }
      };
      fetchDoctor();
    }
  }, [booking?.id, booking?.doctor?.id, selectedHour?.time]);

  // Fetch doctors
  useEffect(() => {
    const fetchData = async () => {
      if (hasPermission('user.input_search') && selectedHour?.time && !doctors?.map((i) => i?.id).includes(selectedDoctor?.id || 0)) {
        const { data }: IDoctorRS = isOutOfTurn
          ? await api.getDoctors()
          : await api.getBookingDoctors(`${formatDate(date)} ${selectedHour?.time}`);
        setDoctors(data);
      } else {
        const { data }: IDoctorRS = await api.getDoctors();
        setDoctors(data);
        if (!doctors?.map((i) => i?.id).includes(selectedDoctor?.id || 0) && selectedDoctor?.id) {
          setDoctors((prev) => [
            ...prev,
            { id: selectedDoctor.id, full_name: selectedDoctor?.full_name },
          ]);
        }
      }
    };
    fetchData();
  }, [selectedHour?.time, isOutOfTurn]);

  // Fetch service types
  useEffect(() => {
    const fetchData = async () => {
      if (hasPermission('service_type.input_search')) {
        const { data }: IServiceTypeRS = await api.getInputServices();
        setServiceTypes(data);
      }
    };
    fetchData();
  }, [hasPermission]);

  // Set service types for existing booking
  useEffect(() => {
    if (serviceTypes?.length && booking?.service_types?.length) {
      const matchedServices = booking.service_types
        .map((selected) => serviceTypes.find((service) => service.id === selected.id))
        .filter(Boolean) as IServiceType[];
      setSelectedServiceTypes(matchedServices);
      setValue('service_types', booking.service_types.map((i) => ({ id: i.id })));
    }
  }, [serviceTypes, booking?.service_types, setValue]);

  // Fetch hours when date changes
  useEffect(() => {
    const fetchData = async () => {
      if (date) {
        const { data: hoursData }: IHourRS = await api.getHours(formatDate(date));
        setHours(hoursData);
        if (booking?.id) {
          setSelectedHour(
            hoursData?.find((hour) => hour.time === booking?.real_reservation_date?.split(' ')[1].slice(0, -3))
          );
          setValue('hour', booking?.real_reservation_date?.split(' ')[1].slice(0, -3));
        }
      }
    };
    fetchData();
  }, [date, booking?.id, booking?.real_reservation_date, setValue]);

  const handleMultiSelectChange = useCallback((e: { value: IServiceType[] }) => {
    const selectedTypes = e.value;
    setSelectedServiceTypes(selectedTypes);
    setValue('service_types', selectedTypes?.map((i) => ({ id: i.id })));
  }, [setValue]);

  const showDateTimeFields = typeof getValues().status === 'undefined' || getValues().status === 2;

  return (
    <Dialog
      visible={visible}
      modal
      onHide={handleFormHide}
      header="Rezerv"
      style={{ maxWidth: '500px', width: '100%' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="dialog-form">
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

        <FormField label="Telefon:" htmlFor="client_phone">
          <Controller
            name="client_phone"
            control={control}
            render={({ field }) => (
              <InputMask
                id="client_phone"
                mask="+999 99 999-99-99"
                placeholder="+994 99 999-99-99"
                invalid={!!errors.client_phone}
                {...field}
              />
            )}
          />
        </FormField>

        <div className="flex justify-between mb-2">
          <label>Həkim:</label>
          <div className="flex align-center gap-2">
            <label>Növbədən kənar:</label>
            <Controller
              name="is_out_of_turn"
              control={control}
              render={() => (
                <Checkbox
                  checked={isOutOfTurn}
                  onChange={(e) => {
                    setIsOutOfTurn((prev) => !prev);
                    setValue('is_out_of_turn', e.target.checked);
                  }}
                />
              )}
            />
          </div>
        </div>

        <Controller
          name="doctor_id"
          control={control}
          render={() => (
            <Dropdown
              disabled={!selectedHour && (selectedStatus?.id === 2 || typeof selectedStatus?.id === 'undefined')}
              filter
              className="mb-3"
              value={selectedDoctor}
              onChange={(e) => {
                setSelectedDoctor(e.value);
                setValue('doctor_id', e.value.id);
              }}
              optionLabel="full_name"
              options={doctors}
              placeholder="Doktor seçin"
              invalid={!!errors.doctor_id}
            />
          )}
        />

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

        {showDateTimeFields && (
          <>
            <label className="mb-2">Tarix və saat:</label>
            <div className="flex align-center gap-2 mb-3">
              <Controller
                name="reservation_date"
                control={control}
                render={() => (
                  <Calendar
                    dateFormat="dd-mm-yy"
                    invalid={!!errors.reservation_date}
                    minDate={new Date()}
                    readOnlyInput
                    value={date}
                    onChange={(e) => {
                      setDate(e.value);
                      setValue('reservation_date', e.value);
                    }}
                  />
                )}
              />
              <Controller
                name="hour"
                control={control}
                rules={{ required: true }}
                render={() => (
                  <Dropdown
                    disabled={!date}
                    value={selectedHour}
                    onChange={(e) => {
                      setSelectedHour(e.value);
                      setValue('hour', e.value.time);
                    }}
                    optionLabel="time"
                    options={hours}
                    optionDisabled={(option) => !option.active}
                    placeholder="Saat seçin"
                    invalid={!selectedHour}
                  />
                )}
              />
              {selectedHour?.remaining_space && (
                <Message
                  severity="info"
                  content={<span style={{ color: 'white' }}>Yer: {selectedHour.remaining_space}</span>}
                />
              )}
            </div>
          </>
        )}

        <div>
          <label>Depozit:</label>
          <Controller
            name="advance_amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                onBlur={field.onBlur}
                ref={field.ref}
                value={field?.value || 0}
                onClick={() => setIsAmountClicked(true)}
                onValueChange={(e) => field.onChange(e)}
                mode="currency"
                currency="AZN"
                locale="de-DE"
                className="mt-2 mb-3 w-full"
                invalid={!isAmountClicked}
              />
            )}
          />
        </div>

        {booking?.id && (
          <div className="flex mb-3 flex-wrap gap-2">
            {bookingStatuses?.map((status) => (
              <div key={status?.id} className="flex align-center">
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
            ))}
          </div>
        )}

        <div className="dialog-footer">
          <Button
            label="Saxla"
            disabled={isSubmitting || !isAmountClicked}
            type="submit"
          />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateUpdateDialog;
