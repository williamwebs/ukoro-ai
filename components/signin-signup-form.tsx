"use client";

import { IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "./ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useAtom } from "jotai";
import { userAtom } from "../atom/userAtom";

export function SigninSignupForm() {
  const [, setUser] = useAtom(userAtom);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.log("Error signing in!", error);
    }
  };
  return (
    <div className="max-w-md w-full text-center mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Welcome to Ukoro-ai
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-1 dark:text-neutral-300">
        Login / Sign-up using google to access Ukoro-ai
      </p>

      <div className="flex items-center gap-2 mt-5">
        <Button
          onClick={handleGoogleSignIn}
          className=" relative group/btn flex space-x-2 items-center justify-center w-full shadow-input "
        >
          <IconBrandGoogle className="h-4 w-4 " />
          <span className=" text-sm">Google</span>
          <BottomGradient />
        </Button>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};
