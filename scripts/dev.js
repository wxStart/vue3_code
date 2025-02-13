// 

// node dev.js   要打包的名字  -f  打包的格式

import minimist from "minimist";
import { createRequire } from "module";
import {dirname, resolve} from 'path'
import { fileURLToPath} from 'url'

// node中的命令参数通过process来获取  process.argv

const args = minimist(process.argv.slice(2))
const __filename = fileURLToPath(import.meta.url) // 获取文件的绝对路径 file://
console.log('__filename: ', __filename);
const __dirname = dirname(__filename); //创建出node中的 __dirname
console.log('__dirname: ', __dirname);
const require  = createRequire(import.meta.url) //创建出require
console.log('require: ', require);

const target = args._[0] || 'reactivity' // 打包那个项目
const formar  =args.f || 'iife' // 打包后的模块规范
console.log('args: ', args);

const  entry =  resolve(__dirname,`../packages/${target}/src/index.ts`)
console.log('entry: ', entry);
