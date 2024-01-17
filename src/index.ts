import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { create } from 'archiver';
import { LambdaClient, UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda';
import packageJson from '../package.json';

const lambda = new LambdaClient({});

const ZIP_FILE_NAME = 'lambda.zip';

const program = new Command();

program.name('lambda-utils')
  .description('Lambda utils')
  .version(packageJson.version);

program.command('update')
  .description('Update lambda function')
  .argument('<string>', 'lambda function name')
  .option('-p, --path <string>', 'path to lambda function', './')
  .action(async (lambdaName: string, options) => {
    const sourcePath = options.path;
    await updateLambda(lambdaName, sourcePath);
  });

async function updateLambda(lambdaName: string, sourcePath: string) {
  const zipPath = await createZip(sourcePath);
  await updateFunction(zipPath, lambdaName);
}

function createZip(sourcePath: string): Promise<string> {
  const zipPath = path.join(os.tmpdir(), ZIP_FILE_NAME);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const zip = create('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve(zipPath);
    });

    zip.on('error', (err) => {
      reject(err);
    });

    zip.pipe(output);
    zip.directory(sourcePath, false);
    zip.finalize();
  });
}

async function updateFunction(zipPath: string, functionName: string) {
  const zipContent = fs.readFileSync(zipPath);

  try {
    await lambda.send(new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipContent
    }));
    console.log('Lambda updated');
  } catch (error) {
    throw error;
  }
}

program.parse();
