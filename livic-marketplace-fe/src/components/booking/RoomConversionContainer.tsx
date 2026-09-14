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
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const {
    phone,
    isModalOpen,
    otpCode,
    setOtpCode,
    initiateOtp,
    submitOtpCode,
    resendOtp,
    closeModal,
    loading: otpLoading,
    error: otpError,
    cooldown,
  } = useOtpVerification();

  const { submitLead, loading: leadLoading, error: leadError } = useCreateLead();

  const handleFormSubmit = async (req: CreateLeadRequest) => {
    setPendingLeadRequest(req);
    await initiateOtp(req.prospectPhone);
  };

  const handleOtpVerified = async (codeToVerify: string) => {
    const verified = await submitOtpCode(codeToVerify);
    if (verified && pendingLeadRequest) {
      setIsPhoneVerified(true);
      const token = `mock-otp-token-${pendingLeadRequest.prospectPhone}-${Date.now()}`;
      const res = await submitLead(property.id, unit.id, pendingLeadRequest, token);
      if (res) {
        setLeadResponse(res);
      }
    }
  };

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
            isPhoneVerified={isPhoneVerified}
          />
        ) : (
          <BookingForm
            tokenAmount={2000}
            onSubmitLead={handleFormSubmit}
            loading={otpLoading || leadLoading}
            isPhoneVerified={isPhoneVerified}
          />
        )}

        {leadError && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center">{leadError}</p>
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
