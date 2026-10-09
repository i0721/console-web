import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  ViewportReveal,
  ViewportRevealProvider,
} from '@community-go/surface-foundation/viewport-reveal';
import { MotionPolicyProvider } from '../host/motion-policy';

beforeEach(() => window.sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('server output preserves the full reading content without an animation visibility gate', () => {
  const markup = renderToString(
    <MotionPolicyProvider>
      <ViewportReveal>
        <button>available before observation</button>
      </ViewportReveal>
    </MotionPolicyProvider>,
  );
  expect(markup).toContain('available before observation');
  expect(markup).toContain('data-reveal-entry="false"');
  expect(markup).not.toMatch(/hidden|aria-hidden|inert|opacity/);
});

function observerHarness() {
  let callback: IntersectionObserverCallback;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();
  const Observer = vi.fn(function (next: IntersectionObserverCallback) {
    callback = next;
    return { observe, unobserve, disconnect };
  });
  vi.stubGlobal('IntersectionObserver', Observer);
  const view = render(
    <MotionPolicyProvider>
      <ViewportRevealProvider>
        <ViewportReveal>
          <button>first region</button>
        </ViewportReveal>
        <ViewportReveal>
          <button>second region</button>
        </ViewportReveal>
      </ViewportRevealProvider>
    </MotionPolicyProvider>,
  );
  const regions = [...view.container.querySelectorAll('.surface-viewport-reveal')];
  const notify = (index: number, intersecting: boolean, bottom = 1000) => {
    act(() =>
      callback(
        [
          {
            target: regions[index],
            isIntersecting: intersecting,
            boundingClientRect: { bottom },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
  };
  return { ...view, regions, notify, Observer, observe, unobserve, disconnect };
}

it('shares one observer and treats initially visible regions as stable content', () => {
  const { regions, notify, Observer, observe, unmount, disconnect } = observerHarness();
  expect(Observer).toHaveBeenCalledOnce();
  expect(Observer).toHaveBeenCalledWith(expect.any(Function), { rootMargin: '0px', threshold: 0 });
  expect(observe).toHaveBeenCalledTimes(2);
  notify(0, true);
  expect(regions[0]).toHaveAttribute('data-reveal', 'revealed');
  expect(regions[0]).toHaveAttribute('data-reveal-entry', 'false');
  expect(regions[1]).toHaveAttribute('data-reveal', 'pending');
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

it('only animates an outside-to-visible crossing and never replays on reverse scrolling', () => {
  const { regions, notify, unobserve } = observerHarness();
  notify(0, false);
  notify(0, true);
  expect(regions[0]).toHaveAttribute('data-reveal-entry', 'true');
  expect(unobserve).toHaveBeenCalledWith(regions[0]);
  fireEvent.focus(screen.getByRole('button', { name: 'first region' }));
  expect(regions[0]).toHaveAttribute('data-reveal-entry', 'false');
  notify(0, false);
  notify(0, true);
  expect(regions[0]).toHaveAttribute('data-reveal-entry', 'false');
});

it('completes a region skipped by a fast scroll without delayed animation', () => {
  const { regions, notify } = observerHarness();
  notify(0, false);
  notify(0, false, -100);
  expect(regions[0]).toHaveAttribute('data-reveal', 'revealed');
  expect(regions[0]).toHaveAttribute('data-reveal-entry', 'false');
});

it('focus makes pending content stable even when the observer never reports', () => {
  const { regions, unobserve } = observerHarness();
  fireEvent.focus(screen.getByRole('button', { name: 'second region' }));
  expect(regions[1]).toHaveAttribute('data-reveal', 'revealed');
  expect(regions[1]).toHaveAttribute('data-reveal-entry', 'false');
  expect(unobserve).toHaveBeenCalledWith(regions[1]);
});

it.each(['missing', 'constructor failure', 'observe failure'] as const)(
  'fails open with %s',
  (failure) => {
    vi.stubGlobal(
      'IntersectionObserver',
      failure === 'missing'
        ? undefined
        : function () {
            if (failure === 'constructor failure') throw new Error('observer unavailable');
            return {
              observe: () => {
                throw new Error('cannot observe');
              },
              unobserve: vi.fn(),
              disconnect: vi.fn(),
            };
          },
    );
    const { container } = render(
      <MotionPolicyProvider>
        <ViewportRevealProvider>
          <ViewportReveal>available content</ViewportReveal>
        </ViewportRevealProvider>
      </MotionPolicyProvider>,
    );
    expect(screen.getByText('available content')).toBeVisible();
    expect(container.querySelector('.surface-viewport-reveal')).toHaveAttribute(
      'data-reveal',
      'revealed',
    );
    expect(container.querySelector('.surface-viewport-reveal')).toHaveAttribute(
      'data-reveal-entry',
      'false',
    );
  },
);
