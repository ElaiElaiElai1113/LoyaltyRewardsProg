export default class RequiredAcceptanceReporter {
 onEnd(result){if(result.status!=='passed')return {status:'failed'};if(this.skipped){console.error('Required hosted acceptance scenarios were skipped: acceptance is incomplete.');return {status:'failed'}}}
 onTestEnd(_test,result){if(result.status==='skipped')this.skipped=true}
}
