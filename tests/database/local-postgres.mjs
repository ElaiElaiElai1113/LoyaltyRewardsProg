import {spawn} from 'node:child_process'
export function localDatabase(prefix){
 const database=`${prefix}_${process.pid}_${Date.now()}`
 function sql(command,db=database){return new Promise((resolve,reject)=>{const child=spawn(process.env.LOYALITY_TEST_PSQL||'psql',['-X','-qAt','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p',process.env.LOYALITY_TEST_PGPORT||'5432','-U',process.env.LOYALITY_TEST_PGUSER||'postgres','-d',db],{windowsHide:true});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>code?reject(Error(err)):resolve(out.trim()));child.stdin.end(`set statement_timeout='15s'; ${command}`)})}
 return {database,sql,async create(){await sql(`create database ${database}`,'postgres')},async drop(){await sql(`drop database if exists ${database} with (force)`,'postgres')}}
}
