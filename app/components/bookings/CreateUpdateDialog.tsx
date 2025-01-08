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
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import api from '@/app/api';
import { bookingStatuses } from '../consts';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';
import { formatDate } from '@/app/utils';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Checkbox } from 'primereact/checkbox';

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
  userPermissions: string[];
  showSuccess: (message: string) => void;
  getBookings: () => Promise<void>;
  booking?: IBooking;
  setBooking: Dispatch<SetStateAction<IBooking | undefined>>;
}

const CreateUpdateDialog = ({
  dialog,
  setDialog,
  userPermissions,
  showSuccess,
  getBookings,
  booking,
  setBooking,
}: IDialogProps) => {
  const [selectedServiceTypes, setSelectedServiceTypes] =
    useState<IServiceType[]>();
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor>();
  const [isOutOfTurn, setIsOutOfTurn] = useState<boolean>(false);

  const [selectedHour, setSelectedHour] = useState<IHour>();
  const [selectedStatus, setSelectedStatus] = useState<{
    id: number;
    name: string;
  }>();
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [hours, setHours] = useState<IHour[]>();
  const [isDisabled, setIsDisabled] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();
  const [date, setDate] = useState<Nullable<Date>>(null);

  const schema = yup.object().shape({
    service_types:
      selectedStatus?.id === 3
        ? yup
            .array()
            .of(
              yup.object().shape({
                id: yup.number().required(),
              })
            )
            .min(1)
            .required()
        : yup.array(),
    client_name: yup
      .string()
      .matches(/^[A-Za-z ]+$/, 'Yalnız ingilis şrifti')
      .required('Müştəri adı mütləqdir'),
    client_phone: userPermissions.includes('service.variable.phone')
      ? yup.string().required()
      : yup.string(),
    doctor_id:
      selectedStatus?.id === 3 ? yup.number().required() : yup.number(),
    hour: yup.string().required(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<IBookingFields>({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<IBookingFields> = async (
    payload: IBookingFields
  ) => {
    setIsDisabled(true);
    try {
      booking?.id
        ? await api.updateBooking({
            ...payload,
            client_name: payload.client_name,
            doctor_id: payload.doctor_id,

            id: booking.id,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ''),
            reservation_date:
              selectedStatus?.id === 2
                ? `${formatDate(date)} ${selectedHour?.time}`
                : booking?.reservation_date,
            status: payload.status,
          })
        : await api.createBooking({
            ...payload,
            client_name: payload.client_name,
            doctor_id: payload.doctor_id,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ''),
            reservation_date: `${formatDate(date)} ${selectedHour?.time}`,
          });
      showSuccess(`Reserve has been successfull created`);
      getBookings();
      setDialog(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDisabled(false);
    }
  };

  useEffect(() => {
    if (booking?.id) {
      setValue('client_name', booking.client_name);
      setValue('client_phone', booking.client_phone);
      setValue('is_out_of_turn', booking.is_out_of_turn);
      setIsOutOfTurn(booking.is_out_of_turn);
      const [day, month, yearAndTime] = booking.reservation_date.split('-');
      const [year, time] = yearAndTime.split(' ');
      const formattedDateString = `${year}-${month}-${day}T${time}`;
      const date = new Date(formattedDateString);
      setValue('reservation_date', date);
      setDate(date);
      setValue('status', booking.status);
      setSelectedStatus(
        bookingStatuses.find((status) => status?.id === booking.status)
      );
    }
  }, [booking, setValue]);

  useEffect(() => {
    if (booking?.id && booking?.doctor?.id) {
      const fetchDoctor = async () => {
        const { data: doctor }: IUserRS = await api.getDoctorById(
          booking!.doctor?.id
        );
        setValue('doctor_id', booking.doctor?.id);
        setSelectedDoctor({
          id: doctor.id,
          full_name: `${doctor?.name} ${doctor?.surname}`,
        });
        if (!doctors?.map((i) => i?.id).includes(selectedDoctor?.id || 0)) {
          setDoctors((prev) => [
            ...prev,
            {
              id: doctor.id,
              full_name: `${doctor?.name} ${doctor?.surname}`,
            },
          ]);
        }
      };
      fetchDoctor();
    }
  }, [booking?.id, selectedHour?.time]);

  useEffect(() => {
    const fetchData = async () => {
      if (
        userPermissions.includes('user.input_search') &&
        selectedHour?.time &&
        !doctors?.map((i) => i?.id).includes(selectedDoctor?.id || 0)
      ) {
        const { data: doctorsData }: IDoctorRS = isOutOfTurn
          ? await api.getDoctors()
          : await api.getBookingDoctors(
              `${formatDate(date)} ${selectedHour?.time}`
            );
        setDoctors(doctorsData);
      } else {
        const { data: doctorsData }: IDoctorRS = await api.getDoctors();
        setDoctors(doctorsData);
        if (
          !doctors?.map((i) => i?.id).includes(selectedDoctor?.id || 0) &&
          selectedDoctor?.id
        ) {
          setDoctors((prev) => [
            ...prev,
            {
              id: selectedDoctor.id,
              full_name: selectedDoctor?.full_name,
            },
          ]);
        }
      }
    };
    fetchData();
  }, [selectedHour?.time, isOutOfTurn]);

  useEffect(() => {
    const fetchData = async () => {
      if (userPermissions.includes('service_type.input_search')) {
        const { data: servicesData }: IServiceTypeRS =
          await api.getInputServices();
        setServiceTypes(servicesData);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (serviceTypes?.length && booking?.service_types?.length) {
      const matchedServices = booking.service_types.map((selected) =>
        serviceTypes.find((service) => service.id === selected.id)
      );
      setSelectedServiceTypes(
        matchedServices.filter(Boolean) as IServiceType[]
      );
      setValue(
        'service_types',
        booking.service_types?.map((i) => ({ id: i.id }))
      );
    }
  }, [serviceTypes, booking?.service_types]);

  useEffect(() => {
    const fetchData = async () => {
      if (date) {
        const { data: hoursData }: IHourRS = await api.getHours(
          formatDate(date)
        );
        setHours(hoursData);
        if (booking?.id) {
          setSelectedHour(
            hoursData?.find(
              (hour) =>
                hour.time ===
                booking?.real_reservation_date?.split(' ')[1].slice(0, -3)
            )
          );
          setValue(
            'hour',
            booking?.real_reservation_date?.split(' ')[1].slice(0, -3)
          );
        }
      }
    };
    fetchData();
  }, [formatDate(date)]);

  const handleMultiSelectChange = (e: any) => {
    const selectedTypes = e.value;
    setSelectedServiceTypes(selectedTypes);
    setValue(
      'service_types',
      selectedTypes?.map((i: IServiceType) => ({ id: i.id }))
    );
  };

  const onHide = () => {
    setDialog(false);
    reset();
    setBooking(undefined);
    setSelectedServiceTypes(undefined);
    setSelectedDoctor(undefined);
    setSelectedStatus(undefined);
    setSelectedHour(undefined);
    setDate(undefined);
    setDoctors([]);
    setIsOutOfTurn(false);
  };

  return (
    <Dialog
      visible={dialog}
      modal
      onHide={onHide}
      header="Rezerv"
      style={{
        maxWidth: '500px',
        width: '100%',
      }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <>
          <label style={{ marginBottom: '5px' }} htmlFor="name">
            Müştəri adı:
          </label>
          <Controller
            name="client_name"
            control={control}
            render={({ field }) => (
              <InputText id="name" invalid={!!errors.client_name} {...field} />
            )}
          />
          <div style={{ marginBottom: '10px' }}>
            {errors?.client_name?.message}
          </div>
        </>

        <label style={{ marginBottom: '5px' }} htmlFor="name">
          Telefon:
        </label>
        <Controller
          name="client_phone"
          control={control}
          render={({ field }) => (
            <InputMask
              style={{ marginBottom: '10px' }}
              id="client_phone"
              mask="+999 99 999-99-99"
              placeholder="+994 99 999-99-99"
              invalid={!!errors.client_phone}
              {...field}
            />
          )}
        />

        <label
          style={{
            marginBottom: '5px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
          htmlFor="email"
        >
          Həkim:
          <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
            <label htmlFor="email">Növbədən kənar:</label>
            <Controller
              name="is_out_of_turn"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={isOutOfTurn}
                  onChange={(event) => {
                    setIsOutOfTurn((prev) => !prev);
                    setValue('is_out_of_turn', event?.target?.checked);
                  }}
                >
                  {' '}
                </Checkbox>
              )}
            />
          </div>
        </label>
        <Controller
          name="doctor_id"
          control={control}
          render={({ field }) => (
            <Dropdown
              disabled={
                !selectedHour &&
                (selectedStatus?.id === 2 ||
                  typeof selectedStatus?.id === 'undefined')
              }
              filter
              style={{ marginBottom: '10px' }}
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
        {(typeof getValues().status === 'undefined' ||
          getValues().status === 2) && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="name">
              Tarix və saat:
            </label>
            <div style={{ marginBottom: '5px' }}>
              <Controller
                name="reservation_date"
                control={control}
                render={({ field }) => (
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
                render={({ field }) => (
                  <Dropdown
                    disabled={!date}
                    style={{
                      marginBottom: '10px',
                      marginLeft: '5px',
                      marginRight: '10px',
                    }}
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
                  style={{
                    border: 'solid #111827',
                  }}
                  severity="info"
                  content={
                    <div
                      style={{
                        color: 'white',
                      }}
                    >
                      Yer: {selectedHour?.remaining_space}
                    </div>
                  }
                />
              )}
            </div>
          </>
        )}
        {booking?.id && (
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            {bookingStatuses?.map((status) => {
              return (
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
