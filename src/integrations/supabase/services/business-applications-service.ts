import {getActiveProgram} from '@/features/tenant/tenant-service'
import {requireSupabase} from './shared'
export type BusinessApplication={id:string;program_id:string;application_reference:string;legal_name:string;representative_name:string;representative_email:string;model:string;status:string;created_at:string}
export const businessApplicationsService={
 async list(page:number,search:string):Promise<{rows:BusinessApplication[];count:number}> {
  let query=requireSupabase().from('business_applications').select('*',{count:'exact'}).eq('program_id',getActiveProgram().id).order('created_at',{ascending:false}).range(page*20,page*20+19)
  if(search.trim())query=query.ilike('legal_name',`%${search.trim().replace(/[%_]/g,'')}%`)
  const {data,error,count}=await query;if(error)throw Error(error.message);return {rows:data??[],count:count??0}
 },
 async review(app:BusinessApplication,next:string,reason:string){const {error}=await requireSupabase().rpc('review_business_application',{p_application_id:app.id,p_expected_status:app.status,p_next_status:next,p_reason:reason});if(error)throw Error(error.message)},
 async history(id:string){const {data,error}=await requireSupabase().from('business_application_review_events').select('*').eq('application_id',id).order('created_at',{ascending:false});if(error)throw Error(error.message);return data as {id:string;from_status:string;to_status:string;reason:string;created_at:string}[]},
}
