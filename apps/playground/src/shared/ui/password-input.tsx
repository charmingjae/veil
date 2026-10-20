"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

type PasswordInputProps = Omit<ComponentProps<typeof InputGroupInput>, "type">;

export const PasswordInput = ({ className, disabled, ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputGroup data-disabled={disabled} className={className}>
      <InputGroupInput type={isVisible ? "text" : "password"} disabled={disabled} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={isVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
          disabled={disabled}
          onClick={() => setIsVisible((prev) => !prev)}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
