import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export type AllergyVerificationStatus =
  | "unconfirmed"
  | "confirmed"
  | "refuted"
  | "presumed"
  | "entered_in_error";

export type AllergyClinicalStatus = "active" | "inactive" | "resolved";
export type AllergyCategory =
  | "food"
  | "medication"
  | "environment"
  | "biologic";
export type AllergyCriticality = "low" | "high" | "unable_to_assess";

// Base type for allergy data
export interface AllergyIntolerance {
  id: string;
  code: Code;
  clinical_status: AllergyClinicalStatus;
  verification_status: AllergyVerificationStatus;
  category: AllergyCategory;
  criticality: AllergyCriticality;
  last_occurrence?: string;
  note?: string;
  created_by: UserBase;
  encounter: string;
  edited_by?: UserBase;
}

// Type for API request, extends base type with required fields
// Added optional id here as this type is used only in one place
export interface AllergyIntoleranceRequest {
  id?: string;
  clinical_status: AllergyClinicalStatus;
  verification_status: AllergyVerificationStatus;
  category: string;
  criticality: string;
  code: Code;
  last_occurrence?: string;
  note?: string;
  encounter: string;
}

export const ALLERGY_VERIFICATION_STATUS = {
  unconfirmed: "Unconfirmed",
  confirmed: "Confirmed",
  refuted: "Refuted",
  presumed: "Presumed",
  entered_in_error: "Entered in Error",
};
