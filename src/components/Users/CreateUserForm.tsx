import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { GENDER_TYPES } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { UserBase } from "@/types/user/user";
import UserApi from "@/types/user/userApi";

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
        .min(4, t("username_more_than"))
        .max(16, t("username_less_than"))
        .regex(/^[a-z0-9._-]*$/, t("username_contain_lowercase_special"))
        .regex(/^[a-z0-9].*[a-z0-9]$/, t("username_start_end_letter_number"))
        .refine(
          (val) => !val.match(/(?:[._-]{2,})/),
          t("username_consecutive_special_characters"),
        ),
      password: z
        .string()
        .min(8, t("password_length_validation"))
        .regex(/[a-z]/, t("password_lowercase_validation"))
        .regex(/[A-Z]/, t("password_uppercase_validation"))
        .regex(/[0-9]/, t("password_number_validation")),
      c_password: z.string(),
      first_name: z.string().min(1, t("this_field_is_required")),
      last_name: z.string().min(1, t("this_field_is_required")),
      email: z.string().email(t("invalid_email")),
      phone_number: z
        .string()
        .regex(/^\+91[0-9]{10}$/, t("phone_number_must_start")),
      alt_phone_number: z
        .string()
        .regex(/^\+91[0-9]{10}$/, t("phone_number_must_start"))
        .optional(),
      phone_number_is_whatsapp: z.boolean().default(true),
      date_of_birth: z
        .date({
          required_error: t("this_field_is_required"),
        })
        .refine((dob) => dob <= new Date(), {
          message: t("date_of_birth_cannot_be_in_future"),
        }),
      gender: z.enum(["male", "female", "transgender", "non_binary"]),
      qualification: z.string().optional(),
      doctor_experience_commenced_on: z.string().optional(),
      doctor_medical_council_registration: z.string().optional(),
      geo_organization: z.string().min(1, t("this_field_is_required")),
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
  const phoneNumber = form.watch("phone_number");
  const isWhatsApp = form.watch("phone_number_is_whatsapp");

  useEffect(() => {
    if (isWhatsApp) {
      form.setValue("alt_phone_number", phoneNumber);
    }
  }, [phoneNumber, isWhatsApp, form]);

  const { mutate: createUser } = useMutation({
    mutationFn: mutate(UserApi.create),
    onSuccess: (user: UserBase) => {
      toast.success(t("user_added_successfully"));
      onSubmitSuccess?.(user!);
    },
    onError: (error) => {
      const errors = (error.cause?.errors as any[]) || [];
      errors.forEach((err) => {
        const field = err.loc[0];
        form.setError(field, { message: err.ctx.error });
      });
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    createUser({
      ...data,
      c_password: undefined,
    } as unknown as UserBase);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
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
                <FormLabel required>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
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
                <FormLabel required>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
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
              <FormLabel required>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
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
                <FormLabel required>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm password"
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
              <FormLabel required>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
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
                <FormLabel required>Phone Number</FormLabel>
                <FormControl>
                  <Input
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
                <FormLabel required>WhatsApp Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+91XXXXXXXXXX"
                    type="tel"
                    {...field}
                    maxLength={13}
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
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>WhatsApp number is same as phone number</FormLabel>
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
                <FormLabel required>Date of Birth</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onChange={(date) => field.onChange(date)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
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
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_TYPES.map((gender) => (
                      <SelectItem key={gender.id} value={gender.id}>
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
                <FormLabel>Qualification</FormLabel>
                <FormControl>
                  <Input placeholder="Qualification" {...field} />
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
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Years of experience"
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
                    <FormLabel>Medical Council Registration</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Medical council registration"
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
          disabled={!form.formState.isDirty || !form.formState.isValid}
        >
          Create User
        </Button>
      </form>
    </Form>
  );
}
