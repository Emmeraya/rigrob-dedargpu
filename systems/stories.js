import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(
  `CREATE TABLE IF NOT EXISTS storysets (
    storyset_id    INTEGER PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    author_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE NO ACTION
  ) STRICT;
  CREATE TABLE IF NOT EXISTS stories (
    story_id       INTEGER PRIMARY KEY,
    storyset_id    INTEGER NOT NULL REFERENCES storysets(storyset_id) ON DELETE NO ACTION,
    title         TEXT NOT NULL,
    desc          TEXT NOT NULL
  ) STRICT;`,
);

const db_ops = {
  insert_storyset: db.prepare(
    `INSERT INTO storysets (slug, name, author_id) 
     VALUES (?, ?, ?) RETURNING storyset_id as id, slug, name;`,
  ),
  update_storyset_by_slug: db.prepare(
    `UPDATE storysets SET slug = $new_slug, name = $new_name 
      WHERE slug = $slug RETURNING storyset_id AS id, slug, name, author_id;`,
  ),
  insert_story_by_storyset_slug: db.prepare(
    `INSERT INTO stories (storyset_id, title, desc) VALUES (
      (SELECT storyset_id FROM storysets WHERE slug = ?),
      ?, 
      ?
    ) 
    RETURNING story_id AS id, title, desc;`,
  ),
  get_storyset_summaries: db.prepare("SELECT slug, name, author_id FROM storysets;"),
  get_storyset_summary_by_storyset_id: db.prepare(
    "SELECT slug, name, author_id FROM storysets WHERE storyset_id = ?;",
  ),
  get_storyset_by_slug: db.prepare(
    "SELECT storyset_id AS id, slug, name, author_id FROM storysets WHERE slug = ?;",
  ),
  get_story_by_id: db.prepare(
    "SELECT story_id AS id, title, desc FROM stories WHERE story_id = ?;",
  ),
  update_story_by_id: db.prepare(
    "UPDATE stories SET title = ?, desc = ? WHERE story_id = ? RETURNING story_id, title, desc;",
  ),
  delete_story_by_id: db.prepare("DELETE FROM stories WHERE story_id = ?;"),
  get_stories_by_storyset_id: db.prepare(
    "SELECT story_id AS id, title, desc FROM stories WHERE storyset_id = ?;",
  ),
};

export function getStorysetSummaries() {
  var storysets = db_ops.get_storyset_summaries.all();
  return storysets;
}

export function getStorysetSummary(storysetId) {
  var storysets = db_ops.get_storyset_summary_by_storyset_id.get(storysetId);
  return storysets;
}

export function hasStoryset(slug) {
  let storyset = db_ops.get_storyset_by_slug.get(slug);
  return storyset != null;
}

export function hasStory(storyId) {
  let storyset = db_ops.get_story_by_id.get(storyId);
  return storyset != null;
}

export function getStoryset(slug) {
  let storyset = db_ops.get_storyset_by_slug.get(slug);
  if (storyset != null) {
    storyset.stories = db_ops.get_stories_by_storyset_id.all(storyset.id);
    storyset.editableBy = storysetEditableBy;

    return storyset;
  }
  return null;
}

function storysetEditableBy(user) {
  return user != null && (this.author_id === user.id || user.is_admin);
}

export function addStory(storysetSlug, story) {
  return db_ops.insert_story_by_storyset_slug.get(
    storysetSlug,
    story.title,
    story.desc,
  );
}

export function updateStory(story) {
  return db_ops.update_story_by_id.get(story.title, story.desc, story.id);
}

export function deleteStoryById(StoryId) {
  return db_ops.delete_story_by_id.run(StoryId);
}

export function addStoryset(slug, name, author) {
  return db_ops.insert_storyset.get(slug, name, author.id);
}

export function updateStoryset(slug, newSlug, newName) {
  return db_ops.update_storyset_by_slug.get({
    $slug: slug,
    $new_slug: newSlug,
    $new_name: newName,
  });
}

export function validateStoryData(story) {
  var errors = [];
  var fields = ["title", "desc"];
  for (let field of fields) {
    if (!story.hasOwnProperty(field)) errors.push(`Missing field '${field}'`);
    else {
      if (typeof story[field] != "string")
        errors.push(`'${field}' expected to be string`);
      else {
        if (story[field].length < 1 || story[field].length > 500)
          errors.push(`'${field}' expected length: 1-500`);
      }
    }
  }
  return errors;
}
export function validateStorysetName(name) {
  var errors = [];
  if (typeof name != "string") {
    errors.push("Storyset name should be a string");
  } else {
    if (name.length < 3 || name.length > 100) {
      errors.push("Storyset name should have 3-100 characters");
    }
  }

  return errors;
}

export function generateStorysetSlug(name) {
  const storysetId = name
    .toLowerCase()
    .replace(/(\s|[.-])+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

  return storysetId;
}

export function canEdit(storysetSlug, user) {
  let storyset = db_ops.get_storyset_by_slug.get(storysetSlug);
  storyset.editableBy = storysetEditableBy;

  return storyset.editableBy(user);
}

export default {
  getStorysetSummaries,
  getStorysetSummary,
  hasStory,
  hasStoryset,
  getStoryset,
  addStory,
  updateStory,
  deleteStoryById,
  addStoryset,
  updateStoryset,
  validateStoryData,
  validateStorysetName,
  generateStorysetSlug,
  canEdit,
};
