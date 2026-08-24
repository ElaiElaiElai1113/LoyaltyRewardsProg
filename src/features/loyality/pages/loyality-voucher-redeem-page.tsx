import { CheckCircle2, Gift, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { loyalityService, type LoyalityVoucher } from '@/features/loyality/loyality-service'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency } from '@/lib/utils'

function valueLabel(voucher: LoyalityVoucher, currency: string, locale: string) {
  if (voucher.voucherKind === 'amount' && voucher.voucherValue !== null) return formatCurrency(voucher.voucherValue, currency, locale)
  if (voucher.voucherKind === 'discount' && voucher.voucherValue !== null) return `${voucher.voucherValue}% off`
  return 'Specific item voucher'
}

export function LoyalityVoucherRedeemPage() {
  const { publicToken = '' } = useParams()
  const { program } = useTenant()
  const [voucher, setVoucher] = useState<LoyalityVoucher | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    let active = true
    loyalityService.getVoucherForStaff(publicToken).then((next) => { if (active) setVoucher(next) }).catch(() => { if (active) setVoucher(null) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [publicToken])

  async function redeem() {
    setRedeeming(true)
    try { const next = await loyalityService.redeemVoucher(publicToken); setVoucher(next); toast.success('Voucher redeemed and recorded.') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Voucher could not be redeemed.') }
    finally { setRedeeming(false) }
  }

  if (loading) return <LoadingState title="Checking voucher" description="Confirming its status and business." />
  if (!voucher) return <EmptyState title="Voucher not found" description="Ask the customer to reopen their active voucher QR." action={<Link to="/business/dashboard"><Button>Back to dashboard</Button></Link>} />

  return <div className="mx-auto max-w-2xl"><section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-card shadow-xl"><div className="bg-[#173b3f] p-7 text-white sm:p-10"><div className="flex items-center gap-3"><ShieldCheck className="text-[#b9e769]" /><span className="text-xs font-black uppercase tracking-[.2em]">Staff voucher check</span></div><h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">{voucher.title}</h1><p className="mt-4 text-white/70">{voucher.description}</p></div><div className="p-6 sm:p-9"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[var(--muted)] p-5"><span className="text-xs font-black uppercase tracking-wider text-[var(--muted-foreground)]">Voucher value</span><strong className="mt-2 block text-2xl">{valueLabel(voucher, program.currency, program.locale)}</strong></div><div className="rounded-2xl bg-[var(--muted)] p-5"><span className="text-xs font-black uppercase tracking-wider text-[var(--muted-foreground)]">Status</span><strong className="mt-2 block text-2xl capitalize">{voucher.status}</strong></div></div>{voucher.status === 'active' ? <Button className="mt-6 h-14 w-full rounded-full bg-[#ff6b4a] text-base font-black text-white" onClick={() => void redeem()} disabled={redeeming}>{redeeming ? <LoaderCircle className="animate-spin" /> : <Gift />}Confirm voucher used</Button> : <div className="mt-6 rounded-3xl border border-[#69a23a]/20 bg-[#b9e769]/20 p-5 text-center"><CheckCircle2 className="mx-auto text-[#4c8222]" /><strong className="mt-2 block">This voucher has already been recorded as used.</strong></div>}<p className="mt-5 text-center text-xs text-[var(--muted-foreground)]">Redeeming changes only this voucher. It does not combine with cash or a POS balance.</p></div></section></div>
}
