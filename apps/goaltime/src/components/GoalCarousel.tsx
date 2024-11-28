"use client"

import { useEffect, useState } from "react";

import { cn } from "@/ui-components/utils"
import { Card } from "@/ui-components/card"
import { Carousel, CarouselMainContainer, SliderMainItem, SliderThumbItem, CarouselThumbsContainer, CarouselNext, CarouselPrevious } from "@/ui-components/carousel"

import { GoalCard } from "./GoalCard"
import { Goal } from "./GoalSettingsCard";

export interface GoalCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  goals: Goal[]
}

export function GoalCarousel({ goals, className }: GoalCarouselProps) {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("vertical");

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth < 1024 ? "horizontal" : "vertical");
    };

    updateOrientation(); // Set initial orientation
    window.addEventListener('resize', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return (
    <Card className={cn(className)}>
      <Carousel
        orientation={orientation}
        className="w-full h-full flex flex-col lg:flex-row items-center gap-2"
      >
        <CarouselNext className="lg:hidden" />
        <CarouselPrevious className="lg:hidden" />
        <div className="flex-grow w-full">
          <CarouselMainContainer className="h-[793px]">
            {goals.map((goal) => (
              <SliderMainItem
                key={goal.id}
                className="border border-muted flex items-center justify-center h-full rounded-md"
              >
                <GoalCard goal={goal} className="h-full w-full" />
              </SliderMainItem>
            ))}
          </CarouselMainContainer>
        </div>
        <CarouselThumbsContainer className="w-full lg:basis-1/4 lg:max-h-[793px]">
          {goals.map((goal, index) => (
            <SliderThumbItem
              key={goal.id}
              index={index}
              color={goal.color}
              className="rounded-md bg-transparent"
            >
              <span className="border border-muted flex items-center justify-center text-center h-full w-full rounded-md cursor-pointer bg-background">
                {goal.title}
              </span>
            </SliderThumbItem>
          ))}
        </CarouselThumbsContainer>
      </Carousel>
    </Card>
  )
}
