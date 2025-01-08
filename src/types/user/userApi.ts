import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { UserBase, UserCreateRequest } from "@/types/user/user";

export default {
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserBase>>(),
  },
  create: {
    path: "/api/v1/users/",
    method: HttpMethod.POST,
    TRes: Type<UserBase>(),
    TBody: Type<UserCreateRequest>(),
  },
  get: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.GET,

    TRes: Type<UserBase>(),
  },
};
