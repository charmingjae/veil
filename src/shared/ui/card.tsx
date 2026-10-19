import { cn } from "cn";
import type * as React from "react";

type CardProps = React.ComponentProps<"div"> & { size?: "default" | "sm" };

export const Card = ({ className, size = "default", ...props }: CardProps) => {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-card-foreground text-sm shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className,
      )}
      {...props}
    />
  );
};

type CardHeaderProps = React.ComponentProps<"div">;

export const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
};

type CardTitleProps = React.ComponentProps<"div">;

export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading font-medium text-base leading-normal group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
};

type CardDescriptionProps = React.ComponentProps<"div">;

export const CardDescription = ({ className, ...props }: CardDescriptionProps) => {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
};

type CardActionProps = React.ComponentProps<"div">;

export const CardAction = ({ className, ...props }: CardActionProps) => {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
};

type CardContentProps = React.ComponentProps<"div">;

export const CardContent = ({ className, ...props }: CardContentProps) => {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-col gap-3 px-(--card-spacing)", className)}
      {...props}
    />
  );
};

type CardFooterProps = React.ComponentProps<"div">;

export const CardFooter = ({ className, ...props }: CardFooterProps) => {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
};
