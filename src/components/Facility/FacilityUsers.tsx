import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import UserListAndCardView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";

export default function FacilityUsers(props: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: 15,
    cacheBlacklist: ["username"],
  });
  const [activeTab, setActiveTab] = useView("users", "card");

  const { facilityId } = props;

  let usersList: JSX.Element = <></>;

  const { data: userListData, isLoading: userListLoading } = useQuery({
    queryKey: ["facilityUsers", facilityId, qParams],
    queryFn: query.debounced(routes.facility.getUsers, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        username: qParams.username,
        limit: qParams.limit,
        offset: (qParams.page - 1) * qParams.limit,
      },
    }),
    enabled: !!facilityId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

  if (userListLoading || !userListData) {
    usersList =
      activeTab === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      ) : (
        <TableSkeleton count={7} />
      );
  } else {
    usersList = (
      <div>
        <UserListAndCardView
          users={userListData?.results ?? []}
          activeTab={activeTab === "card" ? "card" : "list"}
        />
        <Pagination totalCount={userListData.count} />
      </div>
    );
  }

  return (
    <Page
      title={t("users_management")}
      componentRight={
        <Badge
          className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3"
          variant="outline"
        >
          {t("user_count", { count: userListData?.count ?? 0 })}
        </Badge>
      }
    >
      <hr className="mt-4"></hr>
      <div className="flex items-center justify-between gap-4 m-5 ml-0">
        <Input
          id="search-by-username"
          name="username"
          onChange={(e) => updateQuery({ username: e.target.value })}
          value={qParams.username}
          placeholder={t("search_by_username")}
          className="w-full max-w-sm"
        />
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "card" | "list")}
          className="ml-auto"
        >
          <TabsList className="flex">
            <TabsTrigger value="card" id="user-card-view">
              <div className="flex items-center gap-2">
                <CareIcon icon="l-credit-card" className="text-lg" />
                <span>{t("card")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="list" id="user-list-view">
              <div className="flex items-center gap-2">
                <CareIcon icon="l-list-ul" className="text-lg" />
                <span>{t("list")}</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>{usersList}</div>
    </Page>
  );
}
