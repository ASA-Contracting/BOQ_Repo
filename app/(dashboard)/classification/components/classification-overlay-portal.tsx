'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';

const bodyPortal = Symbol('body-portal');

type PortalContainer = RefObject<HTMLElement | null> | typeof bodyPortal;

const ClassificationOverlayPortalContext = createContext<PortalContainer>(bodyPortal);

export function ClassificationOverlayPortalTarget({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  return (
    <ClassificationOverlayPortalContext.Provider value={containerRef}>
      {children}
    </ClassificationOverlayPortalContext.Provider>
  );
}

export function useClassificationOverlayPortalElement(): HTMLElement | null {
  const container = useContext(ClassificationOverlayPortalContext);
  const [element, setElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (container === bodyPortal) {
      setElement(document.body);
      return;
    }

    setElement(container.current);
  });

  return element;
}
