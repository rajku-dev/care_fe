import { zodResolver } from "@hookform/resolvers/zod";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { format } from "date-fns";
import { navigate } from "raviger";
import { LegacyRef, MutableRefObject, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { AssetClass, AssetType } from "@/components/Assets/AssetTypes";
import Loading from "@/components/Common/Loading";
import { LocationSelect } from "@/components/Common/LocationSelect";
import Page from "@/components/Common/Page";
import { AssetFormSchema } from "@/components/Facility/AssetFormSchema";

import useAppHistory from "@/hooks/useAppHistory";
import useVisibility from "@/hooks/useVisibility";

import * as Notification from "@/Utils/Notifications";
import { parseQueryParams } from "@/Utils/primitives";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { dateQueryString, parsePhoneNumber } from "@/Utils/utils";

interface AssetProps {
  facilityId: string;
  assetId?: string;
}

type AssetFormSection =
  | "General Details"
  | "Warranty Details"
  | "Service Details";

const AssetCreate = (props: AssetProps) => {
  const [addMore, setAddMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  const { facilityId, assetId } = props;

  const onSubmit = async (values: FormData) => {
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0] as keyof FormData;
      form.setFocus(firstErrorField, { shouldSelect: true });
      const firstErrorElement = document.querySelector(
        `[name=${firstErrorField}]`,
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
    setLoading(true);

    const data: any = {
      name: values.name,
      asset_type: AssetType.INTERNAL,
      asset_class: values.asset_class || "",
      description: values.description,
      is_working: values.is_working,
      not_working_reason: values.is_working ? "" : values.not_working_reason,
      serial_number: values.serial_number,
      location: values.location,
      vendor_name: values.vendor_name,
      support_name: values.support_name,
      support_email: values.support_email,
      support_phone: values.support_phone?.startsWith("1800")
        ? values.support_phone
        : parsePhoneNumber(String(values.support_phone)),
      qr_code_id: values.qr_code_id !== "" ? values.qr_code_id : null,
      manufacturer: values.manufacturer,
      warranty_amc_end_of_validity: values.warranty_amc_end_of_validity
        ? dateQueryString(values.warranty_amc_end_of_validity)
        : null,
    };

    console.log(data);

    if (values.serviced_on) {
      data["last_serviced_on"] = dateQueryString(values.serviced_on);
      data["note"] = values.note ?? "";
    }

    // If the assetId is not null, it means we are updating an asset
    if (!assetId) {
      const { res } = await request(routes.createAsset, { body: data });
      if (res?.ok) {
        Notification.Success({ msg: "Asset created successfully" });
        if (addMore) {
          form.reset();
          const pageContainer = window.document.getElementById("pages");
          pageContainer?.scroll(0, 0);
          setAddMore(false);
        } else {
          goBack();
        }
      }
      setLoading(false);
    } else {
      const { res } = await request(routes.updateAsset, {
        pathParams: { external_id: assetId },
        body: data,
      });
      if (res?.ok) {
        Notification.Success({ msg: "Asset updated successfully" });
        goBack();
      }
      setLoading(false);
    }
  };
  const parseAssetId = (assetUrl: string) => {
    try {
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        form.setValue("qr_code_id", assetId);
        form.clearErrors("qr_code_id");
        setIsScannerActive(false);
        return;
      }
    } catch (err) {
      console.error(err);
      Notification.Error({ msg: err });
    }
    Notification.Error({ msg: "Invalid Asset Id" });
    setIsScannerActive(false);
  };

  type FormData = z.infer<typeof AssetFormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(AssetFormSchema),
    defaultValues: {
      name: "",
      location: "",
      asset_class: AssetClass.NONE,
      description: "",
      is_working: true,
      not_working_reason: "",
      qr_code_id: "",
      manufacturer: "",
      warranty_amc_end_of_validity: new Date(),
      support_name: "",
      support_phone: "",
      support_email: "",
      vendor_name: "",
      serial_number: "",
      serviced_on: new Date(),
      note: "",
    },
  });

  const {
    formState: { errors, isDirty },
  } = form;

  const [currentSection, setCurrentSection] =
    useState<AssetFormSection>("General Details");

  const [generalDetailsVisible, generalDetailsRef] = useVisibility();
  const [warrantyDetailsVisible, warrantyDetailsRef] = useVisibility(-300);
  const [serviceDetailsVisible, serviceDetailsRef] = useVisibility(-300);

  const sections: {
    [key in AssetFormSection]: {
      icon: IconName;
      isVisible: boolean;
      ref: MutableRefObject<HTMLElement | undefined>;
    };
  } = {
    "General Details": {
      icon: "l-info-circle",
      isVisible: generalDetailsVisible,
      ref: generalDetailsRef,
    },
    "Warranty Details": {
      icon: "l-qrcode-scan",
      isVisible: warrantyDetailsVisible,
      ref: warrantyDetailsRef,
    },
    "Service Details": {
      icon: "l-wrench",
      isVisible: serviceDetailsVisible,
      ref: serviceDetailsRef,
    },
  };

  useEffect(() => {
    setCurrentSection((currentSection) => {
      let sectionNow = currentSection;
      if (serviceDetailsVisible) sectionNow = "Service Details";
      if (warrantyDetailsVisible) sectionNow = "Warranty Details";
      if (generalDetailsVisible) sectionNow = "General Details";
      return sectionNow;
    });
  }, [generalDetailsVisible, warrantyDetailsVisible, serviceDetailsVisible]);

  const locationsQuery = useTanStackQueryInstead(
    routes.listFacilityAssetLocation,
    {
      pathParams: { facility_external_id: facilityId },
      query: { limit: 1 },
    },
  );

  const assetQuery = useTanStackQueryInstead(routes.getAsset, {
    pathParams: { external_id: String(assetId) },
    prefetch: !!assetId,
    onResponse: ({ data: asset }) => {
      console.log("Asset Data:", asset);
      if (!asset) return;
      form.reset({
        name: asset.name,
        location: asset.location_object.id,
        asset_class: asset.asset_class,
        description: asset.description,
        is_working: asset.is_working,
        not_working_reason: asset.not_working_reason,
        qr_code_id: asset.qr_code_id || "",
        manufacturer: asset.manufacturer,
        warranty_amc_end_of_validity:
          new Date(asset.warranty_amc_end_of_validity) || new Date(),
        support_name: asset.support_name,
        support_phone: asset.support_phone,
        support_email: asset.support_email,
        vendor_name: asset.vendor_name,
        serial_number: asset.serial_number,
        serviced_on: asset.last_service?.serviced_on
          ? new Date(asset.last_service.serviced_on)
          : new Date(),
        note: asset.last_service?.note,
      });
    },
  });

  if (loading || locationsQuery.loading || assetQuery.loading) {
    return <Loading />;
  }

  const name = form.watch("name");

  if (locationsQuery.data?.count === 0) {
    return (
      <Page
        title={assetId ? t("update_asset") : t("create_new_asset")}
        crumbsReplacements={{
          assets: { style: "text-secondary-200 pointer-events-none" },
          [assetId || "????"]: { name },
        }}
        backUrl={`/facility/${facilityId}`}
      >
        <section className="text-center">
          <h1 className="flex flex-col items-center py-10 text-6xl">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-secondary-200 p-5">
              <CareIcon icon="l-map-marker" className="text-green-600" />
            </div>
          </h1>
          <p className="text-secondary-600">
            {t("you_need_at_least_a_location_to_create_an_assest")}
          </p>
          <button
            className="btn-primary btn mt-5"
            onClick={() => navigate(`/facility/${facilityId}/location/add`)}
          >
            <CareIcon icon="l-plus" className="mr-2 text-white" />
            {t("add_location")}
          </button>
        </section>
      </Page>
    );
  }

  if (isScannerActive)
    return (
      <div className="mx-auto my-2 flex w-full flex-col items-end justify-start md:w-1/2">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <CareIcon icon="l-times" className="mr-2 text-lg" />
          {t("close_scanner")}
        </button>
        <Scanner
          onScan={(detectedCodes: IDetectedBarcode[]) => {
            if (detectedCodes.length > 0) {
              const text = detectedCodes[0].rawValue;
              if (text) {
                parseAssetId(text);
              }
            }
          }}
          onError={(e: unknown) => {
            const errorMessage =
              e instanceof Error ? e.message : "Unknown error";
            Notification.Error({
              msg: errorMessage,
            });
          }}
          scanDelay={3000}
        />
        <h2 className="self-center text-center text-lg">
          {t("scan_asset_qr")}
        </h2>
      </div>
    );

  const sectionId = (section: AssetFormSection) =>
    section.toLowerCase().replace(" ", "-");

  const sectionTitle = (sectionTitle: AssetFormSection) => {
    const section = sections[sectionTitle];
    return (
      <div
        id={sectionId(sectionTitle)}
        className="col-span-6 -ml-2 mb-6 flex flex-row items-center"
        ref={section.ref as LegacyRef<HTMLDivElement>}
      >
        <CareIcon icon={section.icon} className="mr-3 text-lg" />
        <label className="text-lg font-bold text-secondary-900">
          {sectionTitle}
        </label>
        <hr className="ml-6 flex-1 border border-secondary-400" />
      </div>
    );
  };

  return (
    <div className="relative flex flex-col">
      <Page
        title={`${assetId ? t("update") : t("create")} Asset`}
        className="grow-0 pl-6"
        crumbsReplacements={{
          [facilityId]: {
            name: locationsQuery.data?.results[0].facility?.name,
          },
          assets: { style: "text-secondary-200 pointer-events-none" },
          [assetId || "????"]: { name },
        }}
        backUrl={
          assetId
            ? `/facility/${facilityId}/assets/${assetId}`
            : `/facility/${facilityId}`
        }
      >
        <div className="top-0 mt-5 flex grow-0 sm:mx-auto">
          <div className="fixed mt-4 hidden h-full w-72 flex-col xl:flex">
            {Object.keys(sections).map((sectionTitle) => {
              const isCurrent = currentSection === sectionTitle;
              const section = sections[sectionTitle as AssetFormSection];
              return (
                <button
                  className={`flex w-full items-center justify-start gap-3 rounded-l-lg px-5 py-3 font-medium ${
                    isCurrent ? "bg-white text-primary-500" : "bg-transparent"
                  } transition-all duration-100 ease-in hover:bg-white hover:tracking-wider`}
                  onClick={() => {
                    section.ref.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    setCurrentSection(sectionTitle as AssetFormSection);
                  }}
                >
                  <CareIcon icon={section.icon} className="text-lg" />
                  <span>{sectionTitle}</span>
                </button>
              );
            })}
          </div>
          <div className="flex h-full w-full overflow-auto xl:ml-72">
            <div className="w-full max-w-3xl 2xl:max-w-4xl">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="rounded bg-white p-6 transition-all sm:rounded-xl sm:p-12"
                >
                  <div className="grid grid-cols-1 items-start gap-x-12">
                    <div className="grid grid-cols-6 gap-x-6">
                      {/* General Details Section */}
                      {sectionTitle("General Details")}
                      {/* Asset Name */}
                      <div
                        className="col-span-6"
                        data-testid="asset-name-input"
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Asset Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Asset Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Location */}
                      <div
                        className="col-span-6"
                        data-testid="asset-location-input"
                      >
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">Location</FormLabel>
                              <FormControl>
                                <LocationSelect
                                  name={field.name}
                                  selected={field.value}
                                  setSelected={field.onChange}
                                  facilityId={facilityId}
                                  disabled={false}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Asset Class */}
                      <div
                        className="col-span-6"
                        data-testid="asset-class-input"
                      >
                        <FormField
                          control={form.control}
                          name="asset_class"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Asset Class
                              </FormLabel>
                              <Select
                                disabled={
                                  !!(
                                    props.assetId &&
                                    form.getValues("asset_class")
                                  )
                                }
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a class" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={AssetClass.ONVIF}>
                                    ONVIF Camera
                                  </SelectItem>
                                  <SelectItem value={AssetClass.HL7MONITOR}>
                                    HL7 Vitals Monitor
                                  </SelectItem>
                                  <SelectItem value={AssetClass.VENTILATOR}>
                                    Ventilator
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Description */}
                      <div
                        className="col-span-6"
                        data-testid="asset-description-input"
                      >
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Description
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Details about the equipment"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Divider */}
                      <div
                        className="col-span-6"
                        data-testid="asset-divider-input"
                      >
                        <hr
                          className={
                            "transition-all " +
                            (form.getValues("is_working")
                              ? "my-0 opacity-0"
                              : "my-4 opacity-100")
                          }
                        />
                      </div>
                      {/* Working Status */}
                      <div
                        className="col-span-6"
                        data-testid="asset-working-status-input"
                      >
                        <FormField
                          control={form.control}
                          name="is_working"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Working Status
                              </FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Not Working Reason */}
                      {!form.getValues("is_working") && (
                        <div className="col-span-6">
                          <FormField
                            control={form.control}
                            name="not_working_reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Why the asset is not working?
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Reason for not working"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      {/* Divider */}
                      <div className="col-span-6">
                        <hr
                          className={
                            "transition-all " +
                            (form.getValues("is_working")
                              ? "my-0 opacity-0"
                              : "mb-7 opacity-100")
                          }
                        />
                      </div>

                      {/* QR Code ID */}
                      <div className="col-span-6 flex flex-row items-center gap-2">
                        <FormField
                          control={form.control}
                          name="qr_code_id"
                          render={({ field }) => (
                            <FormItem className="flex-grow justify-center items-center">
                              <FormLabel className="mt-3">QR Code ID</FormLabel>
                              <FormControl>
                                <Input placeholder="QR Code ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div
                          className="mt-5 flex h-8 cursor-pointer items-center justify-center rounded border border-secondary-400 px-4 hover:bg-secondary-200"
                          onClick={() => setIsScannerActive(true)}
                        >
                          <CareIcon
                            icon="l-focus"
                            className="cursor-pointer text-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manufacturer */}
                    <div className="grid grid-cols-6 gap-x-6">
                      <div className="mt-6" />
                      {sectionTitle("Warranty Details")}
                      <div
                        className="col-span-6 sm:col-span-3"
                        data-testid="asset-manufacturer-input"
                      >
                        <FormField
                          control={form.control}
                          name="manufacturer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Manufacturer
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Manufacturer" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Warranty / AMC Expiry */}
                      <div
                        className="col-span-6 sm:col-span-3"
                        data-testid="asset-warranty-input"
                      >
                        <FormField
                          control={form.control}
                          name="warranty_amc_end_of_validity"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="mt-3">
                                Warranty / AMC Expiry
                              </FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CareIcon
                                        icon="l-calender"
                                        className="ml-auto h-4 w-4 opacity-50"
                                      />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date: Date) => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0); // Clear time component
                                      return (
                                        date < today ||
                                        date < new Date("1900-01-01")
                                      );
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Customer Support Name */}
                      <div
                        className="col-span-6 sm:col-span-3"
                        data-testid="asset-support-name-input"
                      >
                        <FormField
                          control={form.control}
                          name="support_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Customer Support Name
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Support Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Customer Support Phone */}
                      <div
                        className="col-span-6 sm:col-span-3"
                        id="customer-support-phone-div"
                      >
                        <FormField
                          control={form.control}
                          name="support_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Customer Support Phone
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Phone Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Customer Support Email */}
                      <div
                        className="col-span-6 sm:col-span-3"
                        data-testid="asset-support-email-input"
                      >
                        <FormField
                          control={form.control}
                          name="support_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Customer Support Email
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Email Address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Vendor name */}
                      <div
                        className="col-span-6 sm:col-span-3"
                        data-testid="asset-vendor-name-input"
                      >
                        <FormField
                          control={form.control}
                          name="vendor_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Vendor Name
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Vendor Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Serial Number */}
                      <div
                        className="col-span-6 sm:col-span-3 mb-6"
                        data-testid="asset-serial-number-input"
                      >
                        <FormField
                          control={form.control}
                          name="serial_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">
                                Serial Number
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Serial Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {sectionTitle("Service Details")}

                      {/* Serviced On */}
                      <div
                        className="col-span-6 sm:col-span-3"
                        data-testid="asset-last-serviced-on-input"
                      >
                        <FormField
                          control={form.control}
                          name="serviced_on"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="mt-3">
                                Last Serviced On
                              </FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CareIcon
                                        icon="l-calender"
                                        className="ml-auto h-4 w-4 opacity-50"
                                      />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date: Date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Notes */}
                      <div
                        className="col-span-6 mt-6"
                        data-testid="asset-notes-input"
                      >
                        <FormField
                          control={form.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-3">Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add notes here"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Cancel Button */}
                  <div className="mt-12 flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          assetId
                            ? `/facility/${facilityId}/assets/${assetId}`
                            : `/facility/${facilityId}`,
                        )
                      }
                    >
                      {t("cancel")}
                    </Button>
                    {/* Submit Button */}
                    <Button type="submit" disabled={!isDirty}>
                      {assetId ? t("update") : t("create_asset")}
                    </Button>
                    {/* Create and Add More Button */}
                    {!assetId && (
                      <Button
                        type="submit"
                        variant="default"
                        disabled={!isDirty}
                        data-testid="create-asset-add-more-button"
                        onClick={() => setAddMore(true)}
                      >
                        {t("create_add_more")}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default AssetCreate;
