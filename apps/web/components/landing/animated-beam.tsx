'use client';

import { cn } from '@/lib/utils';
import React, { useRef } from 'react';

import { AnimatedBeam, Circle } from '@/components/ui/animated-beam';
import { LogoIcon } from '../logo';
import { CalendarIcon, Flag, Mail, ScrollText } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

type MiniTaskCardProps = {
  cardRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  source: 'Email' | 'DJe';
  dueLabel: string;
  priority: 'Alta' | 'Media';
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'yellow' | 'red';
  className?: string;
};

function MiniTaskCard({
  cardRef,
  title,
  source,
  dueLabel,
  priority,
  icon: Icon,
  className,
  tone,
}: MiniTaskCardProps) {
  const toneStyles = {
    blue: {
      badge: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
      icon: 'bg-blue-500/15 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    },
    yellow: {
      badge:
        'bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
      icon: 'bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    },
    red: {
      badge: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300',
      icon: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    },
  };

  return (
    <Card
      ref={cardRef}
      className={cn('z-10 w-[220px] border-none bg-background/95 shadow-lg', className)}
    >
      <CardContent className='space-y-2 p-2.5'>
        <div className='flex items-center justify-between gap-2'>
          <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground'>
            {source}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              toneStyles[tone].badge
            )}
          >
            {priority}
          </span>
        </div>

        <div className='flex items-start gap-2'>
          <span
            className={cn(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md',
              toneStyles[tone].icon
            )}
          >
            <Icon className='size-3.5' />
          </span>
          <p className='line-clamp-2 text-[11px] font-medium leading-4 text-foreground'>
            {title}
          </p>
        </div>

        <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground'>
          <CalendarIcon className='size-3' />
          <span>{dueLabel}</span>
          <Flag className='ml-1 size-3' />
          <span>{priority}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnimatedBeamComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  const gmailUrl = 'https://img.icons8.com/color-glass/48/gmail.png';
  const outlookUrl = 'https://img.icons8.com/color/96/microsoft-outlook-2025.png';

  return (
    <div
      className='relative mx-auto flex aspect-76/59 w-full items-center justify-center rounded-2xl bg-gradient-to-t from-neutral-50 via-neutral-50/85 to-transparent p-4 shadow-xl dark:from-neutral-800 dark:via-neutral-800/85 dark:to-transparent lg:py-10 lg:pl-24 lg:pr-12'
      ref={containerRef}
    >
      <div className='flex h-full w-full flex-col items-stretch justify-between gap-4'>
        <div className='flex flex-row items-center justify-between'>
          <Circle ref={div1Ref} className='bg-card border-none shadow-lg h-16 w-16 ml-6'>
            <img
              src={gmailUrl}
              alt='Gmail'
              className='h-14 w-14 object-contain'
            />
          </Circle>
          <MiniTaskCard
            cardRef={div5Ref}
            source='Email'
            title='Revisar comprovante enviado pelo cliente e protocolar peticao de juntada.'
            dueLabel='Hoje, 17:00'
            priority='Media'
            icon={Mail}
            tone='blue'
          />
        </div>
        <div className='flex flex-row items-center justify-between'>
          <Circle ref={div2Ref} className='p-2 bg-card border-none shadow-lg h-16 w-16'>
            <span className='text-2xl font-bold font-mono'>DJe</span>            
          </Circle>
          <Circle ref={div4Ref} className='h-24 w-24 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-full shadow-lg flex items-center justify-center'>
            <LogoIcon className='w-14 h-14 ' />
          </Circle>
          <MiniTaskCard
            cardRef={div6Ref}
            source='DJe'
            title='Cumprir intimacao: apresentar manifestacao em 5 dias uteis no processo.'
            dueLabel='Prazo em 3 dias'
            priority='Alta'
            icon={ScrollText}
            tone='yellow'
          />
        </div>
        <div className='flex flex-row items-center justify-between'>
          <Circle ref={div3Ref} className='p-2 bg-card border-none shadow-lg h-16 w-16 ml-6'>
            <img
                src={outlookUrl}
                alt='Outlook'
                className='h-14 w-14 object-contain'
                />
          </Circle>
          <MiniTaskCard
            cardRef={div7Ref}
            source='Email'
            title='Agendar audiencia de conciliacao e confirmar participacao com o cliente.'
            dueLabel='Amanha, 09:30'
            priority='Alta'
            icon={Mail}
            tone='red'
          />
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-30}
        endYOffset={0}
        dotted
        gradientStartColor='#48b0d9'
        gradientStopColor='#67aeff'
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
        dotted
        gradientStartColor='#48b0d9'
        gradientStopColor='#67aeff'
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={30}
        endYOffset={0}
        dotted
        gradientStartColor='#48b0d9'
        gradientStopColor='#67aeff'
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={30}
        endYOffset={0}
        gradientStartColor='#48b0d9'
        gradientStopColor='#67aeff'
        dotted
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        dotted
        gradientStartColor='#48b0d9'
        gradientStopColor='#67aeff'
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={-30}
        endYOffset={0}
        dotted
        gradientStartColor='#48b0d9'
        gradientStopColor='#67aeff'
      />
    </div>
  );
}
