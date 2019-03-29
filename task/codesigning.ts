import path = require("path");
import tl = require("azure-pipelines-task-lib/task");
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";

async function sign(filePath: string, hashingAlgorithm: string, timeServer: string, signCertPassword: string): Promise<number> {
  const exePath: string = path.resolve(__dirname, "./signtool.exe");
  const signToolRunner: ToolRunner = tl.tool(exePath);
  let secureFilePath: string = tl.getTaskVariable("SECURE_FILE_PATH");
  console.log("Signing file: " + filePath);

  signToolRunner.arg("sign");
  signToolRunner.arg(["/fd", hashingAlgorithm]);
  signToolRunner.arg(["/t", timeServer]);
  signToolRunner.arg(["/f", secureFilePath]);
  signToolRunner.arg(["/p", signCertPassword]);
  signToolRunner.arg(filePath);

  return signToolRunner.exec(null);
}

async function run(): Promise<void> {
  try {
    tl.setResourcePath(path.join(__dirname, "task.json"));

    let signCertPassword: string = tl.getInput("signCertPassword", true);
    let timeServer: string = tl.getInput("timeServer", true);
    let hashingAlgorithm: string = tl.getInput("hashingAlgorithm", true);
    let filesPattern: string = tl.getInput("files", true);

    let filesToSign: string[] = tl.findMatch(null, filesPattern);
    if (!filesToSign || filesToSign.length === 0) {
      throw new Error(tl.loc("NoMatchingFiles", filesPattern));
    }
    for (let filePath of filesToSign) {
      await sign(filePath, hashingAlgorithm, timeServer, signCertPassword);
      console.log("Job Finished: Successfully signed file " + filePath + " with given certificate.");
    }
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, `${err}`);
  }
}

run();