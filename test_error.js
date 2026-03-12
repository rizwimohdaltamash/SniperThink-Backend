import { exec } from "child_process";
exec("node src/index.js", (error, stdout, stderr) => {
  import("fs").then(fs => fs.writeFileSync("error_details.txt", stderr || stdout));
});
