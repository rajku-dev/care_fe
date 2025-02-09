import { MinusCircledIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ComboboxQuantityInput } from "@/components/Common/ComboboxQuantityInput";
import { MultiValueSetSelect } from "@/components/Medicine/MultiValueSetSelect";
import { NotesInput } from "@/components/Questionnaire/QuestionTypes/NotesInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import {
  DoseRange,
  MEDICATION_REQUEST_INTENT,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequest,
  MedicationRequestDosageInstruction,
  MedicationRequestIntent,
  UCUM_TIME_UNITS,
  parseMedicationStringToRequest,
} from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { Code } from "@/types/questionnaire/code";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface MedicationRequestQuestionProps {
  patientId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  encounterId: string;
}

export function MedicationRequestQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
  encounterId,
}: MedicationRequestQuestionProps) {
  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationRequest[]) || [];

  const { data: patientMedications } = useQuery({
    queryKey: ["medication_requests", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
      },
    }),
  });

  useEffect(() => {
    if (patientMedications?.results) {
      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: patientMedications.results }],
        questionnaireResponse.question_id,
      );
    }
  }, [patientMedications]);

  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);

  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );
  const desktopLayout = useBreakpoints({ lg: true, default: false });

  const handleAddMedication = (medication: Code) => {
    const newMedications: MedicationRequest[] = [
      ...medications,
      {
        ...parseMedicationStringToRequest(medication),
        authored_on: new Date().toISOString(),
      },
    ];
    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );
    setExpandedMedicationIndex(newMedications.length - 1);
  };

  const handleRemoveMedication = (index: number) => {
    setMedicationToDelete(index);
  };

  const confirmRemoveMedication = () => {
    if (medicationToDelete === null) return;

    const medication = medications[medicationToDelete];
    if (medication.id) {
      // For existing records, update status to entered_in_error
      const newMedications = medications.map((med, i) =>
        i === medicationToDelete
          ? { ...med, status: "entered_in_error" as const }
          : med,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newMedications = medications.filter(
        (_, i) => i !== medicationToDelete,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );
    }
    setMedicationToDelete(null);
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationRequest>,
  ) => {
    const newMedications = medications.map((medication, i) =>
      i === index ? { ...medication, ...updates } : medication,
    );

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-4">
      <AlertDialog
        open={medicationToDelete !== null}
        onOpenChange={(open) => !open && setMedicationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_medication")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_medication_confirmation", {
                medication:
                  medications[medicationToDelete!]?.medication?.display,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMedication}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {medications.length > 0 && (
        <div className="md:overflow-x-auto w-auto pb-2">
          <div className="min-w-fit">
            <div
              className={cn("max-w-[2304px] relative lg:border rounded-md", {
                "bg-gray-50/50": !desktopLayout,
              })}
            >
              {/* Header - Only show on desktop */}
              <div className="hidden lg:grid grid-cols-[280px,180px,170px,160px,300px,180px,250px,180px,160px,200px,180px,48px] bg-gray-50 border-b text-sm font-medium text-gray-500">
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("dosage")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("frequency")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("duration")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("instructions")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("route")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("site")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("method")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("intent")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("authored_on")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("notes")}
                </div>
                <div className="font-semibold text-gray-600 p-3 sticky right-0 bg-gray-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12" />
              </div>

              {/* Body */}
              <div
                className={cn("bg-white", {
                  "bg-transparent": !desktopLayout,
                })}
              >
                {medications.map((medication, index) => (
                  <React.Fragment key={index}>
                    {!desktopLayout ? (
                      <Collapsible
                        open={expandedMedicationIndex === index}
                        onOpenChange={() => {
                          setExpandedMedicationIndex(
                            expandedMedicationIndex === index ? null : index,
                          );
                        }}
                        className="border-b last:border-b-0"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-0.5 rounded-md shadow-sm text-sm",
                            expandedMedicationIndex === index
                              ? "bg-gray-50"
                              : "bg-gray-100",
                          )}
                        >
                          <CollapsibleTrigger className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {medication.medication?.display}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-1">
                            {expandedMedicationIndex !== index && (
                              <Button
                                aria-label="Expand Medication Request"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMedicationIndex(index);
                                }}
                                disabled={disabled}
                              >
                                <Pencil2Icon className="h-4 w-4" />
                              </Button>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMedication(index);
                                    }}
                                    disabled={
                                      disabled ||
                                      medication.status === "entered_in_error"
                                    }
                                    className="h-8 w-8"
                                  >
                                    <MinusCircledIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {medication.status === "entered_in_error"
                                    ? t("medication_already_marked_as_error")
                                    : t("remove_medication")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="py-4 space-y-4 bg-white mx-2 mb-1">
                            <MedicationRequestGridRow
                              medication={medication}
                              disabled={disabled}
                              onUpdate={(updates) =>
                                handleUpdateMedication(index, updates)
                              }
                              onRemove={() => handleRemoveMedication(index)}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <MedicationRequestGridRow
                        medication={medication}
                        disabled={disabled}
                        onUpdate={(updates) =>
                          handleUpdateMedication(index, updates)
                        }
                        onRemove={() => handleRemoveMedication(index)}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl">
        <ValueSetSelect
          system="system-medication"
          placeholder={t("search_medications")}
          onSelect={handleAddMedication}
          disabled={disabled}
          searchPostFix=" clinical drug"
        />
      </div>
    </div>
  );
}

interface MedicationRequestGridRowProps {
  medication: MedicationRequest;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationRequest>) => void;
  onRemove?: () => void;
}

const MedicationRequestGridRow: React.FC<MedicationRequestGridRowProps> = ({
  medication,
  disabled,
  onUpdate,
  onRemove,
}) => {
  const [showDosageDialog, setShowDosageDialog] = useState(false);
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const dosageInstruction = medication.dosage_instruction[0];
  const isReadOnly = !!medication.id;

  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    onUpdate?.({
      dosage_instruction: [{ ...dosageInstruction, ...updates }],
    });
  };

  const formatDoseRange = (range?: DoseRange) => {
    if (!range?.high?.value) return "";
    return `${range.low?.value} ${range.low?.unit?.display} → ${range.high?.value} ${range.high?.unit?.display}`;
  };
  interface DosageDialogProps {
    dosageRange: DoseRange;
  }

  const DosageDialog: React.FC<DosageDialogProps> = ({ dosageRange }) => {
    const [localDoseRange, setLocalDoseRange] =
      useState<DoseRange>(dosageRange);

    return (
      <div className="flex flex-col gap-3">
        <div className="font-medium text-base">{t("taper_titrate_dosage")}</div>
        <div>
          <Label className="mb-1.5">{t("start_dose")}</Label>
          <ComboboxQuantityInput
            quantity={localDoseRange.low}
            onChange={(value) => {
              setLocalDoseRange((prev) => ({
                ...prev,
                low: value,
                high: {
                  ...prev.high,
                  unit: value.unit,
                },
              }));
            }}
            disabled={disabled || isReadOnly}
          />
        </div>
        <div>
          <Label className="mb-1.5">{t("end_dose")}</Label>
          <ComboboxQuantityInput
            quantity={localDoseRange.high}
            onChange={(value) => {
              setLocalDoseRange((prev) => ({
                ...prev,
                high: value,
                low: {
                  ...prev.low,
                  unit: value.unit,
                },
              }));
            }}
            disabled={disabled || !localDoseRange.low.value || isReadOnly}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              handleUpdateDosageInstruction({
                dose_and_rate: undefined,
              });
              setShowDosageDialog(false);
            }}
          >
            {t("clear")}
          </Button>
          <Button
            onClick={() => {
              handleUpdateDosageInstruction({
                dose_and_rate: {
                  type: "ordered",
                  dose_range: localDoseRange,
                },
              });
              setShowDosageDialog(false);
            }}
            disabled={
              !localDoseRange.low.value ||
              !localDoseRange.high.value ||
              !localDoseRange.low.unit ||
              !localDoseRange.high.unit ||
              isReadOnly
            }
          >
            {t("save")}
          </Button>
        </div>
      </div>
    );
  };

  const handleDoseRangeClick = () => {
    const dose_quantity = dosageInstruction?.dose_and_rate?.dose_quantity;

    if (dose_quantity) {
      handleUpdateDosageInstruction({
        dose_and_rate: {
          type: "ordered",
          dose_quantity: undefined,
          dose_range: {
            low: dose_quantity,
            high: dose_quantity,
          },
        },
      });
    }
    setShowDosageDialog(true);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-[280px,180px,170px,160px,300px,180px,250px,180px,160px,200px,180px,48px] border-b hover:bg-gray-50/50",
        {
          "opacity-40 pointer-events-none":
            medication.status === "entered_in_error",
        },
      )}
    >
      {/* Medicine Name */}
      <div className="lg:p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r font-medium overflow-hidden text-sm">
        <span className="break-words line-clamp-2 hidden lg:block">
          {medication.medication?.display}
        </span>
      </div>
      {/* Dosage */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("dosage")}</Label>
        <div>
          {dosageInstruction?.dose_and_rate?.dose_range ? (
            <Input
              readOnly
              value={formatDoseRange(
                dosageInstruction.dose_and_rate.dose_range,
              )}
              onClick={() => setShowDosageDialog(true)}
              className="h-9 text-sm cursor-pointer mb-3"
            />
          ) : (
            <>
              <ComboboxQuantityInput
                quantity={dosageInstruction?.dose_and_rate?.dose_quantity}
                onChange={(value) => {
                  if (!value.value || !value.unit) return;
                  handleUpdateDosageInstruction({
                    dose_and_rate: {
                      type: "ordered",
                      dose_quantity: {
                        value: value.value,
                        unit: value.unit,
                      },
                      dose_range: undefined,
                    },
                  });
                }}
                disabled={disabled || isReadOnly}
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 rounded-full hover:bg-transparent"
                  onClick={handleDoseRangeClick}
                  disabled={disabled || isReadOnly}
                >
                  +
                </Button>
              </div>
            </>
          )}
        </div>

        {dosageInstruction?.dose_and_rate?.dose_range &&
          (desktopLayout ? (
            <Popover open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <PopoverTrigger asChild>
                <div className="w-full" />
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <DosageDialog
                  dosageRange={dosageInstruction.dose_and_rate.dose_range}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Dialog open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <DialogContent>
                <DosageDialog
                  dosageRange={dosageInstruction.dose_and_rate.dose_range}
                />
              </DialogContent>
            </Dialog>
          ))}
      </div>
      {/* Frequency */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("frequency")}
        </Label>
        <Select
          value={
            dosageInstruction?.as_needed_boolean
              ? "PRN"
              : reverseFrequencyOption(dosageInstruction?.timing)
          }
          onValueChange={(value) => {
            if (value === "PRN") {
              handleUpdateDosageInstruction({
                as_needed_boolean: true,
                timing: undefined,
              });
            } else {
              const timingOption =
                MEDICATION_REQUEST_TIMING_OPTIONS[
                  value as keyof typeof MEDICATION_REQUEST_TIMING_OPTIONS
                ];

              handleUpdateDosageInstruction({
                as_needed_boolean: false,
                timing: timingOption.timing,
              });
            }
          }}
          disabled={disabled || isReadOnly}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={t("select_frequency")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRN">{t("as_needed_prn")}</SelectItem>
            {Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).map(
              ([key, option]) => (
                <SelectItem key={key} value={key}>
                  {option.display}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      {/* Duration */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("duration")}
        </Label>
        <div className="flex gap-2">
          {dosageInstruction?.timing && (
            <Input
              type="number"
              min={0}
              value={dosageInstruction.timing.repeat.bounds_duration?.value}
              onChange={(e) => {
                const value = e.target.value;
                if (!dosageInstruction.timing) return;
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: {
                        value: Number(value),
                        unit: dosageInstruction.timing.repeat.bounds_duration
                          .unit,
                      },
                    },
                  },
                });
              }}
              disabled={
                disabled ||
                !dosageInstruction?.timing?.repeat ||
                dosageInstruction?.as_needed_boolean ||
                isReadOnly
              }
              className="h-9 text-sm"
            />
          )}
          <Select
            value={
              dosageInstruction?.timing?.repeat?.bounds_duration?.unit ??
              UCUM_TIME_UNITS[0]
            }
            onValueChange={(unit: (typeof UCUM_TIME_UNITS)[number]) => {
              if (dosageInstruction?.timing?.repeat) {
                const value =
                  dosageInstruction?.timing?.repeat?.bounds_duration?.value ??
                  0;
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: { value, unit },
                    },
                  },
                });
              }
            }}
            disabled={
              disabled ||
              !dosageInstruction?.timing?.repeat ||
              dosageInstruction?.as_needed_boolean ||
              isReadOnly
            }
          >
            <SelectTrigger className="h-9 text-sm w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UCUM_TIME_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Instructions */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("instructions")}
        </Label>
        {dosageInstruction?.as_needed_boolean ? (
          <MultiValueSetSelect
            options={[
              {
                system: "system-as-needed-reason",
                value: dosageInstruction?.as_needed_for || null,
                label: t("prn_reason"),
                placeholder: t("select_prn_reason"),
                onSelect: (value: Code | null) => {
                  handleUpdateDosageInstruction({
                    as_needed_for: value || undefined,
                  });
                },
              },
              {
                system: "system-additional-instruction",
                value: dosageInstruction?.additional_instruction?.[0] || null,
                label: t("additional_instructions"),
                placeholder: t("select_additional_instructions"),
                onSelect: (value: Code | null) => {
                  handleUpdateDosageInstruction({
                    additional_instruction: value ? [value] : undefined,
                  });
                },
              },
            ]}
            disabled={disabled || isReadOnly}
          />
        ) : (
          <ValueSetSelect
            system="system-additional-instruction"
            value={dosageInstruction?.additional_instruction?.[0]}
            onSelect={(instruction) =>
              handleUpdateDosageInstruction({
                additional_instruction: instruction ? [instruction] : undefined,
              })
            }
            placeholder={t("select_additional_instructions")}
            disabled={disabled || isReadOnly}
          />
        )}
      </div>
      {/* Route */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("route")}</Label>
        <ValueSetSelect
          system="system-route"
          value={dosageInstruction?.route}
          onSelect={(route) => handleUpdateDosageInstruction({ route })}
          placeholder={t("select_route")}
          disabled={disabled || isReadOnly}
        />
      </div>
      {/* Site */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("site")}</Label>
        <ValueSetSelect
          system="system-body-site"
          value={dosageInstruction?.site}
          onSelect={(site) => handleUpdateDosageInstruction({ site })}
          placeholder={t("select_site")}
          disabled={disabled || isReadOnly}
          wrapTextForSmallScreen={true}
        />
      </div>
      {/* Method */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("method")}</Label>
        <ValueSetSelect
          system="system-administration-method"
          value={dosageInstruction?.method}
          onSelect={(method) => handleUpdateDosageInstruction({ method })}
          placeholder={t("select_method")}
          disabled={disabled || isReadOnly}
          count={20}
        />
      </div>
      {/* Intent */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("intent")}</Label>
        <Select
          value={medication.intent}
          onValueChange={(value: MedicationRequestIntent) =>
            onUpdate?.({ intent: value })
          }
          disabled={disabled || isReadOnly}
        >
          <SelectTrigger className="h-9 text-sm capitalize">
            <SelectValue
              className="capitalize"
              placeholder={t("select_intent")}
            />
          </SelectTrigger>
          <SelectContent>
            {MEDICATION_REQUEST_INTENT.map((intent) => (
              <SelectItem key={intent} value={intent} className="capitalize">
                {intent.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Authored On */}
      <div className="lg:px-1 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("authored_on")}
        </Label>
        <DateTimePicker
          value={
            medication.authored_on
              ? new Date(medication.authored_on)
              : undefined
          }
          onChange={(date) => {
            if (!date) return;
            onUpdate?.({ authored_on: date.toISOString() });
          }}
          disabled={disabled || isReadOnly}
        />
      </div>
      {/* Notes */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("notes")}</Label>
        {desktopLayout ? (
          <>
            <Label className="mb-1.5 block text-sm lg:hidden">
              {t("notes")}
            </Label>
            <Input
              value={medication.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              placeholder={t("add_notes")}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </>
        ) : (
          <NotesInput
            className="mt-2"
            questionnaireResponse={{
              question_id: "",
              structured_type: "medication_request",
              link_id: "",
              values: [],
              note: medication.note,
            }}
            handleUpdateNote={(note) => {
              onUpdate?.({ note: note });
            }}
            disabled={disabled}
          />
        )}
      </div>

      {/* Remove Button */}
      <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="h-8 w-8"
        >
          <MinusCircledIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const reverseFrequencyOption = (
  option: MedicationRequest["dosage_instruction"][0]["timing"],
) => {
  return Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).find(
    ([key]) => key === option?.code?.code,
  )?.[0] as keyof typeof MEDICATION_REQUEST_TIMING_OPTIONS;
};
