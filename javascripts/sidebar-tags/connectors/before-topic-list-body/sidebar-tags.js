import { withPluginApi } from "discourse/lib/plugin-api";
import { ajax } from "discourse/lib/ajax";

const container = Discourse.__container__;

function alphaId(a, b) {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

export default {
  setupComponent(attrs, component) {
    component.set("hideSidebar", true);

    if (!this.site.mobileView) {
      withPluginApi("0.11", (api) => {
        api.onPageChange((url) => {
          let tagRegex = /^\/tag[s]?\/(.*)/;

          if (settings.enable_tag_cloud) {
            if (this.discoveryList || url.match(tagRegex)) {
              // tag pages aren't discovery lists for some reason?
              // checking for discoveryList makes sure it's not loading on user profiles and other topic lists
              component.set("discoveryList", true);

              ajax("/tags.json").then(function (result) {
                let tagsCategories = result.extras.categories;
                let tagsAll = result.tags;
                let foundTags;

                if (url.match(/^\/c\/(.*)/)) {
                  // if category
                  const controller = container.lookup(
                    "controller:navigation/category"
                  );
                  let category = controller.get("category");
                  component.set("category", category);

                  if (tagsCategories.find(({ id }) => id === category.id)) {
                    component.set("hideSidebar", false);
                    // if category has a tag list
                    let categoryId = tagsCategories.find(
                      ({ id }) => id === category.id
                    );
                    foundTags = categoryId.tags.sort(alphaId);
                  } else {
                    // if a category doesn't have a tag list, don't show tags
                    return;
                  }
                } else {
                  // show tags on generic topic pages like latest, top, etc... also tag pages
                  component.set("hideSidebar", false);
                  foundTags = tagsAll.sort(alphaId);
                }

                if (
                  !(
                    component.get("isDestroyed") ||
                    component.get("isDestroying")
                  )
                ) {
                  component.set("tagList", foundTags);
                  document
                    .querySelector(".topic-list")
                    .classList.add("with-sidebar");
                }
              });
            } else {
              component.set("discoveryList", false);
              document
                .querySelector(".topic-list")
                .classList.remove("with-sidebar");
            }
          }
        });
      });
    }
  },
};