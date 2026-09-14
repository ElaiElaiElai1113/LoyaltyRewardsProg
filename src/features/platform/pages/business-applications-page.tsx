import {useState} from 'react'
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query'
import {businessApplicationsService,type BusinessApplication} from '@/integrations/supabase/services/business-applications-service'
import {useTenant} from '@/hooks/use-tenant'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {useLanguage} from '@/lib/language'
export function BusinessApplicationsPage(){
 const {program}=useTenant(),{t}=useLanguage(),cache=useQueryClient()
 const [page,setPage]=useState(0),[search,setSearch]=useState(''),[selected,setSelected]=useState<BusinessApplication|null>(null),[reason,setReason]=useState('')
 const key=['business-applications',program.id,page,search]
 const query=useQuery({queryKey:key,queryFn:()=>businessApplicationsService.list(page,search)})
 const history=useQuery({queryKey:['application-review-history',selected?.id],queryFn:()=>businessApplicationsService.history(selected!.id),enabled:!!selected})
 const review=useMutation({mutationFn:(next:string)=>businessApplicationsService.review(selected!,next,reason),onSuccess:async()=>{setSelected(null);setReason('');await cache.invalidateQueries({queryKey:['business-applications']})}})
 return <main className="mx-auto max-w-5xl space-y-6 p-5"><h1 className="text-3xl">{t('Business applications')}</h1><p>{t('Review applications before any separate commercial acceptance or business activation.')}</p>
 <label className="block">{t('Search businesses')}<Input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/></label>
 {query.isPending?<p role="status">{t('Loading…')}</p>:query.error?<p role="alert">{query.error.message}</p>:<div className="space-y-3">{query.data?.rows.map(app=><button type="button" key={app.id} onClick={()=>{setSelected(app);review.reset()}} className="block w-full rounded-xl border p-4 text-left"><strong>{app.legal_name}</strong><span className="block">{app.application_reference} · {app.status}</span></button>)}{query.data?.count===0?<p>{t('No applications found.')}</p>:null}</div>}
 <div className="flex gap-3"><Button disabled={page===0} onClick={()=>setPage(page-1)}>{t('Previous')}</Button><Button disabled={(page+1)*20>=(query.data?.count??0)} onClick={()=>setPage(page+1)}>{t('Next')}</Button></div>
 {selected?<section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl">{selected.legal_name}</h2><p>{selected.representative_name} · {selected.representative_email} · {selected.model}</p><p>{t('Approval records a review decision only. Activation remains pending accepted commercial terms.')}</p><label className="block">{t('Review reason')}<Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000}/></label><div className="flex flex-wrap gap-3">{(selected.status==='submitted'?['in_review','withdrawn']:selected.status==='in_review'?['approved','declined','withdrawn']:[]).map(next=><Button key={next} disabled={reason.trim().length<3||review.isPending} onClick={()=>review.mutate(next)}>{t(next)}</Button>)}</div>{review.error?<p role="alert">{review.error.message}</p>:null}<h3>{t('Review history')}</h3>{history.error?<p role="alert">{history.error.message}</p>:history.data?.map(event=><p key={event.id}>{event.created_at} · {event.from_status} → {event.to_status}: {event.reason}</p>)}</section>:null}
 </main>
}
