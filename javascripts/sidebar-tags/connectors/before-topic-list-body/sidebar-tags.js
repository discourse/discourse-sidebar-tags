import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";
import { getOwnerWithFallback } from "discourse-common/lib/get-owner";

function alphaId(a, b) {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

function tagCount(a, b) {
  if (a.count > b.count) {
    return -1;
  }
  if (a.count < b.count) {
    return 1;
  }
  return 0;
}

export default {
  setupComponent(attrs, component) {
    component.set("hideSidebar", true);
    document.querySelector(".topic-list").classList.add("with-sidebar");

    if (!this.site.mobileView) {
      withPluginApi("0.11", (api) => {
        api.onPageChange((url) => {
          let tagRegex = /^\/tag[s]?\/(.*)/;

          if (settings.enable_tag_cloud) {
            if (this.discoveryList || url.match(tagRegex)) {
              // tag pages aren't discovery lists for some reason?
              // checking for discoveryList makes sure it's not loading on user profiles and other topic lists

              if (this.isDestroyed || this.isDestroying) {
                return;
              }

              component.set("isDiscoveryList", true);

              ajax("/tags.json").then(function (result) {
                let tagsCategories = result.extras.categories;
                let tagsAll = result.tags;
                let foundTags;

                if (url.match(/^\/c\/(.*)/)) {
                  // if category
                  const controller = getOwnerWithFallback(this).lookup(
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
                    if (settings.sort_by_popularity) {
                      foundTags = categoryId.tags.sort(tagCount);
                    } else {
                      foundTags = categoryId.tags.sort(alphaId);
                    }
                  } else {
                    // if a category doesn't have a tag list, don't show tags
                    document
                      .querySelector(".topic-list")
                      .classList.remove("with-sidebar");
                    return;
                  }
                } else {
                  // show tags on generic topic pages like latest, top, etc... also tag pages
                  component.set("hideSidebar", false);
                  if (settings.sort_by_popularity) {
                    foundTags = tagsAll.sort(tagCount);
                  } else {
                    foundTags = tagsAll.sort(alphaId);
                  }
                }

                if (
                  !(
                    component.get("isDestroyed") ||
                    component.get("isDestroying")
                  )
                ) {
                  component.set(
                    "tagList",
                    foundTags.slice(0, settings.number_of_tags)
                  );
                }
              });
            } else {
              component.set("isDiscoveryList", false);
            }
          }
        });
      });
    }
  },
};
