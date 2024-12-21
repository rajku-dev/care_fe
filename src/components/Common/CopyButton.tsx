import { VariantProps } from "class-variance-authority";
import { useState } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button, buttonVariants } from "@/components/ui/button";
import { TooltipComponent, TooltipProvider } from "@/components/ui/tooltip";

import { copyToClipboard } from "@/Utils/utils";

export interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  content: string | undefined;
  tooltipContent?: string;
}

const CopyButton = ({
  content,
  tooltipContent = t("copy_to_clipboard"),
  children,
  size,
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation();

  if (content === undefined) return null;

  return (
    <TooltipProvider>
      <TooltipComponent
        content={isCopied ? t("copied_to_clipboard") : tooltipContent}
      >
        <Button
          variant="link"
          size={size}
          onClick={() => {
            copyToClipboard(content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
          }}
        >
          {children || (
            <CareIcon
              icon={isCopied ? "l-check" : "l-copy"}
              className="text-lg"
            />
          )}
        </Button>
      </TooltipComponent>
    </TooltipProvider>
  );
};

export default CopyButton;
