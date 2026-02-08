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
    <div className="relative min-h-screen bg-white w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute h-[1086.673px] left-[calc(50%+24.57px)] top-[calc(50%-9.5px)] -translate-x-1/2 -translate-y-1/2 w-[1489.145px]">
        <Image
          alt="login-bg"
          src="/login-bg.png"
          fill
          className="object-cover pointer-events-none"
          priority
        />
      </div>

      {/* Logo */}
      <div className="absolute top-[76px] left-[76px] z-10">
        <Image
          alt="logo"
          src="/kadant-logo.svg"
          width={185}
          height={30}
          priority
        />
      </div>

      {/* Form Container with Gradient Background */}
      <div 
        className="absolute left-[795px] top-1/2 -translate-y-1/2 border border-[#f5f7ff] h-[576.162px] w-[555.189px] rounded-[42px] z-10 flex items-center justify-center"
        style={{ 
          backgroundImage: "linear-gradient(210.51deg, rgb(255, 255, 255) 32.149%, rgba(243, 250, 255, 0.5) 65.418%, rgba(189, 227, 255, 0) 98.688%)" 
        }}
      >
        {/* Form Content */}
        <div className="flex flex-col gap-[50px] w-[443px] px-[56px] py-[50px]">
          {/* Header */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="text-[#1d1d1d] text-[32px] leading-[100%] font-montserrat font-bold">
              Admin Portal
            </h2>
            <p className="text-[#404040] text-[18px] leading-[1.35] font-montserrat font-semibold">
              Log in to view assigned cases
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[35px]">
            <div className="flex flex-col gap-[12px]">
              {/* Admin ID Field */}
              <div className="relative">
                <Input
                  className="bg-white h-[51px] border border-[#607797] rounded-[6px] px-5 text-[#2d3e5c] text-[18px] leading-[27px] font-montserrat font-medium placeholder:text-[#2d3e5c] focus-visible:ring-0 focus-visible:ring-offset-0"
                  type="text"
                  id="email"
                  placeholder="Admin ID"
                  {...register("email", { required: true })}
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Input
                  className="bg-white h-[51px] border border-[#607797] rounded-[6px] px-5 pr-[50px] text-[#2d3e5c] text-[18px] leading-[27px] font-montserrat font-medium placeholder:text-[#2d3e5c] focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    <LuEye className="w-6 h-6 text-[#2d3e5c]" />
                  ) : (
                    <LuEyeClosed className="w-6 h-6 text-[#2d3e5c]" />
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <Link
                href="/forgot-password"
                className="text-[#171717] text-[16px] leading-[24px] font-montserrat font-semibold hover:underline self-start"
              >
                Forgot Password?
              </Link>
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
                "Log In"
              )}
            </Button>

            {/* Login to Client Link - Bottom */}
            <div className="flex items-center justify-center gap-[5px] p-[10px]">
              <BiUser color="#2d3e5c" size={24} />
              <Link
                href="https://client.healthmonitorapp.online"
                className="text-[#2d3e5c] text-[16px] leading-[24px] font-montserrat font-semibold hover:underline"
              >
                Login to Client
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Marketing Text */}
      <div className="absolute left-[76px] top-[736px] flex flex-col gap-[14px] max-w-[593px] z-10">
        <h1 className="text-[#1d1d1d] text-[48px] leading-none font-lato font-black not-italic">
          From machine health alerts,
          <br />
          to client service schedules
        </h1>
        <p className="text-[#1d1d1d] text-[18px] leading-[1.35] font-lato font-semibold w-[556.586px]">
          Monitor machine health, manage client schedules, and keep operations running smoothly, all from one dashboard.
        </p>
      </div>
    </div>
  );
}