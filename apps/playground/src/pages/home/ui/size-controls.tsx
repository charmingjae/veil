import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { NumberInput } from "@/shared/ui/number-input";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar";

interface SizeControlsProps {
  /** In pixels; `null` follows the content's own size. */
  width: number | null;
  height: number | null;
  onWidthChange: (width: number | null) => void;
  onHeightChange: (height: number | null) => void;
}

// The control panel for the size of the content under `Veil`, which the veil follows.
export const SizeControls = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
}: SizeControlsProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Size</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-3 px-2">
        <FieldDescription>
          The size of the content under the veil, which the veil follows. Leave empty to fit the
          content.
        </FieldDescription>
        <div className="flex gap-3">
          <Field>
            <FieldLabel htmlFor="content-width">Width</FieldLabel>
            <NumberInput
              id="content-width"
              value={width}
              onChange={onWidthChange}
              min={1}
              formatted={false}
              placeholder="Auto"
              suffix="px"
              className="bg-background"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="content-height">Height</FieldLabel>
            <NumberInput
              id="content-height"
              value={height}
              onChange={onHeightChange}
              min={1}
              formatted={false}
              placeholder="Auto"
              suffix="px"
              className="bg-background"
            />
          </Field>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
