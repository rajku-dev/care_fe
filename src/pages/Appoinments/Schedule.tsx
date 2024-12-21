import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import { FacilityModel } from "@/components/Facility/models";
import { SlotAvailability } from "@/components/Schedule/types";

import { CarePatientTokenKey } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { RequestResult } from "@/Utils/request/types";
import { dateQueryString } from "@/Utils/utils";
import { TokenData } from "@/types/auth/otpToken";

interface AppointmentsProps {
  facilityId: string;
  staffExternalId: string;
}

export function ScheduleAppointment(props: AppointmentsProps) {
  const { t } = useTranslation();
  const { facilityId, staffExternalId } = props;
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability>();
  const [reason, setReason] = useState("");

  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(CarePatientTokenKey) || "{}",
  );

  if (!staffExternalId) {
    Notification.Error({ msg: "Staff username not found" });
    navigate(`/facility/${facilityId}/`);
  } else if (!tokenData) {
    Notification.Error({ msg: "Phone number not found" });
    navigate(
      `/facility/${facilityId}/appointments/${staffExternalId}/otp/send`,
    );
  }

  const { data: facilityResponse, error: facilityError } = useQuery<
    RequestResult<FacilityModel>
  >({
    queryKey: ["facility", facilityId],
    queryFn: () =>
      request(routes.getAnyFacility, {
        pathParams: { id: facilityId },
        silent: true,
      }),
  });

  if (facilityError) {
    Notification.Error({ msg: "Error while fetching facility data" });
  }

  const { data: userData, error: userError } = useQuery({
    queryKey: ["user", staffExternalId],
    queryFn: () =>
      request(routes.getUserBareMinimum, {
        pathParams: { facilityId: facilityId, userExternalId: staffExternalId },
      }),
    enabled: !!staffExternalId,
  });

  if (userError) {
    Notification.Error({ msg: "Error while fetching user data" });
  }

  const slotsQuery = useQuery<{ results: SlotAvailability[] }>({
    queryKey: ["slots", facilityId, staffExternalId, selectedDate],
    queryFn: query(routes.otp.getAvailableSlotsForADay, {
      body: {
        facility: facilityId,
        resource: staffExternalId,
        day: dateQueryString(selectedDate),
      },
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
      silent: true,
    }),
    enabled: !!selectedDate && !!tokenData.token,
  });

  if (slotsQuery.error) {
    if (
      slotsQuery.error.cause?.errors &&
      Array.isArray(slotsQuery.error.cause.errors) &&
      slotsQuery.error.cause.errors[0][0] === "Resource is not schedulable"
    ) {
      Notification.Error({
        msg: t("user_not_available_for_appointments"),
      });
    } else {
      Notification.Error({ msg: t("error_fetching_slots_data") });
    }
  }

  useEffect(() => {
    setSelectedSlot(undefined);
  }, [selectedDate]);

  const renderDay = (date: Date) => {
    const isSelected = date.toDateString() === selectedDate?.toDateString();

    return (
      <button
        onClick={() => setSelectedDate(date)}
        className={cn(
          "h-full w-full hover:bg-gray-50 rounded-lg",
          isSelected ? "bg-white ring-2 ring-primary-500" : "bg-gray-100",
        )}
      >
        <span>{date.getDate()}</span>
      </button>
    );
  };

  if (!userData?.data) {
    return <Loading />;
  }

  const user = userData.data;

  const slotsData = slotsQuery.data?.results;
  const morningSlots = slotsData?.filter((slot) => {
    const slotTime = parseISO(slot.start_datetime);
    return slotTime.getHours() < 12;
  });

  const eveningSlots = slotsData?.filter((slot) => {
    const slotTime = parseISO(slot.start_datetime);
    return slotTime.getHours() >= 12;
  });

  const getSlotButtons = (slots: SlotAvailability[] | undefined) => {
    if (!slots) return [];
    return slots.map((slot) => (
      <Button
        key={slot.id}
        variant={selectedSlot?.id === slot.id ? "primary" : "outline"}
        onClick={() => {
          if (selectedSlot?.id === slot.id) {
            setSelectedSlot(undefined);
          } else {
            setSelectedSlot(slot);
          }
        }}
        disabled={!slot.availability.tokens_per_slot}
      >
        {format(slot.start_datetime, "HH:mm a")}
      </Button>
    ));
  };

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="flex px-2 pb-4 justify-start">
          <Button
            variant="outline"
            asChild
            className="border border-secondary-400"
          >
            <Link href={`/facility/${facilityId}`}>
              <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
              <span className="text-sm underline">Back</span>
            </Link>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-1/3">
            <Card className={cn("overflow-hidden bg-white")}>
              <div className="flex flex-col">
                <div className="flex flex-col gap-4 py-4 justify-between h-full">
                  <Avatar
                    imageUrl={user.read_profile_picture_url}
                    name={`${user.first_name} ${user.last_name}`}
                    className="h-96 w-96 self-center rounded-sm"
                  />

                  <div className="flex grow flex-col px-4">
                    <h3 className="truncate text-xl font-semibold">
                      {user.user_type === "Doctor"
                        ? `Dr. ${user.first_name} ${user.last_name}`
                        : `${user.first_name} ${user.last_name}`}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.user_type}
                    </p>

                    {/* <p className="text-xs mt-4">Education: </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.qualification}
                    </p> */}
                  </div>
                </div>

                <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {facilityResponse?.data?.name}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="flex-1 mx-2">
            <div className="flex flex-col gap-6">
              <span className="text-base font-semibold">
                Book an Appointment with{" "}
                {user.user_type === "Doctor"
                  ? `Dr. ${user.first_name} ${user.last_name}`
                  : `${user.first_name} ${user.last_name}`}
              </span>
              <div>
                <Label className="mb-2">Reason for visit</Label>
                <Textarea
                  placeholder="Type the reason for visit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Calendar
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                renderDay={renderDay}
                highlightToday={false}
              />
              <div className="space-y-6">
                {slotsData &&
                ((morningSlots && morningSlots.length > 0) ||
                  (eveningSlots && eveningSlots.length > 0)) ? (
                  <div>
                    <span className="mb-6 text-xs">
                      {t("available_time_slots")}
                    </span>
                    <div className="flex flex-col gap-4">
                      {morningSlots && morningSlots.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t("morning_slots")}: {morningSlots?.length}{" "}
                            {morningSlots.length > 1 ? "Slots" : "Slot"}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {getSlotButtons(morningSlots)}
                          </div>
                        </div>
                      )}
                      {eveningSlots && eveningSlots.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t("evening_slots")}: {eveningSlots.length}{" "}
                            {eveningSlots.length > 1 ? "Slots" : "Slot"}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {getSlotButtons(eveningSlots)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>{t("no_slots_available")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-secondary-200 h-20">
        {selectedSlot?.id && (
          <div className="container mx-auto flex flex-row justify-end mt-6">
            <Button
              variant="primary_gradient"
              onClick={() => {
                localStorage.setItem(
                  "selectedSlot",
                  JSON.stringify(selectedSlot),
                );
                localStorage.setItem("reason", reason);
                navigate(
                  `/facility/${facilityId}/appointments/${staffExternalId}/patient-select`,
                );
              }}
            >
              <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
              Continue
              <CareIcon icon="l-arrow-right" className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}