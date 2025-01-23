"use client"

import { useEffect, useState } from "react";

import { Carousel, CarouselMainContainer, SliderMainItem, SliderThumbItem, CarouselThumbsContainer, CarouselNext, CarouselPrevious } from "@/ui-components/carousel"

import { GoalCard } from "./GoalCard"
import { useValtio } from "./data/valtio";
import { useSnapshot } from "valtio";

export function GoalCarousel() {
  const { goalStore } = useValtio();
  if (!goalStore.goals) {
    throw new Error('Invariant: Goals not initialized before using GoalCarousel')
  }
  const goals = useSnapshot(goalStore.goals);
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
    <Carousel
      orientation={orientation}
      className="w-full h-full flex flex-col-reverse lg:flex-row items-center gap-2"
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
  )
}
