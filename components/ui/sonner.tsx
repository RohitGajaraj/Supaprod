import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      // Sonner hardcodes its own huge z-index in its stylesheet; the inline style
      // pins the container to the design system's toast band instead so it stacks
      // correctly against menus/modals/tooltips.
      style={{ zIndex: "var(--ds-z-toast)" } as React.CSSProperties}
      toastOptions={{
        classNames: {
          // Menu material: the floating transient surface preset (12px radius,
          // background-100 fill, menu shadow) with an explicit gray-400 border.
          // group-[.toaster] keeps specificity above sonner's default styles.
          toast:
            "group toast group-[.toaster]:bg-(--ds-background-100) group-[.toaster]:text-(--ds-gray-1000) group-[.toaster]:border group-[.toaster]:border-(--ds-gray-400) group-[.toaster]:rounded-(--ds-radius-medium) group-[.toaster]:shadow-(--ds-shadow-menu)",
          title: "text-label-14 group-[.toast]:text-(--ds-gray-1000)",
          description: "text-copy-14 group-[.toast]:text-(--ds-gray-900)",
          // Neutral high-contrast invert action, matching the button contract's
          // default variant; cancel stays a quiet gray step.
          actionButton:
            "group-[.toast]:bg-(--ds-gray-1000) group-[.toast]:text-(--ds-background-100)",
          cancelButton: "group-[.toast]:bg-(--ds-gray-200) group-[.toast]:text-(--ds-gray-900)",
          // Status accent lives on the leading icon only (700-step semantic roles);
          // the surface itself stays neutral so stacked toasts read calmly.
          success: "[&_[data-icon]]:text-(--ds-green-700)",
          warning: "[&_[data-icon]]:text-(--ds-amber-700)",
          error: "[&_[data-icon]]:text-(--ds-red-700)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
