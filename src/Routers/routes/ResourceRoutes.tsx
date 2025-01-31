import View from "@/components/Common/View";
import PrintResourceLetter from "@/components/Resource/PrintResourceLetter";
import BoardView from "@/components/Resource/ResourceBoard";
import ResourceDetails from "@/components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import ListView from "@/components/Resource/ResourceList";

import { AppRoutes } from "@/Routers/AppRouter";

const ResourceRoutes: AppRoutes = {
  "/resource": () => <View name="resource" board={BoardView} list={ListView} />,
  "/resource/:id": ({ id }) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }) => <ResourceDetailsUpdate id={id} />,
  "/resource/:id/print": ({ id }) => <PrintResourceLetter id={id} />,
};

export default ResourceRoutes;
