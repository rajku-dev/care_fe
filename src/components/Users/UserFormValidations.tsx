import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";
import { UserCreateRequest } from "@/types/user/user";

export type UserType = "doctor" | "nurse" | "staff" | "volunteer";

export type Gender = "male" | "female" | "non_binary" | "transgender";

export const newUserFields: Array<keyof UserCreateRequest> = [
  "user_type",
  "username",
  "password",
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "gender",
  "geo_organization",
];

export const editUserFields: Array<keyof UserCreateRequest> = [
  "first_name",
  "last_name",
  "gender",
  "email",
  "phone_number",
];

export const editBasicInfoFields: Array<keyof UserCreateRequest> = [
  "first_name",
  "last_name",
  "gender",
];

export const editContactInfoFields: Array<keyof UserCreateRequest> = [
  "email",
  "phone_number",
];

export const validateRule = (
  condition: boolean,
  content: JSX.Element | string,
  isInitialState: boolean = false,
) => {
  return (
    <div>
      {isInitialState ? (
        <CareIcon icon="l-circle" className="text-xl text-gray-500" />
      ) : condition ? (
        <CareIcon icon="l-check-circle" className="text-xl text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
      )}{" "}
      <span
        className={classNames(
          isInitialState
            ? "text-black"
            : condition
              ? "text-primary-500"
              : "text-red-500",
        )}
      >
        {content}
      </span>
    </div>
  );
};
