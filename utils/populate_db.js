import stories from "../systems/stories.js";
import user from "../systems/user.js";

const storysets = {
  "fantasy": {
    name: "fantasy",
    stories: [
      {title: "Miau", desc: "mia mia mia mia mia"},
      {title: "Miau", desc: "mia mia mia mia mia1"},
      {title: "Miau", desc: "mia mia mia mia mia2"},
      {title: "Miau", desc: "mia mia mia mia mia3"},
    ],
  },
  "science-fiction": {
    name: "science fiction",
    stories: [
      {title: "Miau1", desc: "mia mia mia mia mia"},
      {title: "Miau2", desc: "mia mia mia mia mia2"},
      {title: "Miau3", desc: "mia mia mia mia mia3"},
      {title: "Miau4", desc: "mia mia mia mia mia4"},
    ],
  },
};


console.log("Populating db...");

let admin = await user.createUser("admin", "changeme");
let errMsg = user.addAttribute(admin.id, "is_admin", true);
if (errMsg) {
  console.error(errMsg);
}

let student = await user.createUser("student", "changeme");

Object.entries(storysets).map(([slug, data]) => {
  let storyset = stories.addStoryset(slug, data.name, student);
  for (let story of data.stories) {
    let s = stories.addStory(storyset.slug, story);
  }
});

console.log("Done!");
