"use client";

import { LogoIcon } from "@/components/logo";

export function EmailToTaskAnimation() {
  return (
    <div className="relative flex aspect-[76/59] w-full items-center justify-center overflow-hidden rounded-[15px] bg-zinc-50 dark:bg-zinc-900/60">
      <svg
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient for the flowing light on the top path */}
          <linearGradient id="flow-grad-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Path: email box down to center hub */}
          <path
            id="path-email-to-hub"
            d="M 200 85 L 200 145"
          />

          {/* Path: center hub to left task */}
          <path
            id="path-hub-to-left"
            d="M 200 185 C 200 210, 200 220, 95 250"
          />

          {/* Path: center hub to center task */}
          <path
            id="path-hub-to-center"
            d="M 200 185 L 200 250"
          />

          {/* Path: center hub to right task */}
          <path
            id="path-hub-to-right"
            d="M 200 185 C 200 210, 200 220, 305 250"
          />
        </defs>

        {/* ── Static line paths (subtle) ── */}
        <path
          d="M 200 85 L 200 145"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <path
          d="M 200 185 C 200 210, 200 220, 95 250"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <path
          d="M 200 185 L 200 250"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <path
          d="M 200 185 C 200 210, 200 220, 305 250"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-200 dark:text-zinc-700"
        />

        {/* ── Email icon card (top) ── */}
        <g>
          <rect x="140" y="30" width="120" height="55" rx="12" fill="white" stroke="#e4e4e7" strokeWidth="1" className="dark:fill-zinc-800 dark:[stroke:#3f3f46]" />
          {/* Envelope icon */}
          <rect x="158" y="44" width="24" height="18" rx="3" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          <polyline points="158,44 170,54 182,44" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          {/* Label */}
          <text x="190" y="52" className="fill-zinc-800 dark:fill-zinc-200" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">E-mail</text>
          <text x="190" y="65" className="fill-zinc-400 dark:fill-zinc-500" fontSize="8" fontFamily="system-ui, sans-serif">Andamentos</text>
        </g>

        {/* ── Center hub (logo placeholder circle) ── */}
        <circle cx="200" cy="165" r="24" className="fill-zinc-800 dark:fill-zinc-200" />
        <circle cx="200" cy="165" r="23" className="fill-zinc-900 dark:fill-zinc-800" />

        {/* ── Task cards (bottom) ── */}
        {/* Left task */}
        <g>
          <rect x="50" y="250" width="90" height="42" rx="10" fill="white" stroke="#e4e4e7" strokeWidth="1" className="dark:fill-zinc-800 dark:[stroke:#3f3f46]" />
          <rect x="64" y="260" width="14" height="14" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" className="dark:fill-blue-900/40" />
          <polyline points="67,267 70,271 75,264" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="84" y="271" className="fill-zinc-700 dark:fill-zinc-300" fontSize="8" fontWeight="500" fontFamily="system-ui, sans-serif">Prazo</text>
        </g>

        {/* Center task */}
        <g>
          <rect x="155" y="250" width="90" height="42" rx="10" fill="white" stroke="#e4e4e7" strokeWidth="1" className="dark:fill-zinc-800 dark:[stroke:#3f3f46]" />
          <rect x="169" y="260" width="14" height="14" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" className="dark:fill-blue-900/40" />
          <polyline points="172,267 175,271 180,264" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="189" y="271" className="fill-zinc-700 dark:fill-zinc-300" fontSize="8" fontWeight="500" fontFamily="system-ui, sans-serif">Tarefa</text>
        </g>

        {/* Right task */}
        <g>
          <rect x="260" y="250" width="90" height="42" rx="10" fill="white" stroke="#e4e4e7" strokeWidth="1" className="dark:fill-zinc-800 dark:[stroke:#3f3f46]" />
          <rect x="274" y="260" width="14" height="14" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" className="dark:fill-blue-900/40" />
          <polyline points="277,267 280,271 285,264" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="294" y="271" className="fill-zinc-700 dark:fill-zinc-300" fontSize="8" fontWeight="500" fontFamily="system-ui, sans-serif">Alerta</text>
        </g>

        {/* ── Animated light traces ── */}

        {/* Email → Hub */}
        <circle r="4" fill="url(#flow-grad-down)" filter="url(#glow-strong)">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-email-to-hub" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#60a5fa" filter="url(#glow)">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-email-to-hub" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Hub → Left task */}
        <circle r="4" fill="url(#flow-grad-down)" filter="url(#glow-strong)">
          <animateMotion
            dur="2.8s"
            begin="1.2s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-hub-to-left" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#60a5fa" filter="url(#glow)">
          <animateMotion
            dur="2.8s"
            begin="1.2s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-hub-to-left" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
        </circle>

        {/* Hub → Center task */}
        <circle r="4" fill="url(#flow-grad-down)" filter="url(#glow-strong)">
          <animateMotion
            dur="2.5s"
            begin="1.4s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-hub-to-center" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.5s" begin="1.4s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#60a5fa" filter="url(#glow)">
          <animateMotion
            dur="2.5s"
            begin="1.4s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-hub-to-center" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.5s" begin="1.4s" repeatCount="indefinite" />
        </circle>

        {/* Hub → Right task */}
        <circle r="4" fill="url(#flow-grad-down)" filter="url(#glow-strong)">
          <animateMotion
            dur="2.8s"
            begin="1.6s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-hub-to-right" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" begin="1.6s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#60a5fa" filter="url(#glow)">
          <animateMotion
            dur="2.8s"
            begin="1.6s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#path-hub-to-right" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" begin="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* LogoIcon overlaid on the center hub */}
      <div className="pointer-events-none absolute" style={{ top: "51.5%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <LogoIcon size="size-5" />
      </div>
    </div>
  );
}
