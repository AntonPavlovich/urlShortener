import fs from 'fs';
import path from "path";
import * as esbuild from 'esbuild';
import { exec } from "child_process";

const [ action ] = process.argv.slice(2);

switch (action) {
  case 'init':
    fs.readFile(path.resolve('./.env'), { encoding: 'utf8' }, (err, data) => {
      const [ email ] = data.split('\n').filter(variable => variable.startsWith('SOURCE_EMAIL'));
      if (!email) {
        throw new Error('Provide SOURCE_EMAIL variable!')
      };
      const [ _ ,value] = email.split('=');
      exec(`aws ses verify-email-identity --email-address ${value?.trim()}`);
      console.log('Initiated.');
    })
  break;

  case 'build':
    fs.readFile(path.resolve('./package.json'), { encoding: 'utf8' }, async (err, data) => {
      const parsed = JSON.parse(data);
      const external = Object.keys(parsed?.dependencies);

      await esbuild.build({
        entryPoints: ['src/functions/**/*', './src/enums', './src/utils/*'],
        bundle: true,
        platform: 'node',
        target: ['node18'],
        outdir: './dist',
        external: [...external],
      }).then(() => {
        console.log('Builded!');
      });
    });
  break;
}
