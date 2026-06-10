import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { giftCardCatalogService } from '@/integrations/supabase/services/gift-card-catalog-service'
import { giftCardsService } from '@/integrations/supabase/services/gift-cards-service'
import { useAuth } from '@/hooks/use-auth'
import type { GiftCardCatalogItemFormValues, OwnerGiftCardCatalogItemFormValues } from '@/types/forms'

export const giftCardKeys = {
  catalog: (businessId?: string) => ['gift-card-catalog', businessId ?? 'all'] as const,
  myCards: ['gift-cards', 'mine'] as const,
  businessCards: (businessId?: string) => ['gift-cards', 'business', businessId ?? 'missing'] as const,
  detail: (id?: string) => ['gift-card', id ?? 'missing'] as const,
  public: (token?: string) => ['gift-card', 'public', token ?? 'missing'] as const,
}

export function useGiftCardCatalog(businessId?: string) {
  return useQuery({
    queryKey: giftCardKeys.catalog(businessId),
    queryFn: () => giftCardCatalogService.listCatalog(businessId),
  })
}

export function useCreateGiftCardCatalogItem(createdBy?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: GiftCardCatalogItemFormValues) =>
      giftCardCatalogService.createCatalogItem(values, createdBy),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['gift-card-catalog'] })
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.catalog(item.businessId) })
      toast.success('Gift card catalog item created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useCreateOwnerGiftCardCatalogItem(businessId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: OwnerGiftCardCatalogItemFormValues) =>
      giftCardCatalogService.createOwnerCatalogItem(values),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['gift-card-catalog'] })
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.catalog(item.businessId) })
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.catalog(businessId) })
      toast.success('Gift card catalog item created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateGiftCardCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<GiftCardCatalogItemFormValues> }) =>
      giftCardCatalogService.updateCatalogItem(id, values),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['gift-card-catalog'] })
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.catalog(item.businessId) })
      toast.success('Gift card catalog item updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteGiftCardCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => giftCardCatalogService.deleteCatalogItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gift-card-catalog'] })
      toast.success('Gift card catalog item deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useMyGiftCards() {
  return useQuery({
    queryKey: giftCardKeys.myCards,
    queryFn: () => giftCardsService.getMyGiftCards(),
  })
}

export function useBusinessGiftCards(businessId?: string) {
  return useQuery({
    queryKey: giftCardKeys.businessCards(businessId),
    queryFn: () => giftCardsService.getGiftCardsForBusiness(businessId),
  })
}

export function useGiftCard(id?: string) {
  return useQuery({
    queryKey: giftCardKeys.detail(id),
    queryFn: () => giftCardsService.getGiftCardById(id!),
    enabled: Boolean(id),
  })
}

export function useIssueGiftCard(customerId?: string) {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: (catalogId: string) => {
      if (profile?.verificationStatus !== 'verified') {
        throw new Error('ID verification is required before using reward value actions.')
      }
      return giftCardsService.issueGiftCard(catalogId, customerId!)
    },
    onSuccess: (giftCard) => {
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.myCards })
      void queryClient.invalidateQueries({ queryKey: ['reward-balance', customerId] })
      void queryClient.invalidateQueries({ queryKey: ['activities', customerId] })
      toast.success('Gift card issued')
      return giftCard
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useRedeemGiftCard(businessId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (giftCardId: string) => giftCardsService.redeemGiftCard(giftCardId, businessId!),
    onSuccess: (giftCard) => {
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.businessCards(businessId) })
      void queryClient.invalidateQueries({ queryKey: giftCardKeys.detail(giftCard.id) })
      void queryClient.invalidateQueries({ queryKey: ['activities', giftCard.customerId] })
      toast.success('Gift card redeemed')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function usePublicGiftCard(token?: string) {
  return useQuery({
    queryKey: giftCardKeys.public(token),
    queryFn: () => giftCardsService.getPublicGiftCard(token!),
    enabled: Boolean(token),
    retry: false,
  })
}
