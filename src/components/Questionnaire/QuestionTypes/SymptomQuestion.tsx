"use client";

import {
  DotsVerticalIcon,
  MinusCircledIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import React, { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import query from "@/Utils/request/query";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  Symptom,
  SymptomRequest,
} from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";
import { Code } from "@/types/questionnaire/code";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface SymptomQuestionProps {
  patientId: string;
  encounterId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
}

const SYMPTOM_INITIAL_VALUE: Omit<SymptomRequest, "encounter"> = {
  code: { code: "", display: "", system: "" },
  clinical_status: "active",
  verification_status: "confirmed",
  severity: "moderate",
  onset: { onset_datetime: new Date().toISOString().split("T")[0] },
};

function convertToSymptomRequest(symptom: Symptom): SymptomRequest {
  return {
    id: symptom.id,
    code: symptom.code,
    clinical_status: symptom.clinical_status,
    verification_status: symptom.verification_status,
    severity: symptom.severity,
    onset: symptom.onset
      ? {
          ...symptom.onset,
          onset_datetime: symptom.onset.onset_datetime
            ? format(new Date(symptom.onset.onset_datetime), "yyyy-MM-dd")
            : "",
        }
      : undefined,
    recorded_date: symptom.recorded_date,
    note: symptom.note,
    encounter: "", // This will be set when submitting the form
  };
}

interface SymptomRowProps {
  symptom: SymptomRequest;
  index: number;
  disabled?: boolean;
  onUpdate: (index: number, updates: Partial<SymptomRequest>) => void;
  onRemove: (index: number) => void;
}

function SymptomActionsMenu({
  showNotes,
  verificationStatus,
  disabled,
  onToggleNotes,
  onRemove,
}: {
  showNotes: boolean;
  verificationStatus: string;
  disabled?: boolean;
  onToggleNotes: () => void;
  onRemove: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-8 w-8"
        >
          <DotsVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onToggleNotes}>
          <Pencil2Icon className="h-4 w-4 mr-2" />
          {showNotes ? t("hide_notes") : t("add_notes")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onRemove}
          disabled={verificationStatus === "entered_in_error"}
        >
          <MinusCircledIcon className="h-4 w-4 mr-2" />
          {verificationStatus === "entered_in_error"
            ? t("already_marked_as_error")
            : t("remove_symptom")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SymptomRow = React.memo(function SymptomRow({
  symptom,
  index,
  disabled,
  onUpdate,
  onRemove,
}: SymptomRowProps) {
  const [showNotes, setShowNotes] = useState(Boolean(symptom.note));

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(index, {
        onset: { onset_datetime: e.target.value },
      }),
    [index, onUpdate],
  );

  const handleStatusChange = useCallback(
    (value: string) =>
      onUpdate(index, {
        clinical_status: value as SymptomRequest["clinical_status"],
      }),
    [index, onUpdate],
  );

  const handleSeverityChange = useCallback(
    (value: string) =>
      onUpdate(index, {
        severity: value as SymptomRequest["severity"],
      }),
    [index, onUpdate],
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(index, { note: e.target.value }),
    [index, onUpdate],
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);
  const handleToggleNotes = useCallback(() => setShowNotes((n) => !n), []);

  return (
    <div
      className={cn("group hover:bg-gray-50", {
        "opacity-40 pointer-events-none":
          symptom.verification_status === "entered_in_error",
      })}
    >
      <div className="py-1 px-2 space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:items-center md:gap-4">
        <div className="flex items-center justify-between md:col-span-5">
          <div
            className="font-medium text-sm truncate"
            title={symptom.code.display}
          >
            {symptom.code.display}
          </div>
        </div>
        <div className="col-span-2">
          <div className="block text-sm font-medium text-gray-500 mb-1 md:hidden">
            {t("date")}
          </div>
          <Input
            type="date"
            value={symptom.onset?.onset_datetime || ""}
            onChange={handleDateChange}
            disabled={disabled || !!symptom.id}
            className="h-8 md:h-9"
          />
        </div>
        <div className="col-span-2">
          <div className="block text-sm font-medium text-gray-500 mb-1 md:hidden">
            {t("status")}
          </div>
          <Select
            value={symptom.clinical_status}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOM_CLINICAL_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <div className="block text-sm font-medium text-gray-500 mb-1 md:hidden">
            {t("severity")}
          </div>
          <Select
            value={symptom.severity}
            onValueChange={handleSeverityChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOM_SEVERITY.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {t(severity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 flex justify-center">
          <SymptomActionsMenu
            showNotes={showNotes}
            verificationStatus={symptom.verification_status}
            disabled={disabled}
            onToggleNotes={handleToggleNotes}
            onRemove={handleRemove}
          />
        </div>
      </div>
      {showNotes && (
        <div className="px-3 pb-3">
          <Input
            type="text"
            placeholder={t("add_notes_about_symptom")}
            value={symptom.note || ""}
            onChange={handleNotesChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
});

export function SymptomQuestion({
  patientId,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  encounterId,
}: SymptomQuestionProps) {
  const symptoms =
    (questionnaireResponse.values?.[0]?.value as SymptomRequest[]) || [];

  const { data: patientSymptoms } = useQuery({
    queryKey: ["symptoms", patientId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        encounter: encounterId,
      },
    }),
  });

  useEffect(() => {
    if (patientSymptoms?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "symptom",
            value: patientSymptoms.results.map(convertToSymptomRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientSymptoms]);

  const handleAddSymptom = (code: Code) => {
    const newSymptoms = [
      ...symptoms,
      { ...SYMPTOM_INITIAL_VALUE, code },
    ] as SymptomRequest[];
    updateQuestionnaireResponseCB(
      [{ type: "symptom", value: newSymptoms }],
      questionnaireResponse.question_id,
    );
  };

  const handleRemoveSymptom = (index: number) => {
    const symptom = symptoms[index];
    if (symptom.id) {
      // For existing records, update verification status to entered_in_error
      const newSymptoms = symptoms.map((s, i) =>
        i === index
          ? { ...s, verification_status: "entered_in_error" as const }
          : s,
      );
      updateQuestionnaireResponseCB(
        [{ type: "symptom", value: newSymptoms }],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newSymptoms = symptoms.filter((_, i) => i !== index);
      updateQuestionnaireResponseCB(
        [{ type: "symptom", value: newSymptoms }],
        questionnaireResponse.question_id,
      );
    }
  };

  const handleUpdateSymptom = (
    index: number,
    updates: Partial<SymptomRequest>,
  ) => {
    const newSymptoms = symptoms.map((symptom, i) =>
      i === index ? { ...symptom, ...updates } : symptom,
    );
    updateQuestionnaireResponseCB(
      [{ type: "symptom", value: newSymptoms }],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-2">
      {symptoms.length > 0 && (
        <div className="rounded-lg border">
          <div className="hidden md:grid md:grid-cols-12 items-center gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-5">{t("symptom")}</div>
            <div className="col-span-2 text-center">{t("date")}</div>
            <div className="col-span-2 text-center">{t("status")}</div>
            <div className="col-span-2 text-center">{t("severity")}</div>
            <div className="col-span-1 text-center">{t("action")}</div>
          </div>
          <div className="divide-y divide-gray-200">
            {symptoms.map((symptom, index) => (
              <SymptomRow
                key={index}
                symptom={symptom}
                index={index}
                disabled={disabled}
                onUpdate={handleUpdateSymptom}
                onRemove={handleRemoveSymptom}
              />
            ))}
          </div>
        </div>
      )}
      <ValueSetSelect
        system="system-condition-code"
        placeholder={t("search_for_symptoms_to_add")}
        onSelect={handleAddSymptom}
        disabled={disabled}
      />
    </div>
  );
}
