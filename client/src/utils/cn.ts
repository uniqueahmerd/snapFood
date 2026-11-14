import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge has no access to `tailwind.config.js`, so it classifies classes
 * by pattern. Anything it cannot parse as a size falls through to a catch-all
 * that treats `text-*` as a **colour** — which means our custom font-size scale
 * (`text-h2`, `text-body-sm`, …) gets filed in the same conflict group as
 * a text color, and merging the two silently deletes the earlier one.
 *
 * That is not theoretical. `buttonStyles` composes `cn(BASE, VARIANT, SIZE)`,
 * the variant carries the text colour and the size carries the font size, so
 * with the default config every primary button lost its text color, every ghost
 * button lost `text-text-secondary`, and every link button lost `text-info`.
 * Nothing errors — the colour just quietly goes missing.
 *
 * Teaching the merger our scales fixes that class of bug at the root. The lists
 * below mirror `tailwind.config.js`; anything added there should be added here.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // Layout tokens usable anywhere Tailwind reads the spacing scale —
      // p-*, m-*, gap-*, w-*, h-*, inset-*. Without these, `w-sidebar` and
      // `w-full` are two unrelated classes and both survive a merge.
      spacing: ['gutter', 'sidebar', 'sidebar-rail', 'navbar', 'reader'],
    },
    classGroups: {
      // The important one: keeps font size and text colour in separate groups.
      'font-size': [
        {
          text: [
            'display-lg',
            'display-sm',
            'h1',
            'h2',
            'h3',
            'body',
            'body-sm',
            'caption',
            'label-caps',
            'code-md',
          ],
        },
      ],
      'max-w': [{ 'max-w': ['container', 'reader'] }],
      shadow: [{ shadow: ['elevated', 'glow', 'glow-success', 'glow-warning'] }],
      animate: [
        {
          animate: [
            'fade-in',
            'slide-up',
            'slide-down',
            'scale-in',
            'shimmer',
            'bounce-dot',
          ],
        },
      ],
    },
  },
});

/**
 * Merge conditional class names, letting later Tailwind utilities win over
 * earlier conflicting ones.
 *
 *   cn('px-2 py-1', isLarge && 'px-4')  ->  'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
