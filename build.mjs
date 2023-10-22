import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/functions/**/*', './src/enums', './src/utils/*'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  outdir: './dist',
  external: ['aws-sdk/clients/*', 'bcryptjs', 'jsonwebtoken']
})
