'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail, Calendar, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { CreateLeadRequest } from '@/types/lead';
import { DateStrip } from '@/components/ui/DateStrip';
import { TimeSlotPicker } from '@/components/ui/TimeSlotPicker';
import { Skeleton } from '@/components/ui/Skeleton';
import { getAvailableSlots, getVisitDates, toLocalIsoDate, toLocalSlot, TOUR_TIME_SLOTS } from '@/utils/visitSlots';

const DEFAULT_VISIT_TIME = '11:00';

const tourSchema = z
  .object({
    prospectName: z.string().min(2, 'Name must be at least 2 characters'),
    prospectPhone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    prospectEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    preferredDate: z.string().min(1, 'Please select a preferred visit date'),
    preferredTime: z.string().min(1, 'Please select a preferred visit time'),
  })
  .refine((data) => !data.preferredDate || !data.preferredTime || toLocalSlot(data.preferredDate, data.preferredTime) > new Date(), {
    message: 'Please choose a visit time later than now',
    path: ['preferredTime'],
  });

type TourFormData = z.infer<typeof tourSchema>;

type Props = {
  onSubmitLead: (data: CreateLeadRequest) => void;
  loading: boolean;
  /** Phone number already verified via OTP in this session; submitting with it skips the OTP step. */
  verifiedPhone?: string | null;
};

export function TourRequestForm({ onSubmitLead, loading, verifiedPhone = null }: Props) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      preferredDate: '',
      preferredTime: '',
    },
  });

  // "Today" depends on the visitor's clock and timezone, so the pickers render only after mount (avoids hydration mismatches)
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const visitDates = useMemo(() => (now ? getVisitDates(now) : []), [now]);
  const selectedDate = watch('preferredDate');

  // Default to tomorrow (or the first bookable day) at 11 AM when available
  useEffect(() => {
    if (!now || visitDates.length === 0 || getValues('preferredDate')) return;
    const todayIso = toLocalIsoDate(now);
    const defaultDate = visitDates.find((d) => d !== todayIso) ?? visitDates[0];
    const open = getAvailableSlots(defaultDate, now);
    setValue('preferredDate', defaultDate);
    setValue('preferredTime', open.includes(DEFAULT_VISIT_TIME) ? DEFAULT_VISIT_TIME : open[0] ?? '');
  }, [now, visitDates, getValues, setValue]);

  const phoneIsVerified = Boolean(verifiedPhone) && watch('prospectPhone') === verifiedPhone;

  const onFormSubmit = (data: TourFormData) => {
    onSubmitLead({
      leadType: 'TOUR_REQUEST',
      prospectName: data.prospectName,
      prospectPhone: data.prospectPhone,
      prospectEmail: data.prospectEmail || undefined,
      preferredSlot: toLocalSlot(data.preferredDate, data.preferredTime).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" id="tour-request-form">
      <div>
        <label htmlFor="prospect-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Full Name <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectName')}
            type="text"
            id="prospect-name"
            placeholder="e.g. Aditi Katiyar"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>
        {errors.prospectName && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectName.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="prospect-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Mobile Number (for OTP Verification) <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectPhone')}
            type="tel"
            id="prospect-phone"
            maxLength={10}
            placeholder="e.g. 9876543210"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>
        {errors.prospectPhone ? (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectPhone.message}</span>
        ) : (
          phoneIsVerified && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Phone verified
            </span>
          )
        )}
      </div>

      <div>
        <label htmlFor="prospect-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Email Address (Optional)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectEmail')}
            type="email"
            id="prospect-email"
            placeholder="e.g. aditi@example.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>
        {errors.prospectEmail && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectEmail.message}</span>
        )}
      </div>

      <div>
        <span id="preferred-date-label" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          Preferred Visit Date <span className="text-rose-500 dark:text-rose-400">*</span>
        </span>
        {now ? (
          <Controller
            control={control}
            name="preferredDate"
            render={({ field }) => (
              <DateStrip
                id="preferred-slot"
                label="Preferred Visit Date"
                dates={visitDates}
                today={now}
                value={field.value}
                onChange={(date) => {
                  field.onChange(date);
                  // Keep the chosen time if it is still open on the new date, otherwise take the first open slot
                  const open = getAvailableSlots(date, now);
                  if (!open.includes(getValues('preferredTime'))) {
                    setValue('preferredTime', open[0] ?? '', { shouldValidate: isSubmitted });
                  }
                }}
              />
            )}
          />
        ) : (
          <div className="flex gap-2 py-1" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="shrink-0 w-[4.75rem] h-[4.25rem] rounded-xl" />
            ))}
          </div>
        )}
        {errors.preferredDate && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.preferredDate.message}</span>
        )}
      </div>

      <div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          Preferred Time <span className="text-rose-500 dark:text-rose-400">*</span>
        </span>
        {now ? (
          <Controller
            control={control}
            name="preferredTime"
            render={({ field }) => (
              <TimeSlotPicker
                id="preferred-time"
                label="Preferred Time"
                slots={TOUR_TIME_SLOTS}
                availableSlots={selectedDate ? getAvailableSlots(selectedDate, now) : []}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-8 rounded-lg" />
            ))}
          </div>
        )}
        {errors.preferredTime && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.preferredTime.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        id="submit-tour-request-btn"
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span>{loading ? 'Processing...' : phoneIsVerified ? 'Submit Tour Request' : 'Continue to OTP Verification'}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
