import { useEffect, useRef } from 'react';

/**
 * Keeps a fixed-positioned element glued to the true visible bottom edge on
 * mobile browsers. Mobile Chrome/Safari collapse/expand their own toolbar as
 * the user scrolls, which shifts the *visual* viewport relative to the
 * *layout* viewport that `position: fixed` is computed against — the classic
 * symptom is a bottom bar that's hidden until the user scrolls a little.
 *
 * This writes the gap into the `--vvo-offset` CSS custom property (instead of
 * touching `transform` directly) so callers can combine it with their own
 * transform (e.g. horizontal centering) via `translateY(var(--vvo-offset, 0px))`.
 */
export function useVisualViewportOffset<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      if (!ref.current) return;
      const offset = window.innerHeight - (vv.height + vv.offsetTop);
      ref.current.style.setProperty('--vvo-offset', offset > 0.5 ? `-${offset}px` : '0px');
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return ref;
}

export default useVisualViewportOffset;
