import { db } from "../../lib/db";
import { sql } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  let fileName = "";
  let sqlQuery = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && i + 1 < args.length) {
      fileName = args[i + 1];
    } else if (args[i] === "--sql" && i + 1 < args.length) {
      sqlQuery = args[i + 1];
    }
  }

  // fallback to assuming the first argument is the filename if not using --file flag and --sql is not provided
  if (!fileName && !sqlQuery && args.length > 0 && !args[0].startsWith("--")) {
    fileName = args[0];
  }

  if (!fileName && !sqlQuery) {
    console.error(
      "Usage: npm run db:query -- --file <filename> OR npm run db:query -- --sql <query>",
    );
    process.exit(1);
  }

  try {
    let queryText = "";
    if (sqlQuery) {
      console.log(`Executing query: ${sqlQuery}\n`);
      queryText = sqlQuery;
    } else {
      const filePath = path.resolve(process.cwd(), "db/sql", fileName);
      console.log(`Executing query from: ${filePath}\n`);
      queryText = await fs.readFile(filePath, "utf-8");
    }

    const result = await db.execute(sql.raw(queryText));

    console.log("Result:");
    // Print formatted data
    if (Array.isArray(result) && result.length > 0) {
      console.table(result);
    } else {
      console.dir(result, { depth: null, colors: true });
    }
  } catch (error) {
    console.error("Error executing query:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
