import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";
import { Provider as JotaiProvider } from "jotai";
import { PostHogProvider } from "../components/data/posthog";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <PostHogProvider>
      <NextThemesProvider {...themeProps}>
        <JotaiProvider>{children}</JotaiProvider>
      </NextThemesProvider>
    </PostHogProvider>
  );
}
