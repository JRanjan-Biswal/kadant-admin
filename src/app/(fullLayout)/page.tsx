"use client"

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LuEyeClosed, LuEye } from "react-icons/lu";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import { Loader2 } from "lucide-react";
import { BiUser } from "react-icons/bi";
import Link from "next/link";


export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const {
    register,
    handleSubmit,
    formState: { },
  } = useForm<FieldValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);
    const response = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setIsLoading(false);
    if (response?.error) {
      toast.error("Invalid credentials");
    } else {
      router.push("/client-management");
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
              <h2 className="text-[48px] font-bold font-montserrat bg-gradient-to-b from-[#eef3ff] to-[#fbfcff] bg-clip-text text-transparent leading-[normal] text-nowrap" style={{ textShadow: '2px 1px 1px rgba(0,0,0,0.25)' }}>
                Admin Portal
              </h2>
              <p className="text-[18px] font-semibold font-montserrat text-white leading-[1.35] min-w-full" style={{ textShadow: '1px 1px 0.5px rgba(0,0,0,0.25)' }}>
                Log in to view assigned cases
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[35px]">
              <div className="flex flex-col gap-[12px]">
                {/* Admin ID Field */}
                <div className="relative">
                  <Input
                    className="w-full pl-[20px] pr-[14px] h-12 py-[15px] bg-gradient-to-r from-[#8d3210] via-[#ba3606] via-[65.865%] to-[#8d3210] border-[1.5px] border-[#dfe6ec] rounded-[6px] text-[18px] font-medium font-montserrat text-white placeholder:text-white leading-[27px] focus:outline-none transition-all"
                    type="text"
                    id="email"
                    placeholder="Admin ID"
                    {...register("email", { required: true })}
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Input
                    className="w-full pl-[20px] pr-[14px] h-12 py-[15px] bg-gradient-to-r from-[#8d3210] via-[#ba3606] via-[65.865%] to-[#8d3210] border-[1.5px] border-white rounded-[6px] text-[18px] font-medium font-montserrat text-white placeholder:text-white leading-[27px] focus:outline-none transition-all pr-[50px]"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Password"
                    {...register("password", { required: true })}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 cursor-pointer w-6 h-6"
                  >
                    {showPassword ? (
                      <LuEye className="w-5 h-5 text-white" />
                    ) : (
                      <LuEyeClosed className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <Link
                  href="/forgot-password"
                  className="text-base font-semibold font-montserrat text-white leading-[24px] text-nowrap cursor-pointer hover:opacity-80 transition-opacity text-left"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                variant="default"
                size="lg"
                className="w-full mt-[0px] lg:h-[50px] h-[40px] cursor-pointer hover:bg-secondary hover:text-white font-semibold text-[16px]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Log In"
                )}
              </Button>

              {/* Login to Client Link - Bottom */}
              <div className="flex items-center justify-start gap-[5px] p-[10px]">
                <BiUser color="#fff" size={24} />
                <Link
                  href="https://client.healthmonitorapp.online"
                  className="text-[#fff] text-[16px] leading-[24px] font-montserrat font-semibold hover:underline"
                >
                  Login to Client
                </Link>
              </div>
            </form>
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