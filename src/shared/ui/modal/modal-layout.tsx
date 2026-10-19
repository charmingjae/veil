import { cn } from "cn";
import type { ReactNode } from "react";

import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  type DialogPosition,
  DialogTitle,
} from "@/shared/ui/dialog";

/** Which parts stay put while the rest scrolls when the content is taller than the screen. */
export type ModalFixed = "both" | "header" | "footer" | "none";

export interface ModalLayoutProps {
  /** Top. Any JSX. */
  title?: ReactNode;
  description?: ReactNode;
  /** Content. Any JSX: a form, a table, a component with its own state. */
  children?: ReactNode;
  /** Bottom. Any JSX, usually buttons; lay it out with `classNames.footer`. */
  footer?: ReactNode;
  /** One of nine places, like toasts. Defaults to `center`. */
  position?: DialogPosition;
  /** ✕ in the top right. Defaults to `true`. */
  showCloseButton?: boolean;
  /** Defaults to `both`: only the content scrolls. */
  fixed?: ModalFixed;
  /** The whole modal, e.g. its width: `sm:max-w-lg`. */
  className?: string;
  /** Tailwind classes for each part, e.g. `footer: "*:flex-1"` for equal-width buttons. */
  classNames?: {
    header?: string;
    title?: string;
    description?: string;
    body?: string;
    footer?: string;
  };
}

/**
 * The usual shape of a modal: top, content, bottom. Only what Tailwind cannot do with one class
 * is a prop (position, close button, which parts scroll); everything else is `className`.
 */
export const ModalLayout = ({
  title,
  description,
  children,
  footer,
  position,
  showCloseButton = true,
  fixed = "both",
  className,
  classNames,
}: ModalLayoutProps) => {
  const header = (title || description) && (
    <DialogHeader className={classNames?.header}>
      {title && <DialogTitle className={classNames?.title}>{title}</DialogTitle>}
      {description && (
        <DialogDescription className={classNames?.description}>{description}</DialogDescription>
      )}
    </DialogHeader>
  );
  const footerPart = footer && <DialogFooter className={classNames?.footer}>{footer}</DialogFooter>;
  const isHeaderFixed = fixed === "both" || fixed === "header";
  const isFooterFixed = fixed === "both" || fixed === "footer";

  return (
    <DialogContent position={position} showCloseButton={showCloseButton} className={className}>
      {isHeaderFixed && header}
      {/* No empty scroll area when there is nothing to scroll (e.g. a question with buttons). */}
      {(children || !isHeaderFixed || !isFooterFixed) && (
        <DialogBody className={cn("flex flex-col gap-6", classNames?.body)}>
          {!isHeaderFixed && header}
          {children}
          {!isFooterFixed && footerPart}
        </DialogBody>
      )}
      {isFooterFixed && footerPart}
    </DialogContent>
  );
};
