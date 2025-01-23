import { Skeleton } from "@/ui-components/skeleton"

export const WelcomeSkeleton = () => {
  return (
    <div id="skeleton" className="h-full w-full flex flex-col justify-center items-center gap-4 pt-6 px-1 sm:px-6">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-[128px] sm:h-[180px] w-[60%]" />
      <Skeleton className="h-[33px] sm:h-[52px] w-full mt-9" />
      <div className="flex flex-wrap gap-4 space-y-9 sm:space-y-0 mt-8 w-full justify-start items-center">
        <Skeleton className="h-[33px] sm:h-[52px] w-[251px]" />
        <Skeleton className="h-[33px] sm:h-[52px] w-[245px]" />
      </div>
      <div className="flex flex-wrap gap-4 space-y-9 sm:space-y-0 mt-9 w-full justify-start items-center">
        <Skeleton className="h-[33px] sm:h-[52px] w-[200px]" />
        <Skeleton className="h-[33px] sm:h-[52px] w-[200px] md:ml-12" />
      </div>
      <div className="flex sm:flex-wrap gap-4 mt-9 w-full justify-start items-center">
        <Skeleton className="h-[33px] sm:h-[52px] w-[200px]" />
      </div>
    </div>
  )
}
