import { useEffect, useState } from "react";

export function useRerender() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // this forces a rerender
    setHydrated(true)
  }, [])
  return hydrated
}
