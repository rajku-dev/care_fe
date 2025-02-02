import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Avatar } from "@/components/Common/Avatar";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { formatName, relativeTime } from "@/Utils/utils";
import { CommentModel } from "@/types/resourceRequest/resourceRequest";

const CommentSection = (props: { id: string }) => {
  const { id } = props;
  const [commentBox, setCommentBox] = useState("");

  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["resourceComments"],
  });

  const {
    data: resourceComments,
    isFetching: commentsFetching,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: [routes.getResourceComments.path, id, qParams],
    queryFn: query.debounced(routes.getResourceComments, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
      pathParams: { id },
    }),
  });

  const onSubmitComment = async () => {
    const payload = {
      comment: commentBox,
    };
    if (!/\S+/.test(commentBox)) {
      toast.error(t("comment_min_length"));
      return;
    }
    const { res } = await request(routes.addResourceComments, {
      pathParams: { id: props.id },
      body: payload,
    });
    if (res?.ok) {
      toast.success(t("comment_added_successfully"));
    }
    setCommentBox("");
  };

  return (
    <div className="flex w-full flex-col">
      <div>
        <Textarea
          name="comment"
          placeholder={t("type_your_comment")}
          value={commentBox}
          onChange={(e) => setCommentBox(e.target.value)}
        />

        <div className="flex w-full justify-end mt-2">
          <Button
            variant="primary"
            onClick={async () => {
              await onSubmitComment();
              refetchComments();
            }}
          >
            {t("post_your_comment")}
          </Button>
        </div>

        <div className="w-full">
          {commentsLoading ? (
            <div>
              <div className="grid gap-5">
                <CardListSkeleton count={10} />
              </div>
            </div>
          ) : (
            <div>
              {!commentsFetching && resourceComments?.results?.length === 0 ? (
                <div className="p-flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
                  <span>{t("no_comments_available")}</span>
                </div>
              ) : (
                <ul>
                  {resourceComments?.results?.map((comment) => (
                    <li key={comment.id} className="w-full">
                      <Comment {...comment} />
                    </li>
                  ))}
                  <div className="flex w-full items-center justify-center">
                    <Pagination totalCount={resourceComments?.count || 0} />
                  </div>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;

export const Comment = ({
  comment,
  created_by,
  created_date,
}: CommentModel) => (
  <div className="mt-4 flex w-full flex-col rounded-lg border border-secondary-300 bg-white p-4 text-secondary-800">
    <div className="w-full">
      <p className="break-words whitespace-pre-wrap">
        {comment.replace(/\n+/g, "\n")}
      </p>
    </div>
    <div className="flex w-full items-center">
      <div className="mr-auto flex items-center rounded-md border bg-secondary-100 py-1 pl-2 pr-3">
        <Avatar
          name={`${created_by.first_name} ${created_by.last_name}`}
          className="h-8 w-8 "
        />
        <span className="pl-2 text-sm text-secondary-700">
          {formatName(created_by)}
        </span>
      </div>
      <div className="text-xs">{relativeTime(created_date)}</div>
    </div>
  </div>
);
