"use client";

import { cn } from "@/shared/lib/utils";
import { Check } from "lucide-react";
import {
  CAMPAIGN_STEPS,
  CAMPAIGN_STEP_LABELS,
  type CampaignStepValue,
} from "../constants";
import { glassCard, stepper } from "../styles";

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
        glassCard.base,
        glassCard.shadow,
        "rounded-2xl p-4",
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
                {isCompleted && <div className={stepper.glow} />}

                {/* Step indicator */}
                <div
                  className={cn(
                    stepper.step.base,
                    isCompleted && stepper.step.completed,
                    isCurrent && stepper.step.current,
                    !isCompleted && !isCurrent && stepper.step.upcoming,
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
                    stepper.label.base,
                    isCompleted && stepper.label.completed,
                    isCurrent && stepper.label.current,
                    !isCompleted && !isCurrent && stepper.label.upcoming,
                  )}
                >
                  {CAMPAIGN_STEP_LABELS[stepValue]}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    stepper.connector.base,
                    isCompleted ? stepper.connector.completed : stepper.connector.upcoming,
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
