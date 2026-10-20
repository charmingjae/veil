import { cn } from "cn";

type SkeletonProps = React.ComponentProps<"div">;

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
};
