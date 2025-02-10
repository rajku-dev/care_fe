"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { t } from "i18next";
import React, { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import Loading from "@/components/Common/Loading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import {
  MedicationAdministration,
  MedicationAdministrationRequest,
} from "@/types/emr/medicationAdministration/medicationAdministration";
import {
  ACTIVE_MEDICATION_STATUSES,
  INACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { MedicineAdminDialog } from "./MedicineAdminDialog";
import { MedicineAdminSheet } from "./MedicineAdminSheet";
import {
  STATUS_COLORS,
  TIME_SLOTS,
  createMedicationAdministrationRequest,
} from "./utils";

// Utility Functions
function isTimeInSlot(
  date: Date,
  slot: { date: Date; start: string; end: string },
): boolean {
  const slotStartDate = new Date(slot.date);
  const [startHour] = slot.start.split(":").map(Number);
  const [endHour] = slot.end.split(":").map(Number);

  slotStartDate.setHours(startHour, 0, 0, 0);
  const slotEndDate = new Date(slotStartDate);
  slotEndDate.setHours(endHour, 0, 0, 0);

  return date >= slotStartDate && date < slotEndDate;
}

function getAdministrationsForTimeSlot(
  administrations: MedicationAdministration[],
  medicationId: string,
  slotDate: Date,
  start: string,
  end: string,
): MedicationAdministration[] {
  return administrations.filter((admin) => {
    const adminDate = new Date(admin.occurrence_period_start);
    const slotStartDate = new Date(slotDate);
    const slotEndDate = new Date(slotDate);

    const [startHour] = start.split(":").map(Number);
    const [endHour] = end.split(":").map(Number);

    slotStartDate.setHours(startHour, 0, 0, 0);
    slotEndDate.setHours(endHour, 0, 0, 0);

    return (
      admin.request === medicationId &&
      adminDate >= slotStartDate &&
      adminDate < slotEndDate
    );
  });
}

// Types and Interfaces
interface AdministrationTabProps {
  patientId: string;
  encounterId: string;
}

interface TimeSlotHeaderProps {
  slot: (typeof TIME_SLOTS)[number] & { date: Date };
  isCurrentSlot: boolean;
  isEndSlot: boolean;
}

interface MedicationStatusBadgeProps {
  status: string;
}

interface MedicationBadgesProps {
  medication: MedicationRequestRead;
}

interface MedicationRowProps {
  medication: MedicationRequestRead;
  visibleSlots: ((typeof TIME_SLOTS)[number] & { date: Date })[];
  currentDate: Date;
  administrations?: MedicationAdministration[];
  onAdminister: (medication: MedicationRequestRead) => void;
  onEditAdministration: (
    medication: MedicationRequestRead,
    admin: MedicationAdministration,
  ) => void;
  onDiscontinue: (medication: MedicationRequestRead) => void;
}

// Utility Components
const MedicationStatusBadge: React.FC<MedicationStatusBadgeProps> = ({
  status,
}) => (
  <span
    className={`text-xs px-2 py-0.5 rounded-md font-medium ${
      status === "active"
        ? "text-emerald-900 bg-emerald-100"
        : "text-gray-900 bg-gray-100"
    }`}
  >
    {t(status)}
  </span>
);

const MedicationBadges: React.FC<MedicationBadgesProps> = ({ medication }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    <span className="text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md font-medium">
      {medication.dosage_instruction[0]?.route?.display || "Oral"}
    </span>
    {medication.dosage_instruction[0]?.as_needed_boolean && (
      <span className="text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded-md font-medium">
        {t("as_needed_prn")}
      </span>
    )}
    <MedicationStatusBadge status={medication.status} />
  </div>
);

const TimeSlotHeader: React.FC<TimeSlotHeaderProps> = ({
  slot,
  isCurrentSlot,
  isEndSlot,
}) => {
  const isFirstSlotOfDay = slot.start === "00:00";
  const isLastSlotOfDay = slot.start === "18:00";

  return (
    <div className="h-14">
      {isFirstSlotOfDay && (
        <div className="flex items-center h-full ml-2">
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium">
              {format(slot.date, "dd MMM").toUpperCase()}
            </div>
            <div className="text-sm text-[#6b7280]">
              {format(slot.date, "EEE")}
            </div>
          </div>
          <div className="flex-1 border-t border-dotted border-gray-300 ml-2" />
        </div>
      )}
      {!isFirstSlotOfDay && !isLastSlotOfDay && (
        <div className="flex items-center h-full">
          <div className="w-full border-t border-dotted border-gray-300" />
        </div>
      )}
      {isLastSlotOfDay && (
        <div className="flex items-center h-full mr-2">
          <div className="flex-1 border-t border-dotted border-gray-300 mr-2" />
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium">
              {format(slot.date, "dd MMM").toUpperCase()}
            </div>
            <div className="text-sm text-[#6b7280]">
              {format(slot.date, "EEE")}
            </div>
          </div>
        </div>
      )}
      {isCurrentSlot && isEndSlot && (
        <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
};

const MedicationRow: React.FC<MedicationRowProps> = ({
  medication,
  visibleSlots,
  currentDate,
  administrations,
  onAdminister,
  onEditAdministration,
  onDiscontinue,
}) => {
  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
  );

  return (
    <React.Fragment>
      <div className={`p-4 border-t ${isInactive ? "bg-gray-100" : ""}`}>
        <div className="font-semibold truncate">
          {medication.medication?.display}
        </div>
        <MedicationBadges medication={medication} />
        <div className="text-xs mt-1 font-medium truncate">
          {formatDosage(medication.dosage_instruction[0])},{" "}
          {
            getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
              ?.meaning
          }
        </div>
        <div className="text-xs text-[#6b7280] mt-1 truncate">
          {t("added_on")}:{" "}
          {format(
            new Date(medication.authored_on || medication.created_date),
            "MMM dd, yyyy, hh:mm a",
          )}
        </div>
      </div>

      {visibleSlots.map((slot) => {
        const administrationRecords = getAdministrationsForTimeSlot(
          administrations || [],
          medication.id,
          slot.date,
          slot.start,
          slot.end,
        );
        const isCurrentSlot = isTimeInSlot(currentDate, slot);

        return (
          <div
            key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
            className={`p-4 border-t relative text-sm ${isInactive ? "bg-gray-100" : ""}`}
          >
            {administrationRecords?.map((admin) => {
              const colorClass =
                STATUS_COLORS[admin.status as keyof typeof STATUS_COLORS] ||
                STATUS_COLORS.default;

              return (
                <div
                  key={admin.id}
                  className={`flex font-medium items-center gap-2 rounded-md p-2 mb-2 cursor-pointer justify-between border ${colorClass}`}
                  onClick={() => onEditAdministration(medication, admin)}
                >
                  <div className="flex flex-col md:flex-row items-center gap-1">
                    <div>
                      <CareIcon
                        icon="l-check-circle"
                        className="h-3 w-3 self-center"
                      />
                      {new Date(
                        admin.occurrence_period_start,
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    <div>
                      {admin.occurrence_period_end && (
                        <>
                          {"- "}
                          {new Date(
                            admin.occurrence_period_end,
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </>
                      )}
                    </div>
                  </div>
                  {admin.note && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-4 w-4 hover:${colorClass} p-0`}
                    >
                      <CareIcon icon="l-notes" className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
            {isCurrentSlot && medication.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-primary-800 border-primary-600 hover:bg-primary-100 font-semibold"
                onClick={() => onAdminister(medication)}
              >
                {t("administer")}
              </Button>
            )}
          </div>
        );
      })}

      <div
        className={`p-4 border-t flex justify-center ${isInactive ? "bg-gray-100" : ""}`}
      >
        {ACTIVE_MEDICATION_STATUSES.includes(
          medication.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
        ) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <CareIcon icon="l-ellipsis-h" className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 text-sm text-red-600 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  onDiscontinue(medication);
                  // Close the popover after clicking
                  const button = document.activeElement as HTMLElement;
                  button?.blur();
                }}
              >
                <CareIcon icon="l-ban" className="mr-2 h-4 w-4" />
                {t("discontinue")}
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </React.Fragment>
  );
};

export const AdministrationTab: React.FC<AdministrationTabProps> = ({
  patientId,
  encounterId,
}) => {
  const currentDate = new Date();
  const [endSlotDate, setEndSlotDate] = useState(currentDate);
  const [showStopped, setShowStopped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [endSlotIndex, setEndSlotIndex] = useState(
    Math.floor(currentDate.getHours() / 6),
  );
  // Calculate visible slots based on end slot
  const visibleSlots = React.useMemo(() => {
    const slots = [];
    let currentIndex = endSlotIndex;
    let currentDate = new Date(endSlotDate);

    // Add slots from right to left
    for (let i = 0; i < 4; i++) {
      if (currentIndex < 0) {
        currentIndex = 3;
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() - 1);
      }
      slots.unshift({
        ...TIME_SLOTS[currentIndex],
        date: new Date(currentDate),
      });
      currentIndex--;
    }
    return slots;
  }, [endSlotDate, endSlotIndex]);

  // Queries
  const { data: activeMedications, refetch: refetchActive } = useQuery({
    queryKey: ["medication_requests_active", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        status: ACTIVE_MEDICATION_STATUSES.join(","),
      },
    }),
    enabled: !!patientId,
  });

  const { data: stoppedMedications, refetch: refetchStopped } = useQuery({
    queryKey: ["medication_requests_stopped", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        status: INACTIVE_MEDICATION_STATUSES.join(","),
      },
    }),
    enabled: !!patientId,
  });

  const { data: administrations, refetch: refetchAdministrations } = useQuery({
    queryKey: ["medication_administrations", patientId, visibleSlots],
    queryFn: query(routes.medicationAdministration.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        ...(visibleSlots.length > 0 && {
          occurrence_period_start_after: (() => {
            const firstSlot = visibleSlots[0];
            const [startHour] = firstSlot.start.split(":").map(Number);
            const date = new Date(firstSlot.date);
            date.setHours(startHour, 0, 0, 0);
            return format(date, "yyyy-MM-dd'T'HH:mm:ss");
          })(),
          occurrence_period_start_before: (() => {
            const lastSlot = visibleSlots[visibleSlots.length - 1];
            const [endHour] = lastSlot.end.split(":").map(Number);
            const date = new Date(lastSlot.date);
            date.setHours(endHour, 0, 0, 0);
            return format(date, "yyyy-MM-dd'T'HH:mm:ss");
          })(),
        }),
      },
    }),
    enabled: !!patientId && !!visibleSlots?.length,
  });

  // Get last administered date and last administered by for each medication
  const lastAdministeredDetails = React.useMemo(() => {
    return administrations?.results?.reduce<{
      dates: Record<string, string>;
      performers: Record<string, string>;
    }>(
      (acc, admin) => {
        const existingDate = acc.dates[admin.request];
        const adminDate = new Date(admin.occurrence_period_start);

        if (!existingDate || adminDate > new Date(existingDate)) {
          acc.dates[admin.request] = admin.occurrence_period_start;
          acc.performers[admin.request] = admin.created_by
            ? formatName(admin.created_by)
            : "";
        }

        return acc;
      },
      { dates: {}, performers: {} },
    );
  }, [administrations?.results]);

  // Calculate earliest authored date from all medications
  const getEarliestAuthoredDate = (medications: MedicationRequestRead[]) => {
    if (!medications?.length) return null;
    return new Date(
      Math.min(
        ...medications.map((med) =>
          new Date(med.authored_on || med.created_date).getTime(),
        ),
      ),
    );
  };

  // Calculate if we can go back further based on the earliest slot and authored date
  const canGoBack = React.useMemo(() => {
    const medications = showStopped
      ? [
          ...(activeMedications?.results || []),
          ...(stoppedMedications?.results || []),
        ]
      : activeMedications?.results || [];

    const earliestAuthoredDate = getEarliestAuthoredDate(medications);
    if (!earliestAuthoredDate || !visibleSlots.length) return true;

    const firstSlotDate = new Date(visibleSlots[0].date);
    const [startHour] = visibleSlots[0].start.split(":").map(Number);
    firstSlotDate.setHours(startHour, 0, 0, 0);

    return firstSlotDate > earliestAuthoredDate;
  }, [activeMedications, stoppedMedications, showStopped, visibleSlots]);

  // State for administration
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationRequestRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [administrationRequest, setAdministrationRequest] =
    useState<MedicationAdministrationRequest | null>(null);

  // Calculate last modified date
  const lastModifiedDate = React.useMemo(() => {
    if (!administrations?.results?.length) return null;

    const sortedAdmins = [...administrations.results].sort(
      (a, b) =>
        new Date(b.occurrence_period_start).getTime() -
        new Date(a.occurrence_period_start).getTime(),
    );

    return new Date(sortedAdmins[0].occurrence_period_start);
  }, [administrations?.results]);

  // Mutations
  const { mutate: discontinueMedication } = useMutation({
    mutationFn: mutate(medicationRequestApi.upsert, {
      pathParams: { patientId },
    }),
    onSuccess: () => {
      refetchActive();
      refetchStopped();
    },
  });

  // Handlers
  const handlePreviousSlot = React.useCallback(() => {
    if (!canGoBack) return;

    const newEndSlotIndex = endSlotIndex - 1;
    if (newEndSlotIndex < 0) {
      setEndSlotIndex(3);
      const newDate = new Date(endSlotDate);
      newDate.setDate(newDate.getDate() - 1);
      setEndSlotDate(newDate);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }
  }, [endSlotDate, endSlotIndex, canGoBack]);

  const handleNextSlot = React.useCallback(() => {
    const newEndSlotIndex = endSlotIndex + 1;
    if (newEndSlotIndex > 3) {
      setEndSlotIndex(0);
      const newDate = new Date(endSlotDate);
      newDate.setDate(newDate.getDate() + 1);
      setEndSlotDate(newDate);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }
  }, [endSlotDate, endSlotIndex]);

  const handleAdminister = React.useCallback(
    (medication: MedicationRequestRead) => {
      setAdministrationRequest(
        createMedicationAdministrationRequest(medication, encounterId),
      );
      setSelectedMedication(medication);
      setDialogOpen(true);
    },
    [encounterId],
  );

  const handleEditAdministration = React.useCallback(
    (medication: MedicationRequestRead, admin: MedicationAdministration) => {
      setAdministrationRequest({
        id: admin.id,
        request: admin.request,
        encounter: admin.encounter,
        note: admin.note || "",
        occurrence_period_start: admin.occurrence_period_start,
        occurrence_period_end: admin.occurrence_period_end,
        status: admin.status,
        medication: admin.medication,
        dosage: admin.dosage,
      });
      setSelectedMedication(medication);
      setDialogOpen(true);
    },
    [],
  );

  const handleDiscontinue = React.useCallback(
    (medication: MedicationRequestRead) => {
      discontinueMedication({
        datapoints: [
          {
            ...medication,
            status: "ended",
            encounter: encounterId,
          },
        ],
      });
    },
    [discontinueMedication, encounterId],
  );

  const medications = showStopped
    ? [
        ...(activeMedications?.results || []),
        ...(stoppedMedications?.results || []),
      ]
    : activeMedications?.results || [];

  const filteredMedications = medications.filter(
    (med: MedicationRequestRead) => {
      if (!searchQuery.trim()) return true;
      const searchTerm = searchQuery.toLowerCase().trim();
      const medicationName = med.medication?.display?.toLowerCase() || "";
      return medicationName.includes(searchTerm);
    },
  );

  let content;
  if (!activeMedications || !stoppedMedications) {
    content = (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loading />
      </div>
    );
  } else if (!medications?.length) {
    content = (
      <EmptyState
        message={t("no_active_medications")}
        description={t("no_medications_to_administer")}
      />
    );
  } else if (searchQuery && !filteredMedications.length) {
    content = <EmptyState searching searchQuery={searchQuery} />;
  } else {
    content = (
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <Card className="w-full border-none shadow-none min-w-[640px]">
          <div className="grid grid-cols-[minmax(200px,2fr),repeat(4,minmax(140px,1fr)),40px]">
            {/* Top row without vertical borders */}
            <div className="col-span-full grid grid-cols-subgrid">
              <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-50">
                <div className="flex items-center gap-2 whitespace-break-spaces">
                  {lastModifiedDate && (
                    <div className="text-xs text-[#6b7280]">
                      {t("last_modified")}{" "}
                      {formatDistanceToNow(lastModifiedDate)} {t("ago")}
                    </div>
                  )}
                </div>
                <div className="flex justify-end items-center bg-gray-50 rounded">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-gray-400 mr-2"
                    onClick={handlePreviousSlot}
                    disabled={!canGoBack}
                    title={
                      !canGoBack ? t("cannot_go_before_prescription_date") : ""
                    }
                  >
                    <CareIcon icon="l-angle-left" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {visibleSlots.map((slot) => (
                <TimeSlotHeader
                  key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                  slot={slot}
                  isCurrentSlot={isTimeInSlot(currentDate, slot)}
                  isEndSlot={slot.date.getTime() === currentDate.getTime()}
                />
              ))}
              <div className="flex justify-start items-center px-1 bg-gray-50">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-gray-400"
                  onClick={handleNextSlot}
                  disabled={isTimeInSlot(currentDate, visibleSlots[3])}
                >
                  <CareIcon icon="l-angle-right" className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main content with borders */}
            <div className="col-span-full grid grid-cols-subgrid divide-x divide-[#e5e7eb] border-l border-r">
              {/* Headers */}
              <div className="p-4 font-medium text-sm border-t bg-[#F3F4F6] text-secondary-700">
                {t("medicine")}:
              </div>
              {visibleSlots.map((slot, i) => (
                <div
                  key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                  className="p-4 font-semibold text-xs text-center border-t relative bg-[#F3F4F6] text-secondary-700"
                >
                  {i === endSlotIndex &&
                    slot.date.getTime() === currentDate.getTime() && (
                      <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  {slot.label}
                </div>
              ))}
              <div className="border-t bg-[#F3F4F6]" />

              {/* Medication rows */}
              {filteredMedications?.map((medication) => (
                <MedicationRow
                  key={medication.id}
                  medication={medication}
                  visibleSlots={visibleSlots}
                  currentDate={currentDate}
                  administrations={administrations?.results}
                  onAdminister={handleAdminister}
                  onEditAdministration={handleEditAdministration}
                  onDiscontinue={handleDiscontinue}
                />
              ))}
            </div>
          </div>

          {stoppedMedications?.results?.length > 0 && (
            <div
              className="p-4 border-t border-[#e5e7eb] flex items-center gap-2 cursor-pointer hover:bg-gray-50"
              onClick={() => setShowStopped(!showStopped)}
            >
              <CareIcon
                icon={showStopped ? "l-eye-slash" : "l-eye"}
                className="h-4 w-4"
              />
              <span className="text-sm underline">
                {showStopped ? t("hide") : t("show")}{" "}
                {`${stoppedMedications?.results?.length} ${t("stopped")}`}{" "}
                {t("prescriptions")}
              </span>
            </div>
          )}
        </Card>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-4 mx-2">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <CareIcon icon="l-search" className="text-lg text-gray-500" />
            <input
              type="text"
              placeholder={t("search_medications")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500 hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <CareIcon icon="l-times" className="text-lg" />
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
          onClick={() => setIsSheetOpen(true)}
        >
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          {t("administer_medicine")}
        </Button>
      </div>

      <div className="mt-4">{content}</div>

      {selectedMedication && administrationRequest && (
        <MedicineAdminDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setAdministrationRequest(null);
              setSelectedMedication(null);
              refetchAdministrations();
            }
          }}
          medication={selectedMedication}
          lastAdministeredDate={
            lastAdministeredDetails?.dates[selectedMedication.id]
          }
          lastAdministeredBy={
            lastAdministeredDetails?.performers[selectedMedication.id]
          }
          administrationRequest={administrationRequest}
          patientId={patientId}
        />
      )}

      <MedicineAdminSheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            refetchAdministrations();
          }
        }}
        medications={medications}
        lastAdministeredDates={lastAdministeredDetails?.dates}
        patientId={patientId}
        encounterId={encounterId}
      />
    </div>
  );
};
