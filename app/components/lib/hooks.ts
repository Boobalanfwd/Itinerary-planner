import { useEffect, useRef, useState } from "react";

/**
 * Custom Hook for Intersection Observer (Scroll Animations)
 */
export const useOnScreen = (
  options: IntersectionObserverInit
): [React.RefObject<HTMLDivElement | null>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasTriggered) {
        setIsVisible(true);
        setHasTriggered(true);
        observer.disconnect();
      }
    }, options);

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options, hasTriggered]);

  return [ref, isVisible];
};
