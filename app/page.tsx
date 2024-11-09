"use client";

import { userAtom } from "@/atom/userAtom";
import { AnimatedModal } from "@/components/modal";
import { SigninSignupForm } from "@/components/signin-signup-form";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import Link from "next/link";

export default function Home() {
  const [user] = useAtom(userAtom);

  return (
    <main className="w-full min-h-full flex items-center justify-center">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl md:text-6xl font-semibold max-w-4xl text-center">
          Ukoro-ai: <br className="md:hidden" /> Your Personal AI Assistant
          Dashboard
        </h1>
        <p className="font-medium text-base max-w-4xl text-center px-2 md:px-0">
          Welcome to your Ukoro-ai Dashboard. Here, cutting-edge AI meets an
          intuitive interface to bring you the answers you seek. Use our{" "}
          <span className="font-semibold animate-pulse">
            video and medical report analysis tools
          </span>{" "}
          to unlock knowledge instantly, interact with chat-driven responses,
          and see your history in one streamlined, smart space.
        </p>

        {user ? (
          <AnimatedModal
            triggerText="Explore"
            animatedText="zooom.."
            modalContent={
              <>
                <h4 className="text-center text-base font-semibold mb-4">
                  Click on any of the links to explore
                </h4>
                <div className="flex flex-col items-center justify-between gap-3 md:gap-2 w-full h-full">
                  <Button className="w-full" variant={"outline"}>
                    <Link href={"/xray-scanner"}>X-Ray Scanner</Link>
                  </Button>
                  <Button className="w-full" variant={"outline"}>
                    <Link href={"/report-analyzer"}>Medical Report</Link>
                  </Button>
                  <Button className="w-full" variant={"outline"}>
                    <Link href={"/video-transcriber"}>Video Transcriber</Link>
                  </Button>
                </div>
              </>
            }
          />
        ) : (
          <AnimatedModal
            triggerText="Get started"
            animatedText="wa na"
            modalContent={<SigninSignupForm />}
          />
        )}
      </div>
    </main>
  );
}
