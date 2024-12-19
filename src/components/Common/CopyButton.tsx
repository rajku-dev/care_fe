import { useState } from "react";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { TooltipComponent, TooltipProvider } from "@/components/ui/tooltip";

import { copyToClipboard } from "@/Utils/utils";

interface CopyButtonProps {
  content: string;
  tooltipContent?: string;
  btnContent?: string;
  resetDuration?: number;
  iconClassName?: string;
  btnClassName?: string;
  icons?: {
    copied: IconName;
    copy: IconName;
  };
}

const CopyButton = ({
  content,
  tooltipContent = "Copy to clipboard",
  btnContent = "",
  resetDuration = 2500,
  iconClassName = "text-lg",
  btnClassName = "",
  icons = { copied: "l-check", copy: "l-copy" },
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <TooltipProvider>
      <TooltipComponent content={isCopied ? "Copied!" : tooltipContent}>
        <button
          onClick={() => {
            copyToClipboard(content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), resetDuration);
          }}
          className={btnClassName}
        >
          {btnContent ? (
            btnContent
          ) : (
            <CareIcon
              icon={isCopied ? icons.copied : icons.copy}
              className={iconClassName}
            />
          )}
        </button>
      </TooltipComponent>
    </TooltipProvider>
  );
};

export default CopyButton;
