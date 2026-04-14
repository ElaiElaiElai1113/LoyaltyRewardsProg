import { Package, Plus, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '@/hooks/use-admin-data'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils'
import { productDraftSchema, type ProductDraftFormValues } from '@/types/forms'
import { Controller } from 'react-hook-form'

export function ProductsPage() {
  const { business, products } = useBusinessOwnerData()
  const { session, profile } = useAuth()
  const createProduct = useCreateProduct(profile)
  const deleteProduct = useDeleteProduct(profile?.fullName)
  const updateProduct = useUpdateProduct(profile?.fullName)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProductDraftFormValues>({
    resolver: zodResolver(productDraftSchema),
    defaultValues: {
      businessId: session?.businessId ?? '',
      title: '',
      description: '',
      category: 'Coffee',
      price: 4.5,
      highlight: '',
    },
  })

  const handleEdit = (product: any) => {
    setEditingId(product.id)
    form.reset({
      businessId: product.businessId,
      title: product.title,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      highlight: product.highlight || '',
    })
    setOpen(true)
  }

  const handleOpenForCreate = () => {
    setEditingId(null)
    form.reset({
      businessId: session?.businessId ?? '',
      title: '',
      description: '',
      category: 'Coffee',
      price: 4.5,
      highlight: '',
    })
    setOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(productId)
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null)
      if (editingId) {
        await updateProduct.mutateAsync({ productId: editingId, values })
      } else {
        await createProduct.mutateAsync({ ...values, businessId: session!.businessId! })
      }
      form.reset()
      setOpen(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    }
  })

  const businessColors =
    business?.slug === 'cafe-cliche'
      ? { primary: 'from-[#8B4513] to-[#654321]', light: 'from-[#8B4513]/10 to-[#654321]/10' }
      : { primary: 'from-[#5B2C6F] to-[#4A235A]', light: 'from-[#5B2C6F]/10 to-[#4A235A]/10' }

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Products</h1>
          <p className="text-lg text-on-surface-variant/85">
            View and manage your product catalog and inventory.
          </p>
        </div>
        <Button className="rounded-full h-14 px-8 font-semibold" onClick={handleOpenForCreate}>
          <Plus className="size-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingId ? 'Edit Product' : 'New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="product-title">Title</Label>
              <Input id="product-title" placeholder="Nitro Cold Brew" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea id="product-description" placeholder="Our signature nitro brew..." {...form.register('description')} />
              {form.formState.errors.description && (
                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                      <SelectItem value="Pastry">Pastry</SelectItem>
                      <SelectItem value="Merch">Merch</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Price ($)</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                placeholder="4.50"
                {...form.register('price', { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-highlight">Highlight</Label>
              <Input id="product-highlight" placeholder="Special Roast" {...form.register('highlight')} />
            </div>
            {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Products Grid */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <div className="rounded-3xl bg-white border border-outline-variant/5 p-16 text-center">
            <Package className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-primary mb-2">No products yet</h3>
            <p className="text-on-surface-variant/70">Products added via the admin portal will appear here.</p>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="group flex items-center justify-between rounded-3xl bg-white hover:bg-surface-low p-6 border border-outline-variant/5 hover:border-primary/10 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`size-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold ${businessColors.primary}`}
                >
                  {product.title.charAt(0)}
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-xl text-primary">{product.title}</p>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant/70">
                    <span>{product.category}</span>
                    <span className="size-1 rounded-full bg-outline-variant/30"></span>
                    <span>{product.inventory} in stock</span>
                    {product.featured && (
                      <>
                        <span className="size-1 rounded-full bg-outline-variant/30"></span>
                        <span className="text-secondary font-medium">Featured</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                  {product.highlight && (
                    <p className="text-xs text-on-surface-variant/60 mt-1">{product.highlight}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="size-9 rounded-full" onClick={() => handleEdit(product)}>
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-9 rounded-full text-error hover:text-error hover:bg-error/10" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
