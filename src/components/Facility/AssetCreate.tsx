import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { navigate } from "raviger";
import {
  LegacyRef,
  MutableRefObject,
  RefObject,
  createRef,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { AssetClass, AssetType } from "@/components/Assets/AssetTypes";
import Loading from "@/components/Common/Loading";
import { LocationSelect } from "@/components/Common/LocationSelect";
import Page from "@/components/Common/Page";
import SwitchV2 from "@/components/Common/Switch";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import {
  FieldErrorText,
  FieldLabel,
} from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import useAppHistory from "@/hooks/useAppHistory";
import useVisibility from "@/hooks/useVisibility";

import { validateEmailAddress } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import { parseQueryParams } from "@/Utils/primitives";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { dateQueryString, parsePhoneNumber } from "@/Utils/utils";

import { FieldError, RequiredFieldValidator } from "../Form/FieldValidators";
import Form from "../Form/Form";
import { FormErrors } from "../Form/Utils";

const formErrorKeys = [
  "name",
  "asset_class",
  "description",
  "is_working",
  "serial_number",
  "location",
  "vendor_name",
  "support_name",
  "support_phone",
  "support_email",
  "manufacturer",
  "warranty_amc_end_of_validity",
  "last_serviced",
  "notes",
];

interface AssetData {
  id?: string;
  name?: string;
  location?: string;
  description?: string;
  is_working?: boolean | null;
  not_working_reason?: string;
  created_date?: string;
  modified_date?: string;
  serial_number?: string;
  asset_type?: AssetType;
  asset_class?: AssetClass;
  status?: "ACTIVE" | "TRANSFER_IN_PROGRESS";
  vendor_name?: string;
  support_name?: string;
  support_email?: string;
  support_phone?: string;
  qr_code_id?: string;
  manufacturer?: string;
  warranty_amc_end_of_validity?: string;
  serviced_on?: string;
  latest_status?: string;
  last_service?: any;
  notes: string;
}

const fieldRef = formErrorKeys.reduce(
  (acc: { [key: string]: RefObject<any> }, key) => {
    acc[key] = createRef();
    return acc;
  },
  {},
);

interface AssetProps {
  facilityId: string;
  assetId?: string;
}

type AssetFormSection =
  | "General Details"
  | "Warranty Details"
  | "Service Details";

const AssetCreate = (props: AssetProps) => {
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  const { facilityId, assetId } = props;

  const initialAssetData: AssetData = {
    id: "",
    name: "",
    location: "",
    description: "",
    is_working: null,
    not_working_reason: "",
    created_date: "",
    modified_date: "",
    serial_number: "",
    asset_type: undefined,
    asset_class: undefined,
    status: "ACTIVE",
    vendor_name: "",
    support_name: "",
    support_email: "",
    support_phone: "",
    qr_code_id: "",
    manufacturer: "",
    warranty_amc_end_of_validity: "",
    latest_status: "",
    last_service: null,
    serviced_on: "",
    notes: "",
  };

  const [initAssetData, setinitialAssetData] =
    useState<AssetData>(initialAssetData);

  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);

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

  const locationsQuery = useQuery(routes.listFacilityAssetLocation, {
    pathParams: { facility_external_id: facilityId },
    query: { limit: 1 },
  });

  const assetQuery = useQuery(routes.getAsset, {
    pathParams: { external_id: assetId! },
    prefetch: !!assetId,
    onResponse: ({ data: asset }) => {
      if (!asset) return;

      setinitialAssetData({
        id: asset.id,
        name: asset.name,
        location: asset.location_object?.id,
        description: asset.description,
        is_working: asset.is_working,
        not_working_reason: asset.not_working_reason,
        created_date: asset.created_date,
        modified_date: asset.modified_date,
        serial_number: asset.serial_number,
        asset_type: asset.asset_type,
        asset_class: asset.asset_class,
        status: asset.status,
        vendor_name: asset.vendor_name,
        support_name: asset.support_name,
        support_email: asset.support_email,
        support_phone: asset.support_phone,
        qr_code_id: asset.qr_code_id,
        manufacturer: asset.manufacturer,
        warranty_amc_end_of_validity: asset.warranty_amc_end_of_validity,
        latest_status: asset.latest_status,
        last_service: asset.last_service,
        serviced_on: asset.last_service?.serviced_on,
        notes: asset.last_service?.note,
      });
    },
  });

  const AssetFormValidator = (form: AssetData): FormErrors<AssetData> => {
    const errors: Partial<Record<keyof AssetData, FieldError>> = {}; // Initialize error object

    errors.name = RequiredFieldValidator()(form.name);

    if (form.is_working === undefined) {
      errors.is_working = t("field_required");
    }

    if (!form.location || form.location === "0" || form.location === "") {
      errors.location = t("select_local_body");
    }

    if (!form.support_phone) {
      errors.support_phone = t("field_required");
    } else {
      const checkTollFree = form.support_phone.startsWith("1800");
      const supportPhoneSimple = form.support_phone
        .replace(/[^0-9]/g, "")
        .slice(2);
      if (supportPhoneSimple.length !== 10 && !checkTollFree) {
        errors.support_phone = "Please enter valid phone number";
      } else if (
        (form.support_phone.length < 10 || form.support_phone.length > 11) &&
        checkTollFree
      ) {
        errors.support_phone = "Please enter valid phone number";
      }
    }

    if (form.support_email && !validateEmailAddress(form.support_email)) {
      errors.support_email = "Please enter valid email id";
    }

    if (form.notes && !form.serviced_on) {
      errors.serviced_on = "Last serviced on date is required with notes";
    }

    return errors;
  };

  const resetFilters = () => {
    setinitialAssetData({
      id: "",
      name: "",
      location: "",
      description: "",
      is_working: null,
      not_working_reason: "",
      created_date: "",
      modified_date: "",
      serial_number: "",
      asset_type: undefined,
      asset_class: undefined,
      status: "ACTIVE",
      vendor_name: "",
      support_name: "",
      support_email: "",
      support_phone: "",
      qr_code_id: "",
      manufacturer: "",
      warranty_amc_end_of_validity: "",
      latest_status: "",
      last_service: null,
      serviced_on: "",
      notes: "",
    });
  };

  const handleSubmitAsync = async (form: AssetData, addMore: boolean) => {
    setIsLoading(true);

    const data: any = {
      name: form.name,
      asset_type: AssetType.INTERNAL,
      asset_class: form.asset_class || "",
      description: form.description,
      is_working: form.is_working,
      not_working_reason:
        form.is_working === true ? "" : form.not_working_reason,
      serial_number: form.serial_number,
      location: form.location,
      vendor_name: form.vendor_name,
      support_name: form.support_name,
      support_email: form.support_email,
      support_phone: form.support_phone?.startsWith("1800")
        ? form.support_phone
        : parsePhoneNumber(String(form.support_phone)),
      qr_code_id: form.qr_code_id !== "" ? form.qr_code_id : null,
      manufacturer: form.manufacturer,
      warranty_amc_end_of_validity: form.warranty_amc_end_of_validity
        ? dateQueryString(form.warranty_amc_end_of_validity)
        : null,
    };

    if (form.serviced_on) {
      data["last_serviced_on"] = dateQueryString(form.serviced_on);
      data["note"] = form.notes ?? "";
    }

    try {
      if (!form.id) {
        const { res } = await request(routes.createAsset, { body: data });
        if (res?.ok) {
          Notification.Success({ msg: "Asset created successfully" });
          // Handle "Add More" logic if necessary
          if (addMore) {
            resetFilters();
            const pageContainer = window.document.getElementById("pages");
            pageContainer?.scroll(0, 0);
          } else {
            goBack();
          }
        }
      } else {
        const { res } = await request(routes.updateAsset, {
          pathParams: { external_id: form.id },
          body: data,
        });
        if (res?.ok) {
          Notification.Success({ msg: "Asset updated successfully" });
          goBack();
        }
      }
    } catch (error) {
      // Handle error (optional)
      Notification.Error({
        msg: "An error occurred while processing the asset",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseAssetId = (assetUrl: string) => {
    try {
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        setinitialAssetData({ ...initAssetData, qr_code_id: assetId });
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

  if (isLoading || locationsQuery.loading || assetQuery.loading) {
    return <Loading />;
  }

  const name: string | undefined =
    locationsQuery.data?.results[0].facility?.name || undefined;

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

  const handleOnCancel: () => void = () => {
    goBack();
  };

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
            name,
          },
          assets: { style: "text-secondary-200 pointer-events-none" },
          [assetId || "????"]: { name: name || "Asset" },
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
              <Form<AssetData>
                disabled={isLoading}
                defaults={initAssetData}
                onCancel={handleOnCancel}
                onSubmit={async (obj) => {
                  await handleSubmitAsync(obj, Boolean(assetId));
                }}
                className="rounded bg-white p-6 transition-all sm:rounded-xl sm:p-12"
                noPadding
                validate={AssetFormValidator}
                submitLabel={assetId ? t("update") : t("create_asset")}
                additionalButtons={[
                  {
                    type: "submit",
                    label: t("create_add_more"),
                    id: "create-asset-add-more-button",
                  },
                ]}
              >
                {(field) => (
                  <>
                    <div className="grid grid-cols-1 items-start gap-x-12">
                      <div className="grid grid-cols-6 gap-x-6">
                        {/* General Details Section */}
                        {sectionTitle("General Details")}
                        {/* Asset Name */}
                        <div
                          className="col-span-6"
                          ref={fieldRef["name"]}
                          data-testid="asset-name-input"
                        >
                          <TextFormField
                            {...field("name", RequiredFieldValidator())}
                            label={t("asset_name")}
                            required
                          />
                        </div>

                        {/* Location */}
                        <FieldLabel className="w-max text-sm" required>
                          {t("asset_location")}
                        </FieldLabel>
                        <div
                          ref={fieldRef["location"]}
                          className="col-span-6"
                          data-testid="asset-location-input"
                        >
                          <LocationSelect
                            name={field("location").name}
                            disabled={false}
                            selected={field("location").value}
                            setSelected={(selected) => {
                              field("location").onChange({
                                name: "location",
                                value: selected,
                              });
                            }}
                            errors={field("location").error}
                            facilityId={facilityId}
                            multiple={false}
                            showAll={false}
                          />
                        </div>

                        {/* Asset Class */}
                        <div
                          ref={fieldRef["asset_class"]}
                          className="col-span-6"
                          data-testid="asset-class-input"
                        >
                          <SelectFormField
                            disabled={
                              !!(props.assetId && !!field("asset_class").value)
                            }
                            {...field("asset_class")}
                            options={[
                              {
                                title: "ONVIF Camera",
                                value: AssetClass.ONVIF,
                              },
                              {
                                title: "HL7 Vitals Monitor",
                                value: AssetClass.HL7MONITOR,
                              },
                              {
                                title: "Ventilator",
                                value: AssetClass.VENTILATOR,
                              },
                            ]}
                            optionLabel={({ title }) => title}
                            optionValue={({ value }) => value}
                          />
                        </div>
                        {/* Description */}
                        <div
                          className="col-span-6"
                          data-testid="asset-description-input"
                        >
                          <TextAreaFormField
                            {...field("description")}
                            label={t("description")}
                            placeholder={t("details_about_the_equipment")}
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
                              (field("is_working").value === true
                                ? "my-0 opacity-0"
                                : "my-4 opacity-100")
                            }
                          />
                        </div>
                        {/* Working Status */}
                        <div
                          ref={fieldRef["is_working"]}
                          className="col-span-6"
                          data-testid="asset-working-status-input"
                        >
                          <SwitchV2
                            className="col-span-6"
                            required
                            {...field("is_working")}
                            label={t("working_status")}
                            options={["true", "false"]}
                            value={
                              String(field("is_working").value) as
                                | "true"
                                | "false"
                            }
                            onChange={(option: "true" | "false") =>
                              field("is_working").onChange({
                                name: "is_working",
                                value: option === "true",
                              })
                            }
                            optionLabel={(option: "true" | "false") => {
                              return (
                                {
                                  true: "Working",
                                  false: "Not Working",
                                }[option] || "undefined"
                              );
                            }}
                            optionClassName={(option) =>
                              option === "false" &&
                              "bg-danger-500 text-white border-danger-500 focus:ring-danger-500"
                            }
                          />
                        </div>
                        {/* Not Working Reason */}
                        <div
                          className={
                            "col-span-6" +
                            ((field("is_working").value !== false &&
                              " hidden") ||
                              "")
                          }
                        >
                          <TextAreaFormField
                            label={t("why_the_asset_is_not_working")}
                            placeholder={t(
                              "describe_why_the_asset_is_not_working",
                            )}
                            {...field("not_working_reason")}
                          />
                        </div>
                        {/* Divider */}
                        <div className="col-span-6">
                          <hr
                            className={
                              "transition-all " +
                              (field("is_working").value === true
                                ? "my-0 opacity-0"
                                : "mb-7 opacity-100")
                            }
                          />
                        </div>
                        {/* Asset QR ID */}
                        <div className="col-span-6 flex flex-row items-center gap-3">
                          <div
                            className="w-full"
                            data-testid="asset-qr-id-input"
                          >
                            <TextFormField
                              placeholder=""
                              label={t("asset_qr_id")}
                              {...field("qr_code_id")}
                            />
                          </div>
                          <div
                            className="ml-1 mt-1 flex h-10 cursor-pointer items-center justify-self-end rounded border border-secondary-400 px-4 hover:bg-secondary-200"
                            onClick={() => setIsScannerActive(true)}
                          >
                            <CareIcon
                              icon="l-focus"
                              className="cursor-pointer text-lg"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-x-6">
                        {sectionTitle("Warranty Details")}

                        {/* Manufacturer */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["manufacturer"]}
                          data-testid="asset-manufacturer-input"
                        >
                          <TextFormField
                            label={t("manufacturer")}
                            placeholder={t("eg_xyz")}
                            {...field("manufacturer")}
                          />
                        </div>

                        {/* Warranty / AMC Expiry */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["warranty_amc_end_of_validity"]}
                          data-testid="asset-warranty-input"
                        >
                          <TextFormField
                            {...field("warranty_amc_end_of_validity")}
                            label={t("warranty_amc_expiry")}
                            onChange={(event) => {
                              const { value } = event;
                              const selectedDate = dayjs(value);
                              const formattedDate =
                                selectedDate.format("YYYY-MM-DD");
                              const today = dayjs().format("YYYY-MM-DD");

                              if (selectedDate.isBefore(today)) {
                                Notification.Error({
                                  msg: "Warranty / AMC Expiry date can't be in the past",
                                });
                              } else {
                                // Update the provider's state with the valid date
                                field("warranty_amc_end_of_validity").onChange({
                                  name: "warranty_amc_end_of_validity",
                                  value: formattedDate,
                                });
                              }
                            }}
                            type="date"
                            min={dayjs().format("YYYY-MM-DD")}
                          />
                        </div>

                        {/* Customer Support Name */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["support_name"]}
                          data-testid="asset-support-name-input"
                        >
                          <TextFormField
                            label={t("customer_support_name")}
                            placeholder={t("eg_abc")}
                            {...field("support_name")}
                          />
                        </div>

                        {/* Customer Support Number */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["support_phone"]}
                          id="customer-support-phone-div"
                        >
                          <PhoneNumberFormField
                            label={t("customer_support_number")}
                            required
                            {...field("support_phone")}
                            types={["mobile", "landline", "support"]}
                          />
                        </div>

                        {/* Customer Support Email */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["support_email"]}
                          data-testid="asset-support-email-input"
                        >
                          <TextFormField
                            label={t("customer_support_email")}
                            placeholder={t("eg_mail_example_com")}
                            {...field("support_email")}
                          />
                        </div>

                        <div className="sm:col-span-3" />

                        {/* Vendor Name */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["vendor_name"]}
                          data-testid="asset-vendor-name-input"
                        >
                          <TextFormField
                            {...field("vendor_name")}
                            label={t("vendor_name")}
                            placeholder={t("eg_xyz")}
                          />
                        </div>

                        {/* Serial Number */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["serial_number"]}
                          data-testid="asset-serial-number-input"
                        >
                          <TextFormField
                            label={t("serial_number")}
                            {...field("serial_number")}
                          />
                        </div>

                        <div className="mt-6" />
                        {sectionTitle("Service Details")}

                        {/* Last serviced on */}
                        <div
                          className="col-span-6 sm:col-span-3"
                          ref={fieldRef["last_serviced_on"]}
                          data-testid="asset-last-serviced-on-input"
                        >
                          <DateFormField
                            {...field("serviced_on")}
                            label={t("last_serviced_on")}
                            className="mt-2"
                            disableFuture
                            value={
                              field("serviced_on").value
                                ? new Date(field("serviced_on").value)
                                : undefined
                            }
                            onChange={(date) => {
                              const selectedDate = dayjs(date.value).format(
                                "YYYY-MM-DD",
                              );
                              const today = new Date().toLocaleDateString(
                                "en-ca",
                              );

                              if (selectedDate > today) {
                                Notification.Error({
                                  msg: "Last Serviced date can't be in the future",
                                });
                              } else {
                                field("serviced_on").onChange({
                                  name: "serviced_on",
                                  value: selectedDate,
                                });
                              }
                            }}
                          />

                          <FieldErrorText
                            error={field("serviced_on").error}
                          ></FieldErrorText>
                        </div>

                        {/* Notes */}
                        <div
                          className="col-span-6 mt-6"
                          ref={fieldRef["notes"]}
                          data-testid="asset-notes-input"
                        >
                          <TextAreaFormField
                            label={t("notes")}
                            placeholder={t(
                              "Eg. Details on functionality, service, etc.",
                            )}
                            {...field("notes")}
                          />
                        </div>
                      </div>

                      <div className="mt-12 flex flex-wrap justify-end gap-2"></div>
                    </div>
                  </>
                )}
              </Form>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default AssetCreate;
