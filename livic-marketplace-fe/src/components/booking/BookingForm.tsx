'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail, Calendar, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { CreateLeadRequest } from '@/types/lead';
import { formatCurrency } from '@/utils/formatCurrency';

const bookingSchema = z.object({
  prospectName: z.string().min(2, 'Name must be at least 2 characters'),
  prospectPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  prospectEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  expectedMoveInDate: z.string().min(1, 'Please select your target move-in date'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

type Props = {
  tokenAmount: number;
  onSubmitLead: (data: CreateLeadRequest) => void;
  loading: boolean;
  isPhoneVerified?: boolean;
};

function getTomorrowIsoDate(offsetDays: number = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function BookingForm({ tokenAmount, onSubmitLead, loading, isPhoneVerified = false }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      expectedMoveInDate: getTomorrowIsoDate(7),
    },
  });

  const onFormSubmit = (data: BookingFormData) => {
    if (isPhoneVerified) return;
    onSubmitLead({
      leadType: 'BOOKING',
      prospectName: data.prospectName,
      prospectPhone: data.prospectPhone,
      prospectEmail: data.prospectEmail || undefined,
      expectedMoveInDate: new Date(data.expectedMoveInDate).toISOString(),
      tokenAmount,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" id="booking-request-form">
      {/* Refundable Guarantee Disclosure */}
      <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/30 flex items-start gap-2.5">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white block">100% Refundable Token Advance</span>
          <p className="text-slate-700 dark:text-slate-300">
            Pay <span className="font-bold text-indigo-600 dark:text-amber-300">{formatCurrency(tokenAmount)}</span> to reserve this unit immediately. This deposit is fully refundable if you cancel after property walkthrough.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="booking-prospect-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Full Name <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectName')}
            type="text"
            id="booking-prospect-name"
            disabled={isPhoneVerified}
            placeholder="e.g. Ritik Katiyar"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {errors.prospectName && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectName.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="booking-prospect-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Mobile Number (for OTP Verification) <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectPhone')}
            type="tel"
            id="booking-prospect-phone"
            maxLength={10}
            disabled={isPhoneVerified}
            placeholder="e.g. 9876543210"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {errors.prospectPhone && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectPhone.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="booking-prospect-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Email Address (Optional)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectEmail')}
            type="email"
            id="booking-prospect-email"
            disabled={isPhoneVerified}
            placeholder="e.g. ritik@example.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {errors.prospectEmail && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectEmail.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="expected-move-in" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Target Move-In Date <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('expectedMoveInDate')}
            type="date"
            id="expected-move-in"
            disabled={isPhoneVerified}
            min={new Date().toISOString().split('T')[0]}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {errors.expectedMoveInDate && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.expectedMoveInDate.message}</span>
        )}
      </div>

      {isPhoneVerified ? (
        <button
          type="button"
          disabled
          id="submit-booking-request-btn"
          className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>Phone Verified</span>
        </button>
      ) : (
        <button
          type="submit"
          disabled={loading}
          id="submit-booking-request-btn"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <span>{loading ? 'Processing...' : `Verify Phone & Pay ${formatCurrency(tokenAmount)}`}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
