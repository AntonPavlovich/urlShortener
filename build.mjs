import fs from 'fs';
import path from "path";
import * as esbuild from 'esbuild';

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

})

