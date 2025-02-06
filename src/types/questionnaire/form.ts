import { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import { EncounterEditRequest } from "@/types/emr/encounter";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { SymptomRequest } from "@/types/emr/symptom/symptom";
import { LocationAssociationQuestion } from "@/types/location/association";
import { Code } from "@/types/questionnaire/code";
import { Quantity } from "@/types/questionnaire/quantity";
import { StructuredQuestionType } from "@/types/questionnaire/question";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

/**
 * A short hand for defining response value types
 */
type RV<T extends string, V> = {
  value_code?: Code;
  value_quantity?: Quantity;
  type: T;
  value: V;
};

export type ResponseValue =
  | RV<"string", string | undefined>
  | RV<"number", number | undefined>
  | RV<"boolean", boolean | undefined>
  | RV<"dateTime", Date | undefined>
  | RV<"allergy_intolerance", AllergyIntoleranceRequest[]>
  | RV<"medication_request", MedicationRequest[]>
  | RV<"medication_statement", MedicationStatementRequest[]>
  | RV<"location_association", LocationAssociationQuestion[]>
  | RV<"symptom", SymptomRequest[]>
  | RV<"diagnosis", DiagnosisRequest[]>
  | RV<"encounter", EncounterEditRequest[]>
  | RV<"appointment", CreateAppointmentQuestion[]>;

export interface QuestionnaireResponse {
  question_id: string;
  structured_type: StructuredQuestionType | null;
  link_id: string;
  values: ResponseValue[];
  note?: string;
  taken_at?: string;
  body_site?: Code;
  method?: Code;
}
