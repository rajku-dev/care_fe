import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

interface LocationSelectProps {
  name: string;
  disabled?: boolean;
  margin?: string;
  errors?: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityId: string;
  showAll?: boolean;
  selected: string | string[] | null;
  setSelected: (selected: string | string[] | null) => void;
  errorClassName?: string;
  bedIsOccupied?: boolean;
  disableOnOneOrFewer?: boolean;
}

export const LocationSelect = (props: LocationSelectProps) => {
  const { data, loading } = useTanStackQueryInstead(
    routes.listFacilityAssetLocation,
    {
      query: {
        limit: 14,
        bed_is_occupied:
          props.bedIsOccupied === undefined ? undefined : !props.bedIsOccupied,
      },
      pathParams: {
        facility_external_id: props.facilityId,
      },
      prefetch: props.facilityId !== undefined,
    },
  );

  if (props.disableOnOneOrFewer && data && data.count <= 1) {
    props = { ...props, disabled: true };
  }

  const handleSelectChange = (value: string) => {
    props.setSelected(value);
  };
  console.log("Selected", props.selected);
  return (
    <div className={props.className}>
      <Select
        disabled={props.disabled || loading}
        onValueChange={handleSelectChange}
        value={props.selected as string}
      >
        <SelectTrigger className={props.errorClassName}>
          <SelectValue placeholder="Search by location name">
            {data?.results?.find((option) => option.id === props.selected)
              ?.name || "Search by location name"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {data?.results?.length ? (
            data.results.map((option: { id: string; name: string }) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem disabled value="No options available">
              {loading ? "Loading..." : "No options available"}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
