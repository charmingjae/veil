import { cn } from "cn";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";

type SpinnerProps = React.ComponentProps<"svg">;

export const Spinner = ({ className, ...props }: SpinnerProps) => {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      // Ours: the label is in the language users see.
      aria-label="처리 중"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
};
