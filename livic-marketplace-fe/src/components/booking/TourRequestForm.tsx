'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import { CreateLeadRequest } from '@/types/lead';

const tourSchema = z.object({
  prospectName: z.string().min(2, 'Name must be at least 2 characters'),
  prospectPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  prospectEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  preferredSlot: z.string().min(1, 'Please select a preferred visit date'),
});

type TourFormData = z.infer<typeof tourSchema>;

type Props = {
  onSubmitLead: (data: CreateLeadRequest) => void;
  loading: boolean;
  isPhoneVerified?: boolean;
};

function getTomorrowIsoDate(offsetDays: number = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function TourRequestForm({ onSubmitLead, loading, isPhoneVerified = false }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      preferredSlot: getTomorrowIsoDate(1),
    },
  });

  const onFormSubmit = (data: TourFormData) => {
    if (isPhoneVerified) return;
    onSubmitLead({
      leadType: 'TOUR_REQUEST',
      prospectName: data.prospectName,
      prospectPhone: data.prospectPhone,
      prospectEmail: data.prospectEmail || undefined,
      preferredSlot: new Date(data.preferredSlot).toISOString(),
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
            disabled={isPhoneVerified}
            placeholder="e.g. Aditi Katiyar"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
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
        <label htmlFor="prospect-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Email Address (Optional)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('prospectEmail')}
            type="email"
            id="prospect-email"
            disabled={isPhoneVerified}
            placeholder="e.g. aditi@example.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {errors.prospectEmail && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.prospectEmail.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="preferred-slot" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Preferred Visit Date <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('preferredSlot')}
            type="date"
            id="preferred-slot"
            disabled={isPhoneVerified}
            min={new Date().toISOString().split('T')[0]}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {errors.preferredSlot && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block">{errors.preferredSlot.message}</span>
        )}
      </div>

      {isPhoneVerified ? (
        <button
          type="button"
          disabled
          id="submit-tour-request-btn"
          className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>Phone Verified</span>
        </button>
      ) : (
        <button
          type="submit"
          disabled={loading}
          id="submit-tour-request-btn"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span>{loading ? 'Processing...' : 'Continue to OTP Verification'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
