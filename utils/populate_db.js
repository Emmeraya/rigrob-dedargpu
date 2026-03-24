import stories from "../systems/stories.js";

const storysets = {
  "fantasy": {
    name: "fantasy",
    stories: [
      {titlee: "Miau", desc: "mia mia mia mia mia"},
      {titlee: "Miau", desc: "mia mia mia mia mia1"},
      {titlee: "Miau", desc: "mia mia mia mia mia2"},
      {titlee: "Miau", desc: "mia mia mia mia mia3"},
    ],
  },
  "science-fiction": {
    name: "science fiction",
    stories: [
      {titlee: "Miau1", desc: "mia mia mia mia mia"},
      {titlee: "Miau2", desc: "mia mia mia mia mia2"},
      {titlee: "Miau3", desc: "mia mia mia mia mia3"},
      {titlee: "Miau4", desc: "mia mia mia mia mia4"},
    ],
  },
};


console.log("Populating db...");

Object.entries(storysets).map(([slug, data]) => {
  let storyset = stories.addStoryset(slug, data.name);
  for (let story of data.stories) {
    let s = stories.addStory(storyset.slug, story);
  }
});

console.log("Done!");
