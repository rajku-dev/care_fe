import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { Code, ValueSetSystem } from "@/types/questionnaire/code";

interface Props {
  system: ValueSetSystem;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  noResultsMessage?: string;
  disabled?: boolean;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  noResultsMessage = "No results found",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  const searchQuery = useQuery(routes.valueset.expand, {
    pathParams: { system },
    body: { count: 10 },
    prefetch: false,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between truncate"
        >
          {value?.display || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command filter={() => 1}>
          <CommandInput
            placeholder={placeholder}
            className="outline-none border-none ring-0 shadow-none"
            onValueChange={(search) =>
              searchQuery.refetch({ body: { search } })
            }
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery.loading ? "Loading..." : noResultsMessage}
            </CommandEmpty>
            <CommandGroup>
              {searchQuery.data?.results.map((option) => (
                <CommandItem
                  key={option.code}
                  value={option.code}
                  onSelect={() => {
                    onSelect({
                      code: option.code,
                      display: option.display || "",
                      system: option.system || "",
                    });
                    setOpen(false);
                  }}
                >
                  <span>{option.display}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}