import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDemoTour } from "@/hooks/useDemoTour";
import { Button } from "@/components/ui/button";

interface Position {
  top: number;
  left: number;
  spotlightRect: DOMRect | null;
}

export function TourTooltip() {
  const { isActive, currentStep, totalSteps, currentStepData, nextStep, prevStep, endTour } =
    useDemoTour();
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    spotlightRect: null,
  });

  const calculatePosition = useCallback(() => {
    if (!currentStepData) return;

    const target = document.querySelector(currentStepData.target);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 200;
    const gap = 12;
    const padding = 8;

    let top = 0;
    let left = 0;

    switch (currentStepData.placement) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setPosition({ top, left, spotlightRect: rect });
  }, [currentStepData]);

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // Scroll target into view if needed
    const target = document.querySelector(currentStepData.target);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      // Delay position calc to let scroll finish
      const timer = setTimeout(calculatePosition, 300);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStepData, calculatePosition]);

  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => calculatePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, calculatePosition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, endTour, nextStep, prevStep]);

  if (!isActive || !currentStepData || !position.spotlightRect) return null;

  const { spotlightRect } = position;
  const spotPad = 6;

  return createPortal(
    <>
      {/* Clickable overlay to dismiss */}
      <div
        className="tour-overlay"
        onClick={endTour}
      />

      {/* Spotlight cutout */}
      <div
        className="tour-spotlight"
        style={{
          top: spotlightRect.top - spotPad,
          left: spotlightRect.left - spotPad,
          width: spotlightRect.width + spotPad * 2,
          height: spotlightRect.height + spotPad * 2,
        }}
      />

      {/* Tooltip */}
      <div
        className="tour-tooltip"
        style={{
          top: position.top,
          left: position.left,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-primary font-semibold mb-1">
          Step {currentStep + 1} of {totalSteps}
        </p>
        <h3 className="font-display font-semibold text-base mb-2">
          {currentStepData.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {currentStepData.description}
        </p>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={endTour}>
            Skip
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                Previous
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
