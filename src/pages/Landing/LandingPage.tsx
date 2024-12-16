import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DistrictModel, LocalBodyModel } from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { RequestResult } from "@/Utils/request/types";

const { mainLogo } = careConfig;

const STATE_ID = "1"; // Kerala's state ID

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictModel | null>(null);

  const { data: districtsResponse } = useQuery<RequestResult<DistrictModel[]>>({
    queryKey: ["districts", STATE_ID],
    queryFn: () =>
      request(routes.getDistrictByState, {
        pathParams: { id: STATE_ID },
      }),
  });

  const districts = districtsResponse?.data || [];

  const filteredDistricts = districts.filter((district) =>
    district.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedDistrict(null);
    setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (selectedDistrict) {
      setSearchQuery(selectedDistrict.name);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainer = document.querySelector("[data-search-container]");

      if (!searchContainer?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDistrict) {
      params.append("district", selectedDistrict.id.toString());
    }
    navigate(`/facilities?${params.toString()}`);
  };

  const handleDistrictSelect = (value: string) => {
    const district = districts.find(
      (d) => d.name.toLowerCase() === value.toLowerCase(),
    );
    console.log(district);
    if (district) {
      setSelectedDistrict(district);
      setSearchQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full p-4">
        <div className="flex justify-end items-center">
          <Button
            variant="ghost"
            className="text-sm font-medium hover:bg-gray-100 rounded-full px-6"
            onClick={() => navigate("/login")}
          >
            Sign in
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-24">
        {/* Logo Section */}
        <div className="mb-8">
          <img src={mainLogo?.dark} alt="Care Logo" className="h-24 w-auto" />
        </div>

        {/* Search Section */}
        <div className="w-full max-w-[584px] mx-auto space-y-6">
          <div className="relative" data-search-container>
            <div className="rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center px-4 h-12">
                <CareIcon icon="l-search" className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={selectedDistrict ? selectedDistrict.name : searchQuery}
                  onChange={handleSearchChange}
                  onClick={handleInputClick}
                  placeholder="Search districts..."
                  className="flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500 cursor-pointer shadow-none ring-0"
                />
                {(searchQuery || selectedDistrict) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      setSelectedDistrict(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <CareIcon
                      icon="l-times"
                      className="h-4 w-4 text-gray-400"
                    />
                  </button>
                )}
              </div>
            </div>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-white shadow-lg z-10">
                <Command>
                  <CommandGroup className="overflow-y-auto max-h-80">
                    {filteredDistricts.length === 0 ? (
                      <CommandEmpty>No district found.</CommandEmpty>
                    ) : (
                      filteredDistricts.map((district) => (
                        <CommandItem
                          key={district.id}
                          value={district.name.toLowerCase()}
                          onSelect={() => {
                            handleDistrictSelect(district.name);
                          }}
                          className="cursor-pointer"
                        >
                          {district.name}
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </Command>
              </div>
            )}
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              className="px-6 h-10"
              onClick={handleSearch}
              disabled={!selectedDistrict}
            >
              Search Facilities
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}