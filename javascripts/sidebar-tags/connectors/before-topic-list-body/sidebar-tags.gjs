import Component from "@ember/component";
import { tagName } from "@ember-decorators/component";
import discourseTag from "discourse/helpers/discourse-tag";
import { ajax } from "discourse/lib/ajax";
import { getOwnerWithFallback } from "discourse/lib/get-owner";
import { withPluginApi } from "discourse/lib/plugin-api";
import { i18n } from "discourse-i18n";

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

@tagName("")
export default class SidebarTags extends Component {
  init() {
    super.init(...arguments);
    this.set("hideSidebar", true);
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
              this.set("isDiscoveryList", true);
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
                  this.set("category", category);
                  if (tagsCategories.find(({ id }) => id === category.id)) {
                    this.set("hideSidebar", false);
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
                  this.set("hideSidebar", false);
                  if (settings.sort_by_popularity) {
                    foundTags = tagsAll.sort(tagCount);
                  } else {
                    foundTags = tagsAll.sort(alphaId);
                  }
                }
                if (!(this.get("isDestroyed") || this.get("isDestroying"))) {
                  this.set(
                    "tagList",
                    foundTags.slice(0, settings.number_of_tags)
                  );
                }
              });
            } else {
              this.set("isDiscoveryList", false);
            }
          }
        });
      });
    }
  }

  <template>
    {{#unless this.site.mobileView}}
      {{#if this.isDiscoveryList}}
        {{#unless this.hideSidebar}}
          <div class="discourse-sidebar-tags">
            <div class="sidebar-tags-list">
              <h3 class="tags-list-title">{{i18n
                  (themePrefix "tag_sidebar.title")
                }}</h3>
              {{#each this.tagList as |t|}}
                {{discourseTag t.id style="box"}}
              {{/each}}
            </div>
          </div>
        {{/unless}}
      {{/if}}
    {{/unless}}
  </template>
}
