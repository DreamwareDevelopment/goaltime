import { Card } from "@/libs/ui-components/src/components/ui/card"
import { Carousel, CarouselMainContainer, SliderMainItem, SliderThumbItem, CarouselThumbsContainer } from "@/libs/ui-components/src/components/ui/carousel"

import { Goal, GoalCard } from "./GoalCard"

export interface GoalCarouselProps {
  goals: Goal[]
}

export function GoalCarousel({ goals }: GoalCarouselProps) {
  return (
    <Card className="md:col-span-2 overflow-hidden">
      <Carousel orientation="vertical" className="flex items-center gap-2">
        <div className="relative basis-3/4 ">
          <CarouselMainContainer className="h-[793px]">
            {goals.map((goal) => (
              <SliderMainItem
                key={goal.id}
                className="border border-muted flex items-center justify-center h-52 rounded-md"
              >
                <GoalCard goal={goal} />
              </SliderMainItem>
            ))}
          </CarouselMainContainer>
        </div>
        <CarouselThumbsContainer className="basis-1/4 max-h-[793px]">
          {goals.map((goal, index) => (
            <SliderThumbItem
              key={goal.id}
              index={index}
              color={goal.color}
              className="rounded-md bg-transparent"
            >
              <span className="border border-muted flex items-center justify-center h-full w-full rounded-md cursor-pointer bg-background">
                {goal.name}
              </span>
            </SliderThumbItem>
          ))}
          <SliderThumbItem
            key="new-goal"
            index={goals.length}
            className="rounded-md bg-accent"
            onButtonClick={() => {
              console.log("new goal")
            }}
          >
            <span className="border border-muted flex items-center justify-center h-full w-full rounded-md cursor-pointer bg-background">
              New Goal
            </span>
          </SliderThumbItem>
        </CarouselThumbsContainer>
      </Carousel>
    </Card>
  )
}
