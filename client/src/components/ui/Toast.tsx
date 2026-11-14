import { Toaster } from 'react-hot-toast';

import { UI_COLORS } from '@/theme/colors';

/**
 * Global toast host.
 *
 * Mounted once in `App`. Every toast in the app is raised through
 * `@/utils/notify` rather than by calling `react-hot-toast` directly, so this is
 * the only place its appearance is configured.
 *
 * The palette is set here rather than via Tailwind classes because the library
 * renders its own container element outside the React tree that Tailwind's
 * `content` scan would still cover — but the icon colours are only settable as
 * theme values.
 */
export function ToastHost() {
  return (
    <Toaster
      position="bottom-right"
      gutter={10}
      containerClassName="!z-[100]"
      toastOptions={{
        duration: 4000,
        className:
          '!bg-elevated !text-text-primary !border !border-border !rounded-lg !text-body-sm !shadow-elevated !max-w-md',
        success: {
          iconTheme: { primary: UI_COLORS.success, secondary: UI_COLORS.textPrimary },
        },
        error: {
          duration: 6000,
          iconTheme: { primary: UI_COLORS.error, secondary: UI_COLORS.textPrimary },
        },
        loading: {
          iconTheme: { primary: UI_COLORS.primary, secondary: UI_COLORS.surface },
        },
      }}
    />
  );
}
