import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(
  `CREATE TABLE IF NOT EXISTS categories (
    category_id   INTEGER PRIMARY KEY,
    id            TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS stories (
    id            INTEGER PRIMARY KEY,
    category_id   INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE NO ACTION,
    title         TEXT NOT NULL,
    desc          TEXT NOT NULL
  ) STRICT;`
);

const db_ops = {
  insert_category: db.prepare(
    "INSERT INTO categories (id, name) VALUES (?, ?) RETURNING category_id, id, name;"
  ),
  update_category_by_id: db.prepare(
    "UPDATE categories SET id = $new_category_id, name = $name WHERE id = $category_id RETURNING category_id, id, name;"
  ),
  insert_story: db.prepare(
    "INSERT INTO stories (category_id, title, desc) VALUES (?, ?, ?) RETURNING id, title, desc;"
  ),
  insert_story_by_category_id: db.prepare(
    `INSERT INTO stories (category_id, title, desc) VALUES (
      (SELECT category_id FROM categories WHERE id = ?),
      ?, 
      ?
    ) 
    RETURNING id, title, desc;`
  ),
  get_categories: db.prepare("SELECT id, name FROM categories;"),
  get_category_by_id: db.prepare(
    "SELECT category_id, id, name FROM categories WHERE id = ?;"
  ),
  get_story_by_id: db.prepare(
    "SELECT id, title, desc FROM stories WHERE id = ?;"
  ),
  update_story_by_id: db.prepare(
    "UPDATE stories SET title = ?, desc = ? WHERE id = ? RETURNING id, title, desc;"
  ),
  delete_story_by_id: db.prepare("DELETE FROM stories WHERE id = ?;"),
  get_stories_by_category_id: db.prepare(
    "SELECT id, title, desc FROM stories WHERE category_id = ?;"
  ),
};

export function getCategorySummaries() {
  var categories = db_ops.get_categories.all();
  return categories;
}

export function hasCategory(categoryId) {
  let category = db_ops.get_category_by_id.get(categoryId);
  return category != null;
}

export function hasStory(storyId) {
  let category = db_ops.get_story_by_id.get(storyId);
  return category != null;
}

export function getCategory(categoryId) {
  let category = db_ops.get_category_by_id.get(categoryId);
  if (category != null) {
    category.stories = db_ops.get_stories_by_category_id.all(category.category_id);
    return category;
  }
  return null;
}

export function addStory(categoryId, story) {
  return db_ops.insert_story_by_category_id.get(
    categoryId,
    story.title,
    story.desc
  );
}

export function updateStory(story) {
  return db_ops.update_story_by_id.get(story.title, story.desc, story.id);
}

export function deleteStoryById(storyId) {
  return db_ops.delete_story_by_id.run(storyId);
}

export function addCategory(categoryId, name) {
  return db_ops.insert_category.get(categoryId, name);
}

export function updateCategory(categoryId, newCategoryId, name) {
  return db_ops.update_category_by_id.get({
    $category_id: categoryId,
    $new_category_id: newCategoryId,
    $name: name,
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
export function validateCategoryName(name) {
  var errors = [];
  if (typeof name != "string") {
    errors.push("Category name should be a string");
  } else {
    if (name.length < 3 || name.length > 100) {
      errors.push("Category name should have 3-100 characters");
    }
  }

  return errors;
}

export function generateCategoryId(name) {
  const categoryId = name
    .toLowerCase()
    .replace(/(\s|[.-])+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

  return categoryId;
}

export default {
  getCategorySummaries,
  hasStory,
  hasCategory,
  getCategory,
  addStory,
  updateStory,
  deleteStoryById,
  addCategory,
  updateCategory,
  validateStoryData,
  validateCategoryName,
  generateCategoryId,
};
