import { UserType } from "@/components/Users/UserFormValidations";

import { GENDER_TYPES } from "@/common/constants";

export type UserBase = {
  id: string;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  user_type: UserType;
  last_login: string;
  profile_picture_url: string;
  phone_number: string;
  gender: (typeof GENDER_TYPES)[number]["id"];
};

export type UserCreateRequest = {
  user_type: UserType;
  gender: (typeof GENDER_TYPES)[number]["id"];
  password: string;
  geo_organization: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  alt_phone_number?: string;
  date_of_birth: string;
  qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
};
