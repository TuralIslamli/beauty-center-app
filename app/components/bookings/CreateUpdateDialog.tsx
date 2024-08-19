import {
  IBooking,
  IBookingFields,
  IDoctor,
  IDoctorRS,
  IHour,
  IHourRS,
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
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import api from '@/app/api';
import { bookingStatuses, paymentTypes, serviceStatuses } from '../consts';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';
import { formatDate } from '@/app/utils';
import { Message } from 'primereact/message';

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
  const [selectedHour, setSelectedHour] = useState<IHour>();
  const [selectedPayment, setSelectedPayment] = useState(
    paymentTypes.find((i) => i.id === 0)
  );
  const [selectedStatus, setSelectedStatus] = useState<{
    id: number;
    name: string;
  }>();
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [hours, setHours] = useState<IHour[]>();
  const [isDisabled, setIsDisabled] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>();

  const [date, setDate] = useState<Nullable<Date>>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<IBookingFields>();

  const onSubmit: SubmitHandler<IBookingFields> = async (
    payload: IBookingFields
  ) => {
    setIsDisabled(true);
    try {
      booking?.id
        ? await api.updateBooking({
            client_name: payload.client_name,
            doctor_id: payload.doctor_id,

            id: booking.id,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ''),
            reservation_date: `${formatDate(date)} ${selectedHour?.time}`,
            status: payload.status,
          })
        : await api.createBooking({
            client_name: payload.client_name,
            doctor_id: payload.doctor_id,
            client_phone: payload.client_phone
              ?.toString()
              .replace(/[\s-]/g, ''),
            reservation_date: `${formatDate(date)} ${selectedHour?.time}`,
          });
      showSuccess(`Service has been successfull created`);
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
      setValue('doctor_id', booking.doctor?.id);
      const [day, month, yearAndTime] = booking.reservation_date.split('-');
      const [year, time] = yearAndTime.split(' ');
      const formattedDateString = `${year}-${month}-${day}T${time}`;
      const date = new Date(formattedDateString);
      setValue('reservation_date', date);
      setDate(date);
      // setValue(
      //   'service_types',
      //   service.service_types?.map((i) => ({ id: i.id }))
      // );
      // const actualStatus = () => {
      //   return booking.status !== 2
      //     ? serviceStatuses.find((status) => status?.id === booking.status)
      //     : {
      //         id: 1,
      //         name: 'Gəldi',
      //       };
      // };
      setValue('status', booking.status);
      setSelectedStatus(
        serviceStatuses.find((status) => status?.id === booking.status)
      );
      setSelectedDoctor(doctors?.find((doc) => doc.id === booking.doctor?.id));
      // setSelectedServiceTypes(booking.service_types);
    }
  }, [booking, setValue, doctors]);

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
                booking.reservation_date.split(' ')[1].slice(0, -3)
            )
          );
          setValue('hour', booking.reservation_date.split(' ')[1].slice(0, -3));
        }
      }
    };
    fetchData();
  }, [date]);

  // const handleMultiSelectChange = (e: any) => {
  //   const selectedTypes = e.value;
  //   setSelectedServiceTypes(selectedTypes);
  //   setValue(
  //     'service_types',
  //     selectedTypes?.map((i: IServiceType) => ({ id: i.id }))
  //   );
  //   setValue(
  //     'amount',
  //     selectedTypes.reduce(
  //       (accumulator: number, currentValue: IServiceType) =>
  //         accumulator + +currentValue.price,
  //       0
  //     )
  //   );
  // };

  const onHide = () => {
    setDialog(false);
    reset();
    setBooking(undefined);
    setSelectedServiceTypes(undefined);
    setSelectedDoctor(undefined);
    setSelectedPayment(paymentTypes.find((i) => i.id === 0));
    setSelectedStatus(undefined);
    setSelectedHour(undefined);
    setDate(undefined);
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
        {userPermissions.includes('service.variable.client_name') && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="name">
              Müştəri adı:
            </label>
            <Controller
              name="client_name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InputText
                  style={{ marginBottom: '10px' }}
                  id="name"
                  invalid={!!errors.client_name}
                  {...field}
                />
              )}
            />
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
              rules={{ minLength: 12, required: true }}
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
          </>
        )}

        {userPermissions.includes('service.variable.user_id') && (
          <>
            <label style={{ marginBottom: '5px' }} htmlFor="email">
              Həkim:
            </label>
            <Controller
              name="doctor_id"
              control={control}
              render={({ field }) => (
                <Dropdown
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
          </>
        )}
        {/* {userPermissions.includes('service.variable.service_type_id') && (
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
        )} */}
        <>
          <label style={{ marginBottom: '5px' }} htmlFor="name">
            Tarix və saat:
          </label>
          <div style={{ marginBottom: '5px' }}>
            <Controller
              name="reservation_date"
              control={control}
              rules={{ required: true }}
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
                  style={{ marginBottom: '10px', marginLeft: '5px', marginRight: '10px' }}
                  value={selectedHour}
                  onChange={(e) => {
                    setSelectedHour(e.value);
                    setValue('hour', e.value.time);
                  }}
                  optionLabel="time"
                  options={hours}
                  optionDisabled={(option) => !option.active}
                  placeholder="Saat seçin"
                  invalid={!!errors.hour}
                />
              )}
            />
           {selectedHour?.remaining_space && <Message
              style={{
                border: 'solid #111827',
              }}
              severity="info"
              content={<div style={{
                color: 'white'
              }}>Yer: {selectedHour?.remaining_space}</div>}
            />}
          </div>
        </>
        {userPermissions.includes('service.variable.status') && booking?.id && (
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
