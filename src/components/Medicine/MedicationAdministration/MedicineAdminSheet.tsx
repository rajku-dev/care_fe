"use client";

import { useMutation } from "@tanstack/react-query";
import { t } from "i18next";
import { Search } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { MedicationAdministrationRequest } from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

import { MedicineAdminForm } from "./MedicineAdminForm";
import { createMedicationAdministrationRequest } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: MedicationRequestRead[];
  lastAdministeredDates?: Record<string, string>;
  patientId: string;
  encounterId: string;
}

interface MedicineListItemProps {
  medicine: MedicationRequestRead;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  administrationRequest?: MedicationAdministrationRequest;
  lastAdministeredDate?: string;
  lastAdministeredBy?: string;
  onAdministrationChange: (request: MedicationAdministrationRequest) => void;
  isValid: (valid: boolean) => void;
}

const MedicineListItem = ({
  medicine,
  isSelected,
  onSelect,
  administrationRequest,
  lastAdministeredDate,
  lastAdministeredBy,
  onAdministrationChange,
  isValid,
}: MedicineListItemProps) => {
  const medicationDisplay = medicine.medication?.display;

  return (
    <div className="border-b border-border py-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{medicationDisplay}</span>
            {medicine.dosage_instruction[0]?.as_needed_boolean && (
              <span className="text-sm text-rose-500">
                {t("as_needed_prn")}
              </span>
            )}
          </div>
        </div>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="mt-1 mr-6 border-gray-800 h-5 w-5"
          aria-label="Select for administration"
        />
      </div>

      <div
        className={`grid gap-4 overflow-hidden transition-all ${
          isSelected ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          {isSelected && administrationRequest && (
            <MedicineAdminForm
              medication={medicine}
              lastAdministeredDate={lastAdministeredDate}
              lastAdministeredBy={lastAdministeredBy}
              formId={medicine.id}
              administrationRequest={administrationRequest}
              onChange={onAdministrationChange}
              isValid={isValid}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export function MedicineAdminSheet({
  open,
  onOpenChange,
  medications,
  lastAdministeredDates,
  patientId,
  encounterId,
}: Props) {
  const [selectedMedicines, setSelectedMedicines] = useState<Set<string>>(
    new Set(),
  );
  const [administrationRequests, setAdministrationRequests] = useState<
    Record<string, MedicationAdministrationRequest>
  >({});
  const [formValidation, setFormValidation] = useState<Record<string, boolean>>(
    {},
  );
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const { mutate: upsertAdministrations, isPending } = useMutation({
    mutationFn: mutate(
      medicationAdministrationApi.upsertMedicationAdministration,
      {
        pathParams: { patientId },
      },
    ),
    onSuccess: () => {
      toast.success(t("medication_administration_saved"));
      handleClose();
    },
  });

  const filteredMedicines = medications.filter((medicine) => {
    const display = medicine.medication?.display;
    return (
      typeof display === "string" &&
      display.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelect = useCallback(
    (id: string, checked: boolean) => {
      setSelectedMedicines((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(id);
          const medicine = medications.find((m) => m.id === id);
          if (medicine?.medication?.display) {
            setAdministrationRequests((prev) => ({
              ...prev,
              [id]: createMedicationAdministrationRequest(
                medicine,
                encounterId,
              ),
            }));
          }
        } else {
          next.delete(id);
          setAdministrationRequests((prev) => {
            const { [id]: _, ...rest } = prev;
            return rest;
          });
        }
        return next;
      });
    },
    [medications, encounterId],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const administrations = Array.from(selectedMedicines).map(
      (id) => administrationRequests[id],
    );
    upsertAdministrations({
      datapoints: administrations,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedMedicines(new Set());
    setAdministrationRequests({});
  };

  const handleAdministrationChange = useCallback(
    (medicineId: string, request: MedicationAdministrationRequest) => {
      setAdministrationRequests((prev) => ({
        ...prev,
        [medicineId]: request,
      }));
    },
    [],
  );

  const handleFormValidation = useCallback(
    (medicineId: string, isValid: boolean) => {
      setFormValidation((prev) => ({
        ...prev,
        [medicineId]: isValid,
      }));
    },
    [],
  );

  const isAllFormsValid = useMemo(
    () =>
      Array.from(selectedMedicines).every((id) => formValidation[id] !== false),
    [selectedMedicines, formValidation],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:min-w-[44rem] max-w-2xl flex flex-col h-full pr-0"
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
        >
          <SheetHeader className="space-y-4 flex-shrink-0 mr-2">
            <SheetTitle className="text-xl">
              {t("administer_medicines")}
            </SheetTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("search_medicine")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-8">
            <div className="space-y-2 pb-4 mr-2">
              {filteredMedicines.map((medicine) => (
                <MedicineListItem
                  key={medicine.id}
                  medicine={medicine}
                  isSelected={selectedMedicines.has(medicine.id)}
                  onSelect={(checked) => handleSelect(medicine.id, checked)}
                  administrationRequest={administrationRequests[medicine.id]}
                  lastAdministeredDate={lastAdministeredDates?.[medicine.id]}
                  onAdministrationChange={(request) =>
                    handleAdministrationChange(medicine.id, request)
                  }
                  isValid={(valid) => handleFormValidation(medicine.id, valid)}
                />
              ))}
            </div>
          </div>

          <SheetFooter className="border-t pt-4 mr-2">
            <div className="flex justify-between w-full">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-[#006D4C] hover:bg-[#006D4C]/90"
                disabled={
                  selectedMedicines.size === 0 || isPending || !isAllFormsValid
                }
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
              >
                {isPending
                  ? t("saving")
                  : `${t("administer_medicines")} (${selectedMedicines.size})`}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
