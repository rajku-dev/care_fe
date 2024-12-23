import { z } from "zod";

import { validateEmailAddress } from "@/common/validation";

export const AssetFormSchema = z
  .object({
    name: z.string().min(1, "Asset name is required"),
    location: z.string().min(1, "Location is required"),
    asset_class: z.string().optional(),
    description: z.string().optional(),
    is_working: z.boolean().default(true),
    not_working_reason: z.string().optional(),
    qr_code_id: z.string().optional(),
    manufacturer: z.string().optional(),
    warranty_amc_end_of_validity: z.date({
      required_error: "Warranty/AMC expiry date is required",
    }),
    support_name: z.string().optional(),
    support_phone: z.string().refine(
      (value) => {
        const supportPhoneSimple = value.replace(/[^0-9]/g, "").slice(2);
        const checkTollFree = value.startsWith("1800");
        return checkTollFree
          ? value.length >= 10 && value.length <= 11
          : supportPhoneSimple.length === 10;
      },
      {
        message: "Please enter a valid phone number",
      },
    ),
    support_email: z
      .string()
      .optional()
      .refine(
        (value) => {
          return !value || validateEmailAddress(value);
        },
        {
          message: "Please enter valid email id",
        },
      ),
    vendor_name: z.string().optional(),
    serial_number: z.string().optional(),
    serviced_on: z
      .date({
        required_error: "Serviced on date is required",
      })
      .optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_working && !data.not_working_reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid reason",
        path: ["not_working_reason"],
      });
    }
  });
