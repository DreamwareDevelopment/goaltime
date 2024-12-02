import React from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { HomeButton } from '../../components/ActionButtons/HomeButton'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export interface ErrorPageProps {
  searchParams: Promise<{ error?: string, solution?: string, next?: string }>
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { error, solution, next } = await searchParams

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Oops! Something went wrong.</CardTitle>
          <CardDescription>{error ?? 'We can\'t find the page you\'re looking for.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-center">
              {solution ?? 'Please try again after navigating back to the homepage.'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center space-y-6 px-4 md:w-[70%]">
            <HomeButton href={next ?? '/'} text="Go to Homepage" className="w-full" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? <a href="mailto:support@goaltime.ai" className="text-primary hover:underline">Contact support</a>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}