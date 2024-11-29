'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui-components/card"
import { HomeButton } from '../../components/ActionButtons/HomeButton'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export default function ErrorPage() {

  const handleGoHome = () => {
    window.location.href = '/';
  };
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Oops! Something went wrong.</CardTitle>
          <CardDescription>We can&apos;t find the page you&apos;re looking for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-center">
              Please try navigating back to the homepage.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center space-y-6 px-4 md:w-[70%]">
            <HomeButton text="Go to Homepage" className="w-full" onClick={handleGoHome} />
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