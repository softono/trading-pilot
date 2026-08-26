"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function OtpInput({ value, onChange, maxLength = 6 }: OtpInputProps) {
  return (
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      containerClassName="flex items-center gap-2 w-full justify-center"
    >
      <InputOTPGroup className="w-full flex justify-between gap-2">
        <InputOTPSlot index={0} className="flex-1 min-w-0" />
        <InputOTPSlot index={1} className="flex-1 min-w-0" />
        <InputOTPSeparator />
        <InputOTPSlot index={2} className="flex-1 min-w-0" />
        <InputOTPSlot index={3} className="flex-1 min-w-0" />
        <InputOTPSeparator />
        <InputOTPSlot index={4} className="flex-1 min-w-0" />
        <InputOTPSlot index={5} className="flex-1 min-w-0" />
      </InputOTPGroup>
    </InputOTP>
  );
}
