"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../public/images/logo1.svg";
import greenabstract from "../../public/images/greenabstract.jpg";

const classes = {
  Main: "w-full h-screen flex justify-center items-center bg-[#0F1B0E] relative",
  Overlay: "absolute top-0 left-0 w-full h-full bg-black/60 z-10",
  Content: "z-20 relative flex flex-col items-center justify-center text-center",
  LogoContainer: "flex items-center gap-4 mb-4",
  Logo: "object-contain h-16",
  Title: "text-[#AACBB8] text-5xl md:text-6xl font-bold qurova",
  ButtonGroup: "flex gap-6 ",
  Button: "px-8 py-3 rounded-full text-[#0F1B0E] bg-[#AACBB8] hover:bg-[#9ABBA2] transition-colors duration-200 qurova text-lg cursor-pointer",
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={classes.Main}>
      <Image
        src={greenabstract}
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
        priority
      />
      <div className={classes.Overlay} />

      <div className={classes.Content}>
        <div className={classes.LogoContainer}>
          <Image src={logo} alt="Logo" className={classes.Logo} priority />
          <h1 className={classes.Title}>KaryaAI</h1>
        </div>

        <div className={classes.ButtonGroup}>
          <button onClick={() => router.push("/login")} className={classes.Button}>
            Login
          </button>
          <button onClick={() => router.push("/signup")} className={classes.Button}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
