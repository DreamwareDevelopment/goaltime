// components/CircularGauge.tsx
import { Goal } from '@prisma/client';
import React, { useState } from 'react';

interface CircularGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  goals: Goal[];
  size: number;
  duration?: string;
  delay?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ goals, size, className, delay = 1000 }) => {
  const totalCommitment = goals.reduce((sum, goal) => sum + (goal.commitment || goal.estimate || 0), 0);
  const circumference = 2 * Math.PI * ((size / 2) - 20);
  const [hoveredGoal, setHoveredGoal] = useState<Goal | null>(null);
  const [currentSegment, setCurrentSegment] = useState<number>(-1); // Track the current segment being animated
  const [animationTriggered, setAnimationTriggered] = useState<boolean>(false); // Track if animation has been triggered

  // Function to animate segments
  const animateSegments = () => {
    if (!animationTriggered) {
      setAnimationTriggered(true); // Mark animation as triggered
      setTimeout(() => { // Add a short delay before starting the animation
        goals.forEach((_, index) => {
          setTimeout(() => {
            setCurrentSegment(index);
          }, index * 500 - 200); // Adjust the delay as needed
        });
      }, delay); // Initial delay to prevent flickering
    }
  };

  React.useEffect(() => {
    animateSegments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  const handleMouseEnter = (goal: Goal) => {
    setHoveredGoal(goal);
  };

  const handleMouseLeave = () => {
    setHoveredGoal(null);
  };

  const getFontSize = (text: string) => {
    const maxLength = 20;
    const minFontSize = 16;
    const maxFontSize = 24;
    const length = text.length;
    const fontSize = Math.max(minFontSize, maxFontSize - (length - maxLength) * 0.5);
    return fontSize;
  };


  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {goals.map((goal, index) => {
        const startAngle = index === 0 ? 0 : goals.slice(0, index).reduce((sum, prevGoal) => sum + (prevGoal.commitment || prevGoal.estimate || 0), 0) / totalCommitment * circumference;
        const endAngle = startAngle + (((goal.commitment || goal.estimate || 0) / totalCommitment) * circumference);
        const completedAngle = startAngle + (((goal.completed || 0) / totalCommitment) * circumference);

        return (
          <g key={goal.id}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size / 2) - 20}
              fill="transparent"
              stroke={goal.color}
              strokeOpacity={hoveredGoal === goal ? 0.7 : 1}
              strokeWidth="35"
              strokeDasharray={`${currentSegment >= index ? endAngle - startAngle - 8 : 0} ${circumference}`} // Animate the segment
              strokeDashoffset={-startAngle}
              transform={`rotate(-90, ${size / 2}, ${size / 2})`} // Rotate each circle
              onMouseEnter={() => handleMouseEnter(goal)}
              onMouseLeave={handleMouseLeave}
              style={{ transition: 'stroke-dasharray 0.5s ease' }} // Smooth transition
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size / 2) - 20}
              fill="transparent"
              stroke="black"
              strokeOpacity={0.3}
              strokeWidth="35"
              strokeDasharray={`${currentSegment >= index ? endAngle - startAngle - 8 : 0} ${circumference}`} // Animate the segment
              strokeDashoffset={-completedAngle}
              transform={`rotate(-90, ${size / 2}, ${size / 2})`} // Rotate each circle
              onMouseEnter={() => handleMouseEnter(goal)}
              onMouseLeave={handleMouseLeave}
              style={{ transition: 'stroke-dasharray 0.5s ease' }} // Smooth transition
            />
          </g>
        );
      })}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size / 2) - 20}
        fill="hsl(var(--background))"
        onMouseEnter={handleMouseLeave}
      />
      <foreignObject x={0} y={0} width={size} height={size} pointerEvents="none">
        <div className="w-full p-8 h-full flex flex-col items-center justify-center text-center font-bold gap-2">
          <p style={{ fontSize: hoveredGoal ? getFontSize(hoveredGoal.title) : 48 }}>{hoveredGoal ? hoveredGoal.title : `${goals.length} Goal${goals.length > 1 ? 's' : ''}`}</p>
          <p className="text-lg sm:text-xs text-muted-foreground">{hoveredGoal ? 'Goal' : 'Total'}: {hoveredGoal ? parseFloat((hoveredGoal.commitment || hoveredGoal.estimate || 0).toFixed(2)).toString() : goals.reduce((sum, goal) => sum + (goal.commitment || goal.estimate || 0), 0)} hours</p>
          <p className={hoveredGoal ? 'text-lg sm:text-xs text-muted-foreground' : 'hidden'}>Completed: {hoveredGoal ? parseFloat((hoveredGoal.completed || 0).toFixed(2)).toString() : goals.reduce((sum, goal) => sum + (goal.completed || 0), 0)} hours</p>
        </div>
      </foreignObject>
    </svg>
  );
};

export default CircularGauge;