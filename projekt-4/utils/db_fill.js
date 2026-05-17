import user from "../systems/user.js";
import stories from "../systems/stories.js";


const storysets = {
  "fantasy": {
    name: "fantasy",
    stories: [
      {tytul: "Miau", opis: "mia mia mia mia mia"},
      {tytul: "Miau", opis: "mia mia mia mia mia1"},
      {tytul: "Miau", opis: "mia mia mia mia mia2"},
      {tytul: "Miau", opis: "mia mia mia mia mia3"},
    ],
  },
  "science-fiction": {
    name: "science fiction",
    stories: [
      {tytul: "Miau1", opis: "mia mia mia mia mia"},
      {tytul: "Miau2", opis: "mia mia mia mia mia2"},
      {tytul: "Miau3", opis: "mia mia mia mia mia3"},
      {tytul: "Miau4", opis: "mia mia mia mia mia4"},
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
