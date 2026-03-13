import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "@/components/landing/header";
import DarkVeil from "@/components/landing/DarkVeil";

type HeroSectionProps = {
  user: {
    email: string;
    name: string;
  } | null;
};

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: 1
      }
    }
  }
};

export default function HeroSection({ user }: HeroSectionProps) {
  return (
    <>
      <HeroHeader user={user} />
      <main className="relative overflow-hidden">
         {/* <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-72 dark:block">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="absolute left-1/2 top-8 h-56 w-[32rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 isolate hidden opacity-80 contain-strict lg:block">
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[21.875rem] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.12)_0,hsla(0,0%,55%,.04)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-[15rem] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.10)_0,hsla(0,0%,45%,.03)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-[15rem] -translate-y-[21.875rem] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.08)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div> */}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)] md:h-[36rem] lg:h-[60rem]"
        >
          <DarkVeil
            hueShift={30}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
          />
          {/* <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-28 opacity-40 [background-image:repeating-linear-gradient(0deg,hsl(var(--foreground)/0.05)_0px,transparent_2px),repeating-linear-gradient(90deg,hsl(var(--foreground)/0.04)_0px,transparent_3px)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,transparent_100%)]"
          /> */}
        </div>

        <section className="">
          <div className="relative pt-24 md:pt-36">
            <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]" />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <a
                    href="#link"
                    className="hover:bg-background/70 bg-muted/70 group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300"
                  >
                    <span className="text-foreground text-sm">O workspace inteligente para advogados</span>
                    <span className="block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />
                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                </AnimatedGroup>

                <Image
                  src="/images/vokos_logo_black.svg"
                  alt="Vokos"
                  width={960}
                  height={200}
                  className="mx-auto mt-8 w-full max-w-2xl dark:hidden"
                  priority
                />
                <Image
                  src="/images/vokos_logo_white.svg"
                  alt="Vokos"
                  width={960}
                  height={200}
                  className="mx-auto mt-8 hidden w-full max-w-2xl dark:block"
                  priority
                />

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.3}
                  as="p"
                  className="mx-auto mt-8 max-w-4xl text-balance text-xl font-light"
                >
                  A Vokos AI organiza automaticamente suas tarefas jurídicas a partir de e-mails, andamentos e intimações, para que seu escritório sempre saiba o que fazer e quando fazer.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.4
                        }
                      }
                    },
                    ...transitionVariants
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div key={1}>
                    <Button asChild size="lg" className="rounded-md px-6 py-6 text-xl font-regular">
                      <Link href={user ? "/dashboard" : "/login"}>
                        <span className="text-nowrap">Automatize agora</span>
                        <ArrowRight className="ml-2 size-6" />
                      </Link>
                    </Button>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.5
                    }
                  }
                },
                ...transitionVariants
              }}
            >
              <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div className="inset-shadow-2xs relative mx-auto max-w-6xl overflow-hidden rounded-2xl">
                  <Image
                    className="border-border/25 aspect-15/8 relative rounded-2xl border [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] [mask-size:100%_100%] [-webkit-mask-size:100%_100%]"
                    src="/images/hero_dashboard.avif"
                    alt="app screen"
                    width={2700}
                    height={1440}
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}
