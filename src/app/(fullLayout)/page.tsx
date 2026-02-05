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
    <div className="grid grid-cols-2">
      <div className="relative h-screen w-full">
        <Image
          alt="login-bg"
          src="/login-bg.png"
          width={1000}
          height={1000}
          className="object-cover object-top h-[100svh]"
          priority
        />
        <div className="absolute top-10 w-full flex flex-col text-center justify-center z-10">
          <Image
            alt="logo"
            className="mx-auto"
            src="/kadant-logo.svg"
            width={185}
            height={30}
            priority
          />
          <p className="text-white text-4xl font-lato font-semibold mt-10">
            From machine health alerts,
            <br />
            to client service schedules
            <br />
            All in one place.
          </p>
        </div>
        <div className="absolute z-9 inset-0 bg-[#637796]/37"></div>
      </div>
      <div className="flex flex-col px-[130px] justify-center">

        <div className="flex items-center gap-2 px-4 py-2 min-w-[177px] h-[44px] absolute top-4 right-4">
          <BiUser color="#2d3e5c" />
          <Link
            href="https://client.healthmonitorapp.online"
            className="text-[#2d3e5c] font-semibold text-sm font-montserrat hover:text-[#1a2538] transition-colors"
          >
            Login to Client
          </Link>
        </div>

        <div className="flex flex-col">
          <p className="text-3xl font-montserrat font-semibold">Admin Portal</p>
          <p className="text-base mt-[10px] font-montserrat font-medium">
            Login to access the Admin Portal
          </p>
        </div>

        <div className="flex flex-col mt-[50px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-[20px]">
              <Input
                className="bg-white h-12 border-#96A5BA rounded-sm"
                type="email"
                id="email"
                placeholder="Email"
                {...register("email", { required: true })}
              />
              <div className="relative">
                <Input
                  className="bg-white h-12 border-#96A5BA rounded-sm pr-10"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  {...register("password", { required: true })}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 cursor-pointer top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <LuEye className="w-5 h-5 text-gray-500" />
                  ) : (
                    <LuEyeClosed className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                variant="default"
                className="w-full mt-[15px] cursor-pointer hover:bg-secondary hover:text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Log In"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}