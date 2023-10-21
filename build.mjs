import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/handlers/*', './src/enums', './src/utils/*'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  outdir: './dist',
  external: ['aws-sdk/clients/*', 'bcryptjs'],
  loader: {
    ".html": 'text'
  }
})
