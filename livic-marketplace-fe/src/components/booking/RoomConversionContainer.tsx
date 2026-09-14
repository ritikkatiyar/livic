'use client';

import { useState } from 'react';
import { PropertyDetail } from '@/types/property';
import { UnitSummary } from '@/types/unit';
import { CreateLeadRequest, LeadResponse, LeadType } from '@/types/lead';
import { getAvailableActions } from '@/features/property/useAvailableActions';
import { useOtpVerification } from '@/features/leads/useOtpVerification';
import { useCreateLead } from '@/features/leads/useCreateLead';
import { LeadActionPicker } from './LeadActionPicker';
import { TourRequestForm } from './TourRequestForm';
import { BookingForm } from './BookingForm';
import { OtpVerifyModal } from './OtpVerifyModal';
import { TokenPaymentButton } from './TokenPaymentButton';
import { LeadConfirmation } from './LeadConfirmation';

type Props = {
  property: PropertyDetail;
  unit: UnitSummary;
};

export function RoomConversionContainer({ property, unit }: Props) {
  const availableActions = getAvailableActions(property);
  const [selectedType, setSelectedType] = useState<LeadType>('TOUR_REQUEST');
  const [pendingLeadRequest, setPendingLeadRequest] = useState<CreateLeadRequest | null>(null);
  const [leadResponse, setLeadResponse] = useState<LeadResponse | null>(null);
  // Lock the booking form only once a booking lead exists (it then waits for token payment)
  const isBookingSubmitted = leadResponse?.leadType === 'BOOKING';

  const {
    phone,
    isModalOpen,
    otpCode,
    setOtpCode,
    initiateOtp,
    submitOtpCode,
    resendOtp,
    closeModal,
    getSessionTokenFor,
    clearSession,
    otpSessionToken,
    loading: otpLoading,
    error: otpError,
    cooldown,
  } = useOtpVerification();

  const { submitLead, loading: leadLoading, error: leadError } = useCreateLead();

  const createLeadWithToken = async (req: CreateLeadRequest, token: string) => {
    const { lead, error } = await submitLead(property.id, unit.id, req, token);
    if (lead) {
      setLeadResponse(lead);
    } else if (error && /otp session/i.test(error)) {
      // Expired or rejected session: the next submit starts a fresh OTP verification
      clearSession();
    }
  };

  const handleFormSubmit = async (req: CreateLeadRequest) => {
    setPendingLeadRequest(req);
    // Retrying after a failed submission reuses the session already verified for this phone
    const existingToken = getSessionTokenFor(req.prospectPhone);
    if (existingToken) {
      await createLeadWithToken(req, existingToken);
      return;
    }
    await initiateOtp(req.prospectPhone);
  };

  const handleOtpVerified = async (codeToVerify: string) => {
    const token = await submitOtpCode(codeToVerify);
    if (token && pendingLeadRequest) {
      await createLeadWithToken(pendingLeadRequest, token);
    }
  };

  // OTP request errors (e.g. cooldown) happen before the modal opens, so show them under the form
  const formError = leadError || (!isModalOpen ? otpError : null);
  const verifiedPhone = otpSessionToken ? phone : null;

  if (leadResponse && (leadResponse.status === 'CONFIRMED' || leadResponse.leadType === 'TOUR_REQUEST')) {
    return <LeadConfirmation lead={leadResponse} propertyName={property.name} />;
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Action Picker */}
      <LeadActionPicker
        selectedType={selectedType}
        availableActions={availableActions}
        onSelectType={setSelectedType}
      />

      {/* Step 2: Active Form */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          {selectedType === 'TOUR_REQUEST' ? 'Schedule Property Walkthrough' : 'Reserve Unit with Token'}
        </h3>

        {selectedType === 'TOUR_REQUEST' ? (
          <TourRequestForm
            onSubmitLead={handleFormSubmit}
            loading={otpLoading || leadLoading}
            verifiedPhone={verifiedPhone}
          />
        ) : (
          <BookingForm
            tokenAmount={2000}
            onSubmitLead={handleFormSubmit}
            loading={otpLoading || leadLoading}
            isPhoneVerified={isBookingSubmitted}
          />
        )}

        {formError && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center" role="alert">{formError}</p>
        )}
      </div>

      {/* Step 3: Pending Token Payment if Booking Lead is created and user is on BOOKING tab */}
      {selectedType === 'BOOKING' && leadResponse && leadResponse.leadType === 'BOOKING' && leadResponse.status === 'NEW' && (
        <TokenPaymentButton lead={leadResponse} onSuccess={(confirmed) => setLeadResponse(confirmed)} />
      )}

      {/* Step 4: OTP Verification Modal */}
      <OtpVerifyModal
        isOpen={isModalOpen}
        phone={phone}
        code={otpCode}
        setCode={setOtpCode}
        onVerify={handleOtpVerified}
        onResend={resendOtp}
        onClose={closeModal}
        loading={otpLoading || leadLoading}
        error={otpError}
        cooldown={cooldown}
      />
    </div>
  );
}
