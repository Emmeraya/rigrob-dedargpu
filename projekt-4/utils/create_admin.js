import user from "../systems/user.js";

console.log("Creading an admin...");

let admin = user.findByUsername("admin");

if (admin == null) {
  admin = await user.createUser("admin", "admin123");
  console.log("Admin user created.");
} else {
  console.log("Admin user already exists.");
}

let errMsg = user.addAttribute(admin.id, "is_admin", true);
if (errMsg) {
  console.error(errMsg);
}
console.log("Done!");