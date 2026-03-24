import stories from "../systems/stories.js";

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

Object.entries(storysets).map(([slug, data]) => {
  let storyset = stories.addStoryset(slug, data.name);
  for (let story of data.stories) {
    let s = stories.addStory(storyset.slug, story);
  }
});

console.log("Done!");
