import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/input-password";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { validateRule } from "@/components/Users/UserFormValidations";

import { GENDER_TYPES } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { UserBase } from "@/types/user/user";
import UserApi from "@/types/user/userApi";
import userApi from "@/types/user/userApi";

interface Props {
  onSubmitSuccess?: (user: UserBase) => void;
}

export default function CreateUserForm({ onSubmitSuccess }: Props) {
  const { t } = useTranslation();

  const userFormSchema = z
    .object({
      user_type: z.enum(["doctor", "nurse", "staff", "volunteer"]),
      username: z
        .string()
        .min(4, t("username_min_length_validation"))
        .max(16, t("username_max_length_validation"))
        .regex(/^[a-z0-9._-]*$/, t("username_characters_validation"))
        .regex(/^[a-z0-9].*[a-z0-9]$/, t("username_start_end_validation"))
        .refine(
          (val) => !val.match(/(?:[._-]{2,})/),
          t("username_consecutive_validation"),
        ),
      password: z
        .string()
        .min(8, t("password_length_validation"))
        .regex(/[a-z]/, t("password_lowercase_validation"))
        .regex(/[A-Z]/, t("password_uppercase_validation"))
        .regex(/[0-9]/, t("password_number_validation")),
      c_password: z.string(),
      first_name: z.string().min(1, t("field_required")),
      last_name: z.string().min(1, t("field_required")),
      email: z.string().email(t("invalid_email")),
      phone_number: z
        .string()
        .regex(/^\+91[0-9]{10}$/, t("phone_number_must_start")),
      alt_phone_number: z
        .string()
        .refine(
          (val) => val === "" || /^\+91[0-9]{10}$/.test(val),
          t("phone_number_must_start"),
        )
        .transform((val) => val || undefined)
        .optional(),
      phone_number_is_whatsapp: z.boolean().default(true),
      date_of_birth: z
        .string({
          required_error: t("field_required"),
        })
        .refine(
          (dob) => {
            const date = new Date(dob);
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - 120);
            return minDate <= date && date <= new Date();
          },
          {
            message: t("date_of_birth_cannot_be_in_future"),
          },
        ),
      gender: z.enum(
        GENDER_TYPES.map((gender) => gender.id) as [
          (typeof GENDER_TYPES)[number]["id"],
        ],
      ),
      qualification: z
        .string()
        .optional()
        .transform((val) => val || undefined),
      doctor_experience_commenced_on: z
        .string()
        .optional()
        .transform((val) => val || undefined),
      doctor_medical_council_registration: z
        .string()
        .optional()
        .transform((val) => val || undefined),
      geo_organization: z.string().min(1, t("field_required")),
    })
    .refine((data) => data.password === data.c_password, {
      message: t("password_mismatch"),
      path: ["c_password"],
    });

  type UserFormValues = z.infer<typeof userFormSchema>;

  const form = useForm<UserFormValues>({
    mode: "onChange",
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      user_type: "staff",
      phone_number: "+91",
      alt_phone_number: "+91",
      phone_number_is_whatsapp: true,
      gender: "male",
    },
  });

  const userType = form.watch("user_type");
  const usernameInput = form.watch("username");
  const phoneNumber = form.watch("phone_number");
  const isWhatsApp = form.watch("phone_number_is_whatsapp");
  const password = form.watch("password");
  const c_password = form.watch("c_password");

  useEffect(() => {
    if (isWhatsApp) {
      form.setValue("alt_phone_number", phoneNumber);
    }
    if (usernameInput && usernameInput.length > 0) {
      form.trigger("username");
    }
    if (password?.length && c_password?.length && password !== c_password) {
      form.setError("c_password", { message: t("password_mismatch") });
      form.setError("password", { message: t("password_mismatch") });
    } else {
      form.clearErrors("c_password");
      form.clearErrors("password");
    }
  }, [phoneNumber, isWhatsApp, form, usernameInput, c_password, password]);

  const { isLoading: isUsernameChecking, isError: isUsernameTaken } = useQuery({
    queryKey: ["checkUsername", usernameInput],
    queryFn: query(userApi.checkUsername, {
      pathParams: { username: usernameInput },
      silent: true,
    }),
    enabled: !form.formState.errors.username,
  });

  const renderUsernameFeedback = (usernameInput: string) => {
    const {
      errors: { username },
    } = form.formState;
    const isInitialRender = usernameInput === "";

    if (username?.message) {
      return validateRule(
        false,
        username.message,
        isInitialRender,
        t("username_valid"),
      );
    } else if (isUsernameChecking) {
      return (
        <div className="flex items-center gap-1">
          <CareIcon
            icon="l-spinner"
            className="text-sm text-gray-500 animate-spin"
          />
          <span className="text-gray-500 text-sm">
            {t("checking_availability")}
          </span>
        </div>
      );
    } else if (usernameInput) {
      return validateRule(
        !isUsernameTaken,
        t("username_not_available"),
        isInitialRender,
        t("username_available"),
      );
    }
  };

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: mutate(UserApi.create),
    onSuccess: (user: UserBase) => {
      toast.success(t("user_added_successfully"));
      onSubmitSuccess?.(user!);
    },
    onError: (error) => {
      const errors = (error.cause?.errors as any[]) || [];
      errors.forEach((err) => {
        const field = err.loc[0];
        form.setError(field, { message: err.ctx?.error || err.msg });
      });
    },
  });

  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    createUser({
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_number,
      alt_phone_number: data.alt_phone_number,
      date_of_birth: data.date_of_birth,
      geo_organization: data.geo_organization,
      user_type: data.user_type,
      gender: data.gender,
      password: data.password,
      qualification: data.qualification,
      doctor_experience_commenced_on: data.doctor_experience_commenced_on,
      doctor_medical_council_registration:
        data.doctor_medical_council_registration,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("user_type")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-cy="user-type-select">
                    <SelectValue placeholder={t("select_user_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="doctor">{t("doctor")}</SelectItem>
                  <SelectItem value="nurse">{t("nurse")}</SelectItem>
                  <SelectItem value="staff">{t("staff")}</SelectItem>
                  <SelectItem value="volunteer">{t("volunteer")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("first_name")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="first-name-input"
                    placeholder={t("first_name")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("last_name")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="last-name-input"
                    placeholder={t("last_name")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("username")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    data-cy="username-input"
                    placeholder={t("username")}
                    {...field}
                  />
                </div>
              </FormControl>
              {renderUsernameFeedback(usernameInput)}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("password")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-cy="password-input"
                    placeholder={t("password")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="c_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("confirm_password")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-cy="confirm-password-input"
                    placeholder={t("confirm_password")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  data-cy="email-input"
                  type="email"
                  placeholder={t("email")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("phone_number")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="phone-number-input"
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    maxLength={13}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alt_phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("alternate_phone_number")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="alt-phone-number-input"
                    placeholder="+91XXXXXXXXXX"
                    type="tel"
                    maxLength={13}
                    {...field}
                    disabled={isWhatsApp}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone_number_is_whatsapp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  data-cy="whatsapp-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t("whatsapp_number_same_as_phone_number")}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("date_of_birth")}</FormLabel>
                <FormControl>
                  <Input data-cy="dob-input" type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("gender")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-cy="gender-select">
                      <SelectValue placeholder={t("select_gender")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_TYPES.map((gender) => (
                      <SelectItem
                        key={gender.id}
                        value={gender.id}
                        data-cy={`gender-${gender.id}`}
                      >
                        {gender.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(userType === "doctor" || userType === "nurse") && (
          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("qualification")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="qualification-input"
                    placeholder={t("qualification")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {userType === "doctor" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doctor_experience_commenced_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("years_of_experience")}</FormLabel>
                    <FormControl>
                      <Input
                        data-cy="experience-input"
                        type="number"
                        placeholder={t("years_of_experience")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctor_medical_council_registration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("medical_council_registration")}</FormLabel>
                    <FormControl>
                      <Input
                        data-cy="medical-registration-input"
                        placeholder={t("medical_council_registration")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
        <FormField
          control={form.control}
          name="geo_organization"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <OrganizationSelector
                  data-cy="organization-selector"
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          data-cy="submit-user-form"
          disabled={
            !form.formState.isDirty || !form.formState.isValid || isPending
          }
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
          {t("create_user")}
        </Button>
      </form>
    </Form>
  );
}
