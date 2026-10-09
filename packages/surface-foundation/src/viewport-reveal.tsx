'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useMotionPolicy } from './motion-policy-context';

type RevealCallback = (animate: boolean) => void;
type RevealRegistrar = (element: HTMLElement, reveal: RevealCallback) => () => void;

type RevealRegistration = { reveal: RevealCallback; seenOutside: boolean };
const ViewportRevealContext = createContext<RevealRegistrar | null>(null);

export function ViewportRevealProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { resolvedMode, categories } = useMotionPolicy();
  const callbacksRef = useRef(new Map<Element, RevealRegistration>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerUnavailableRef = useRef(false);
  const revealImmediately = resolvedMode !== 'full' || !categories.reveal;

  useEffect(() => {
    const showAll = () => {
      for (const { reveal } of callbacksRef.current.values()) reveal(false);
      callbacksRef.current.clear();
    };
    if (revealImmediately || typeof IntersectionObserver === 'undefined') {
      showAll();
      return;
    }

    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const registration = callbacksRef.current.get(entry.target);
            if (!registration) continue;
            // 初次已可见（首屏、锚点、恢复位置）不重播。快速越过的区域直接完成。
            if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) {
              registration.seenOutside = true;
              continue;
            }
            registration.reveal(entry.isIntersecting && registration.seenOutside);
            callbacksRef.current.delete(entry.target);
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: '0px', threshold: 0 },
      );
    } catch {
      observerUnavailableRef.current = true;
      showAll();
      return;
    }
    observerUnavailableRef.current = false;
    observerRef.current = observer;
    for (const [element, registration] of callbacksRef.current) {
      try {
        observer.observe(element);
      } catch {
        registration.reveal(false);
        callbacksRef.current.delete(element);
      }
    }
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [revealImmediately]);

  const register = useCallback<RevealRegistrar>(
    (element, reveal) => {
      if (
        revealImmediately ||
        observerUnavailableRef.current ||
        typeof IntersectionObserver === 'undefined'
      ) {
        reveal(false);
        return () => undefined;
      }
      callbacksRef.current.set(element, { reveal, seenOutside: false });
      try {
        observerRef.current?.observe(element);
      } catch {
        callbacksRef.current.delete(element);
        reveal(false);
      }
      return () => {
        if (callbacksRef.current.delete(element)) observerRef.current?.unobserve(element);
      };
    },
    [revealImmediately],
  );

  return <ViewportRevealContext value={register}>{children}</ViewportRevealContext>;
}

/** 显式 below-fold Region 的可选增强；内容默认可见，不由 Observer 决定可用性。 */
export function ViewportReveal({ children }: Readonly<{ children: ReactNode }>) {
  const register = useContext(ViewportRevealContext);
  const { resolvedMode, categories } = useMotionPolicy();
  const [entry, setEntry] = useState<'pending' | 'visible' | 'revealed'>(
    resolvedMode !== 'full' || !categories.reveal ? 'visible' : 'pending',
  );
  const revealed = entry !== 'pending';
  const cleanupRef = useRef<(() => void) | null>(null);

  const setElement = useCallback(
    (element: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!element || revealed) return;
      if (!register) {
        setEntry('visible');
        return;
      }
      cleanupRef.current = register(element, (animate) =>
        setEntry(animate ? 'revealed' : 'visible'),
      );
    },
    [register, revealed],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <div
      className="surface-viewport-reveal"
      data-motion-recipe="reveal"
      data-reveal={revealed ? 'revealed' : 'pending'}
      data-reveal-entry={entry === 'revealed' ? 'true' : 'false'}
      onFocusCapture={() => setEntry('visible')}
      ref={setElement}
    >
      {children}
    </div>
  );
}
