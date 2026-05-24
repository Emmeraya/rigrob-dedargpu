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

let student = await user.createUser("student", "changeme");

for (let [slug, data] of Object.entries(storysets)) {
  if (stories.hasStoryset(slug)) {
    console.log(`Storyset '${slug}' already exists. Skipping.`);
    continue;
  }
  let storyset = stories.addStoryset(slug, data.name, student);
  for (let story of data.stories) {
    stories.addStory(storyset.slug, story);
  }
}

console.log("Done!");
