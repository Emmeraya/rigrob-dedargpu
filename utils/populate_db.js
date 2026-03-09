import stories from "../systems/stories.js";

const categoriess = {
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

Object.entries(categoriess).map(([id, data]) => {
  let category = stories.addCategory(id, data.name);
  console.log("Created category:", category);
  for (let story of data.stories) {
    let s = stories.addStory(category.id, story);
    console.log("Created story:", s);
  }
});
