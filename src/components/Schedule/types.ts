import { DayOfWeekValue } from "@/CAREUI/interactive/WeekdayCheckbox";

import { Time, WritableOnly } from "@/Utils/types";
import { UserBase } from "@/types/user/base";

export interface ScheduleTemplate {
  readonly id: string;
  resource_type: "user";
  resource: string;
  name: string;
  valid_from: string;
  valid_to: string;
  availabilities: {
    readonly id: string;
    name: string;
    slot_type: "appointment" | "open" | "closed";
    slot_size_in_minutes: number;
    tokens_per_slot: number;
    readonly create_tokens: boolean;
    reason: string;
    availability: {
      day_of_week: DayOfWeekValue;
      start_time: Time;
      end_time: Time;
    }[];
  }[];
  readonly create_by: UserBase;
  readonly updated_by: UserBase;
}

export const ScheduleSlotTypes = ["open", "appointment", "closed"] as const;

export type ScheduleAvailability = ScheduleTemplate["availabilities"][number];

export interface ScheduleException {
  readonly id: string;
  name: string;
  is_available: boolean;
  reason: string;
  valid_from: string;
  valid_to: string;
  start_time: Time;
  end_time: Time;
  slot_type?: (typeof ScheduleSlotTypes)[number];
  slot_size_in_minutes?: number;
  tokens_per_slot?: number;
}

export interface ScheduleExceptionCreate
  extends WritableOnly<ScheduleException> {
  doctor_username: string;
}

export interface SlotAvailability {
  readonly id: string;
  readonly availability: {
    readonly name: string;
    readonly tokens_per_slot: number;
  };
  readonly start_datetime: string;
  readonly end_datetime: string;
  readonly allocated: number;
}

export interface AppointmentCreate {
  patient: string;
  reason_for_visit: string;
}

interface AppointmentPatient {
  readonly id: string;
  readonly name: string;
  readonly gender: number;
  readonly date_of_birth: string | null;
  readonly age: number | null;
  readonly address: string;
  readonly pincode: string;
}

export interface Appointment {
  readonly id: string;
  readonly token_slot: SlotAvailability;
  readonly patient: AppointmentPatient;
  readonly booked_on: string;
  readonly booked_by: UserBase;
  status:
    | "proposed"
    | "pending"
    | "booked"
    | "arrived"
    | "fulfilled"
    | "cancelled"
    | "noshow"
    | "entered_in_error"
    | "checked_in"
    | "waitlist"
    | "in_consultation";
  readonly reason_for_visit: string;
  readonly resource: UserBase;
}