import { Code } from "../questionnaire/code";

export interface ObservationValue {
  value?: string;
  value_quantity?: {
    code: Code;
    value: number;
  };
}

export interface Observation {
  id: string;
  status: "final" | "preliminary" | "amended" | "cancelled";
  category: Record<string, unknown>;
  main_code: Code;
  alternate_coding: Code[];
  subject_type: "patient" | "encounter";
  encounter: string | null;
  effective_datetime: string;
  data_entered_by_id: number;
  performer: Record<string, unknown>;
  value_type: string;
  value: ObservationValue;
  note: string;
  body_site: Record<string, unknown>;
  method: Record<string, unknown>;
  reference_range: unknown[];
  interpretation: string;
  parent: string | null;
  questionnaire_response: string | null;
}