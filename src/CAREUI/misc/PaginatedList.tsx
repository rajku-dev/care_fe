import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button, ButtonProps } from "@/components/ui/button";

import Pagination from "@/components/Common/Pagination";

import apiQuery from "@/Utils/request/query";
import {
  ApiRoute,
  PaginatedResponse,
  QueryParams,
} from "@/Utils/request/types";
import { classNames } from "@/Utils/utils";

const DEFAULT_PER_PAGE_LIMIT = 14;

type PaginatedListContext<TItem> = UseQueryResult<PaginatedResponse<TItem>> & {
  items: TItem[];
  perPage: number;
  currentPage: number;
  setPage: (page: number) => void;
};

const context = createContext<PaginatedListContext<object> | null>(null);

function useContextualized<TItem>() {
  const ctx = useContext(context);

  if (ctx === null) {
    throw new Error("Component must be used within a PaginatedList");
  }

  return ctx as PaginatedListContext<TItem>;
}

interface Props<TItem> {
  route: ApiRoute<PaginatedResponse<TItem>>;
  perPage?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  queryCB?: (query: UseQueryResult<PaginatedResponse<TItem>>) => void;
  pathParams?: Record<string, string>;
  queryParams?: QueryParams;
  silent?: boolean | ((response: Response) => boolean);
  signal?: AbortSignal;
  headers?: HeadersInit;
  children: (
    ctx: PaginatedListContext<TItem>,
    query: UseQueryResult<PaginatedResponse<TItem>>,
  ) => JSX.Element | JSX.Element[];
}

export default function PaginatedList<TItem extends object>({
  children,
  route,
  perPage = DEFAULT_PER_PAGE_LIMIT,
  onPageChange,
  initialPage,
  pathParams,
  queryParams,
  queryCB,
  ...apiCallOptions
}: Props<TItem>) {
  const [currentPage, _setPage] = useState(initialPage ?? 1);

  const setPage = (page: number) => {
    _setPage(page);
    onPageChange?.(page);
  };

  const query = useQuery({
    queryKey: [route.path, currentPage, perPage, queryParams],
    queryFn: apiQuery(route, {
      queryParams: {
        limit: perPage,
        offset: (currentPage - 1) * perPage,
        ...queryParams,
      },
      pathParams,
      ...apiCallOptions,
    }),
  });

  const items = query.data?.results ?? [];

  useEffect(() => {
    if (queryCB) {
      queryCB(query);
    }
  }, [query]);

  return (
    <context.Provider
      value={{ ...query, items, perPage, currentPage, setPage }}
    >
      <context.Consumer>
        {(ctx) => children(ctx as PaginatedListContext<TItem>, query)}
      </context.Consumer>
    </context.Provider>
  );
}

interface WhenEmptyProps {
  className?: string;
  children: JSX.Element | JSX.Element[];
}

const WhenEmpty = <TItem extends object>(props: WhenEmptyProps) => {
  const { items, isLoading } = useContextualized<TItem>();

  if (isLoading || items.length > 0) {
    return null;
  }

  return <div className={props.className}>{props.children}</div>;
};

PaginatedList.WhenEmpty = WhenEmpty;

const WhenLoading = <TItem extends object>(props: WhenEmptyProps) => {
  const { isLoading } = useContextualized<TItem>();

  if (!isLoading) {
    return null;
  }

  return <div className={props.className}>{props.children}</div>;
};

PaginatedList.WhenLoading = WhenLoading;

interface CommonButtonProps extends ButtonProps {
  label?: string;
}

const Refresh = ({ label = "Refresh", ...props }: CommonButtonProps) => {
  const { isLoading, refetch } = useContextualized<object>();

  return (
    <Button
      variant="secondary"
      {...props}
      onClick={() => refetch()}
      disabled={isLoading}
    >
      <CareIcon
        icon="l-sync"
        className={classNames("text-lg", isLoading && "animate-spin")}
      />
      <span>{label}</span>
    </Button>
  );
};

PaginatedList.Refresh = Refresh;

interface ItemsProps<TItem> {
  className?: string;
  children: (item: TItem, items: TItem[]) => JSX.Element | JSX.Element[];
  shimmer?: JSX.Element;
  shimmerCount?: number;
}

const Items = <TItem extends object>(props: ItemsProps<TItem>) => {
  const { isLoading, items } = useContextualized<TItem>();

  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <ul className={props.className}>
      {isLoading && props.shimmer
        ? Array.from({ length: props.shimmerCount ?? 8 }).map((_, i) => (
            <li key={i} className="w-full">
              {props.shimmer}
            </li>
          ))
        : items.map((item, index, items) => (
            <li key={index} className="w-full">
              {props.children(item, items)}
            </li>
          ))}
    </ul>
  );
};

PaginatedList.Items = Items;

interface PaginatorProps {
  className?: string;
  hideIfSinglePage?: boolean;
}

const Paginator = <TItem extends object>({
  className,
  hideIfSinglePage,
}: PaginatorProps) => {
  const { data, perPage, currentPage, setPage } = useContextualized<object>();
  const { isLoading } = useContextualized<TItem>();

  if (isLoading) {
    return null;
  }

  if (hideIfSinglePage && (data?.count ?? 0) <= perPage) {
    return null;
  }

  return (
    <Pagination
      className={className}
      cPage={currentPage}
      data={{ totalCount: data?.count ?? 0 }}
      defaultPerPage={perPage}
      onChange={setPage}
    />
  );
};

PaginatedList.Paginator = Paginator;
