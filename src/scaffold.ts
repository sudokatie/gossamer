import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function createNewSite(name: string): Promise<void> {
  const dir = path.resolve(name);
  
  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(path.join(dir, "posts"), { recursive: true });
  
  await fs.writeFile(path.join(dir, "index.md"), `---
title: Home
---

# Welcome

This is your new site built with Gossamer.

Check out the [posts](/posts) section.
`);
  
  await fs.writeFile(path.join(dir, "about.md"), `---
title: About
---

# About

Write something about yourself here.
`);
  
  const today = new Date().toISOString().split("T")[0];
  await fs.writeFile(path.join(dir, `posts/${today}-hello-world.md`), `---
title: Hello World
date: ${today}
---

# Hello World

This is your first post. Edit or delete it, then start writing!
`);
  
  console.log(`Created new site at ${dir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${name}`);
  console.log(`  gossamer build`);
  console.log(`  gossamer serve`);
}
