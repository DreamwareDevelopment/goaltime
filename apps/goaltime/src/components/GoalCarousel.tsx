'use client';

import { cn } from "@/libs/ui-components/src/utils"
import { Card } from "@/libs/ui-components/src/components/ui/card"
import { Carousel, CarouselMainContainer, SliderMainItem, SliderThumbItem, CarouselThumbsContainer, CarouselNext, CarouselPrevious } from "@/libs/ui-components/src/components/ui/carousel"

import { GoalCard } from "./GoalCard"
import { Goal } from "./GoalSetupCard";
import { useState } from "react";
import { useEffect } from "react";

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
        <CarouselNext />
        <CarouselPrevious />
        <div className="flex-grow w-full">
          <CarouselMainContainer className="h-[793px]">
            {goals.map((goal) => (
              <SliderMainItem
                key={goal.id}
                className="border border-muted flex items-center justify-center h-52 rounded-md"
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
