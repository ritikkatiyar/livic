import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TourRequestForm } from '@/components/booking/TourRequestForm';
import { BookingForm } from '@/components/booking/BookingForm';
import { OtpVerifyModal } from '@/components/booking/OtpVerifyModal';

describe('Lead Creation Form & OTP Verification', () => {
  it('validates required fields on TourRequestForm', async () => {
    const handleSubmit = jest.fn();
    render(<TourRequestForm onSubmitLead={handleSubmit} loading={false} />);

    const submitBtn = screen.getByRole('button', { name: /Continue to OTP Verification/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('renders Phone Verified badge and disables input when isPhoneVerified is true', () => {
    render(<BookingForm tokenAmount={2000} onSubmitLead={jest.fn()} loading={false} isPhoneVerified={true} />);

    expect(screen.getByText(/Phone Verified/i)).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Full Name/i);
    expect(nameInput).toBeDisabled();
  });

  it('handles OTP verification modal focus and code input', () => {
    const handleVerify = jest.fn();
    const handleClose = jest.fn();

    render(
      <OtpVerifyModal
        isOpen={true}
        phone="9876543210"
        code="000000"
        setCode={jest.fn()}
        onVerify={handleVerify}
        onResend={jest.fn()}
        onClose={handleClose}
        loading={false}
        error={null}
        cooldown={0}
      />
    );

    expect(screen.getByText(/Verify Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByText(/\+91 9876543210/i)).toBeInTheDocument();

    const verifyBtn = screen.getByRole('button', { name: /Verify Code & Proceed/i });
    fireEvent.click(verifyBtn);
    expect(handleVerify).toHaveBeenCalledWith('000000');
  });
});
