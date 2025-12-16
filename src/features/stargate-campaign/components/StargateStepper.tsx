"use client";

import { cn } from "@/shared/lib/utils";
import { Check } from "lucide-react";
import {
  CAMPAIGN_STEPS,
  CAMPAIGN_STEP_LABELS,
  type CampaignStepValue,
} from "../constants";

interface StargateStepperProps {
  /** Current step in the campaign (1-5) */
  currentStep: CampaignStepValue;
  /** Whether to show the stepper */
  visible?: boolean;
  className?: string;
}

export function StargateStepper({
  currentStep,
  visible = true,
  className,
}: StargateStepperProps) {
  const steps = Object.values(CAMPAIGN_STEPS) as CampaignStepValue[];

  return (
    <nav
      aria-label="Campaign progress"
      aria-hidden={!visible}
      className={cn(
        // Liquid glass effect
        "rounded-2xl p-4",
        "bg-surface/70 backdrop-blur-xl",
        "border border-primary/5",
        "shadow-lg shadow-brand/5",
        // Hide content but keep space
        !visible && "pointer-events-none opacity-0",
        className,
      )}
    >
      <p className="text-secondary mb-4 text-center text-xs font-medium uppercase tracking-wide">
        Getting Started
      </p>
      <ol className="flex items-center justify-center">
        {steps.map((stepValue, index) => {
          const isCompleted = stepValue < currentStep;
          const isCurrent = stepValue === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={stepValue} className="flex items-center">
              {/* Step with label */}
              <div className="relative flex flex-col items-center">
                {/* Outer glow for completed steps */}
                {isCompleted && (
                  <div className="absolute h-8 w-8 animate-pulse rounded-full bg-brand/20 blur-md" />
                )}

                {/* Step indicator */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                    "transition-all duration-300",
                    isCompleted && [
                      "bg-brand",
                      "shadow-[0_0_20px_4px] shadow-brand/40",
                      "ring-2 ring-brand/30 ring-offset-2 ring-offset-transparent",
                    ],
                    isCurrent && [
                      "border-2 border-brand",
                      "bg-surface",
                      "shadow-lg shadow-brand/20",
                    ],
                    !isCompleted &&
                    !isCurrent && [
                      "border border-primary/10",
                      "bg-surface-alt/50",
                    ],
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isCurrent ? "text-brand" : "text-secondary",
                      )}
                    >
                      {stepValue}
                    </span>
                  )}
                </div>

                {/* Step label - only show on larger screens */}
                <span
                  className={cn(
                    "mt-2 hidden text-center text-[10px] font-medium sm:block",
                    "max-w-20 leading-tight",
                    isCompleted && "text-brand",
                    isCurrent && "text-primary",
                    !isCompleted && !isCurrent && "text-secondary",
                  )}
                >
                  {CAMPAIGN_STEP_LABELS[stepValue]}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-12 sm:w-20",
                    isCompleted
                      ? "bg-brand"
                      : "bg-primary/10",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Current step description - mobile */}
      <p className="text-secondary mt-4 text-center text-xs sm:hidden">
        Step {currentStep}: {CAMPAIGN_STEP_LABELS[currentStep]}
      </p>
    </nav>
  );
}
