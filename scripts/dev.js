//

// node dev.js   要打包的名字  -f  打包的格式

import minimist from 'minimist';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

// node中的命令参数通过process来获取  process.argv

const args = minimist(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url); // 获取文件的绝对路径 file://
console.log('__filename: ', __filename);
const __dirname = dirname(__filename); //创建出node中的 __dirname
console.log('__dirname: ', __dirname);
const require = createRequire(import.meta.url); //创建出require
console.log('require: ', require);

const target = args._[0] || 'reactivity'; // 打包那个项目
const format = args.f || 'iife'; // 打包后的模块规范
console.log('args: ', args);

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
console.log('entry: ', entry);

const pkg = require(`../packages/${target}/package.json`);
esbuild.context({
  entryPoints: [entry],
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
  bundle: true, // 把reactivity 和 shared 打包到一起
  platform: 'browser',
  sourcemap: true,
  format, // cjs  esm  iife(需要globalName)
  globalName: pkg.buildOptions?.name,
}).then(ctx=>{
    console.log('开始打包 dev')
    return ctx.watch() // 监控入口文件持续进行打包处理
});
