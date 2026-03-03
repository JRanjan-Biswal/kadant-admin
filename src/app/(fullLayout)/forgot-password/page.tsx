"use client"

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import { Loader2 } from "lucide-react";
import { BiUser } from "react-icons/bi";
import Link from "next/link";
import { forgotPassword } from "@/actions/forgot-password";

export default function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { },
  } = useForm<FieldValues>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);
    try {
      const result = await forgotPassword(data.email);

      if (!result.success) {
        toast.error(result.error || "Failed to send reset email");
        return;
      }

      setIsSubmitted(true);
      toast.success(result.message || "Reset password link sent to your email");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100svh] min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full z-[-1] ">
        <Image
          alt="login-bg"
          src="/login-bg-new.png"
          width={1000}
          height={1000}
          className="object-cover object-center h-[100svh] w-full "
          priority
        />
      </div>

      {/* Logo */}
      <div className="text-white md:w-1/2 xl:w-[55%] px-[40px] py-[50px] flex flex-col gap-[10px] h-full items-start justify-between relative z-[1]">
        <Image
          alt="logo"
          className=""
          src="/kadant-logo.svg"
          width={185}
          height={30}
          priority
        />
        <div className="flex flex-col gap-[10px] justify-end">
          <div className="font-lato font-black leading-[120%] text-[36px] xl:text-[38px] [@media(min-width:1440px)]:text-[48px] not-italic">
            <p className="mb-0">From machine health alerts,</p>
            <p>to client service schedules</p>
          </div>
          <p className="font-montserrat font-normal leading-[1.35] text-[16px] md:text-[18px] w-full md:w-[556.586px] max-w-full">
            Monitor machine health, manage client schedules, and keep operations running smoothly, all from one dashboard.
          </p>
        </div>

      </div>

      {/* Form Container with Gradient Background */}
      <div className="absolute inset-0 flex items-center justify-end z-10 pr-8 md:pr-16 lg:pr-24">
        <div className="glassmorphic-login-container">
          <div className="w-[443px] flex flex-col gap-[36px]">
            {/* Header */}
            <div className="flex flex-col gap-[10px]">
              <h2 className="text-[40px] font-bold font-montserrat bg-gradient-to-b from-[#eef3ff] to-[#fbfcff] bg-clip-text text-transparent leading-[normal] text-nowrap" style={{ textShadow: '2px 1px 1px rgba(0,0,0,0.25)' }}>
                Forgot Password?
              </h2>
              <p className="text-[14px] font-semibold font-montserrat text-white leading-[1.35] min-w-full" style={{ textShadow: '1px 1px 0.5px rgba(0,0,0,0.25)' }}>
                Reset password link sent to your Email Id.
              </p>
            </div>

            {/* Form */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[24px]">
                <div className="flex flex-col gap-[12px]">
                  {/* Email ID Field */}
                  <div className="relative">
                    <Input
                      className="bg-white h-[51px] border border-[#607797] rounded-[6px] px-5 pr-[50px] text-[#2d3e5c] text-[18px] leading-[27px] font-montserrat font-medium placeholder:text-[#2d3e5c] focus-visible:ring-0 focus-visible:ring-offset-0"
                      type="email"
                      id="email"
                      placeholder="Email ID"
                      {...register("email", { required: true })}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#d45815] hover:bg-[#d45815]/90 text-white h-[54px] rounded-[6px] px-[50px] text-[18px] leading-[1.35] font-montserrat font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                {/* Login to Client Link - Bottom */}
                <div className="flex items-center justify-start gap-[5px] p-[10px]">
                  <BiUser color="#fff" size={24} />
                  <Link
                    href="/"
                    className="text-[#fff] text-[16px] leading-[24px] font-montserrat font-semibold hover:underline"
                  >
                    Login to Admin
                  </Link>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-[24px]">
                <div className="bg-green-50 border border-green-200 rounded-[6px] p-4">
                  <p className="text-green-800 text-[16px] leading-[1.35] font-montserrat font-semibold">
                    Reset password link has been sent to your email. Please check your inbox.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/")}
                  className="bg-[#d45815] hover:bg-[#d45815]/90 text-white h-[54px] rounded-[6px] px-[50px] text-[18px] leading-[1.35] font-montserrat font-semibold"
                >
                  Back to Login
                </Button>
                {/* Login to Client Link - Bottom */}
                <div className="flex items-center justify-center gap-[5px] p-[10px]">
                  <BiUser color="#fff" size={24} />
                  <Link
                    href="/"
                    className="text-[#fff] text-[16px] leading-[24px] font-montserrat font-semibold hover:underline"
                  >
                    Login to Admin
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marketing Text */}
      {/* <div className="absolute left-[76px] top-[736px] flex flex-col gap-[14px] max-w-[593px] z-10">
        <h1 className="text-[#1d1d1d] text-[48px] leading-none font-lato font-black not-italic">
          From machine health alerts,
          <br />
          to client service schedules
        </h1>
        <p className="text-[#1d1d1d] text-[18px] leading-[1.35] font-lato font-semibold w-[556.586px]">
          Monitor machine health, manage client schedules, and keep operations running smoothly, all from one dashboard.
        </p>
      </div> */}
    </div>
  );
}
