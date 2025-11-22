// components/receivable-details-dialog.tsx
'use client'

import { useEffect, useState } from 'react'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'
import { AlertCircle } from 'lucide-react'

type ReceivableStatus = 'open' | 'partial' | 'overdue' | 'paid'

interface Receivable {
    id: string
    customerId: string | null
    saleId: string | null
    customer: string
    saleDate: string | null
    dueDate: string
    installment: string
    originalAmount: number
    outstanding: number
    status: ReceivableStatus
}

interface PaymentRow {
    amount: number
    date: string | null
}

interface ItemRow {
    productName: string
    quantity: number
    subtotal: number
}

interface ReceivableDetailsDialogProps {
    receivable: Receivable | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceivableDetailsDialog({
    receivable,
    open,
    onOpenChange,
}: ReceivableDetailsDialogProps) {
    const [payments, setPayments] = useState<PaymentRow[]>([])
    const [items, setItems] = useState<ItemRow[]>([])
    const [customerPhone, setCustomerPhone] = useState<string | null>(null)
    const [customerCpf, setCustomerCpf] = useState<string | null>(null)
    const [totalSaleAmount, setTotalSaleAmount] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDetails = async () => {
            if (!receivable || !open) {
                setPayments([])
                setItems([])
                setCustomerPhone(null)
                setCustomerCpf(null)
                setTotalSaleAmount(null)
                setError(null)
                return
            }

            setLoading(true)
            setError(null)

            try {
                // Pagamentos dessa parcela
                const { data: paymentsData, error: payError } = await supabase
                    .from('payments')
                    .select('amount, payment_date')
                    .eq('receivable_id', receivable.id)
                    .order('payment_date', { ascending: true })

                if (payError) throw payError

                setPayments(
                    (paymentsData ?? []).map((p: any) => ({
                        amount: Number(p.amount ?? 0),
                        date: p.payment_date,
                    })),
                )

                // Se tiver venda associada, buscar itens e dados extras
                if (receivable.saleId) {
                    const [saleRes, itemsRes, productsRes] = await Promise.all([
                        supabase
                            .from('sales')
                            .select('id, total_amount, customer_id')
                            .eq('id', receivable.saleId)
                            .single(),
                        supabase
                            .from('sale_items')
                            .select('product_id, quantity, subtotal')
                            .eq('sale_id', receivable.saleId),
                        supabase.from('products').select('id, name'),
                    ])

                    if (saleRes.error) throw saleRes.error
                    if (itemsRes.error) throw itemsRes.error
                    if (productsRes.error) throw productsRes.error

                    const sale = saleRes.data as {
                        id: string
                        total_amount: number | string | null
                        customer_id: string | null
                    }

                    setTotalSaleAmount(Number(sale.total_amount ?? 0))

                    const productMap = (productsRes.data ?? []).reduce(
                        (acc: Record<string, string>, p: any) => {
                            acc[p.id] = p.name
                            return acc
                        },
                        {},
                    )

                    setItems(
                        (itemsRes.data ?? []).map((it: any) => ({
                            productName: productMap[it.product_id] ?? 'Produto',
                            quantity: it.quantity,
                            subtotal: Number(it.subtotal ?? 0),
                        })),
                    )

                    if (sale.customer_id) {
                        const { data: cust, error: custError } = await supabase
                            .from('customers')
                            .select('phone, cpf')
                            .eq('id', sale.customer_id)
                            .single()

                        if (!custError && cust) {
                            setCustomerPhone(cust.phone ?? null)
                            setCustomerCpf(cust.cpf ?? null)
                        } else {
                            setCustomerPhone(null)
                            setCustomerCpf(null)
                        }
                    } else {
                        setCustomerPhone(null)
                        setCustomerCpf(null)
                    }
                } else {
                    setItems([])
                    setTotalSaleAmount(null)
                    setCustomerPhone(null)
                    setCustomerCpf(null)
                }
            } catch (err: any) {
                console.error('Erro ao carregar detalhes da parcela', err)
                setError('Erro ao carregar detalhes. Tente novamente.')
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [receivable, open])

    if (!receivable) return null

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0)

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        if (Number.isNaN(d.getTime())) return dateStr
        return d.toLocaleDateString('pt-BR')
    }

    const getStatusBadge = (status: ReceivableStatus) => {
        const variants: Record<
            ReceivableStatus,
            { label: string; className: string }
        > = {
            open: {
                label: 'Em aberto',
                className: 'bg-amber-500 hover:bg-amber-600 text-white',
            },
            partial: {
                label: 'Parcial',
                className: 'border-amber-500 text-amber-700',
            },
            overdue: {
                label: 'Vencido',
                className: 'bg-destructive hover:bg-destructive/90 text-white',
            },
            paid: {
                label: 'Pago',
                className: 'bg-emerald-500 hover:bg-emerald-600 text-white',
            },
        }

        const config = variants[status]
        return (
            <Badge className={config.className}>
                {status === 'overdue' && <AlertCircle className="mr-1 h-3 w-3" />}
                {config.label}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                    <DialogTitle>Detalhes da Parcela</DialogTitle>
                </DialogHeader>

                {error && (
                    <p className="mb-2 text-sm text-destructive">{error}</p>
                )}

                {loading && (
                    <p className="mb-2 text-sm text-muted-foreground">
                        Carregando detalhes...
                    </p>
                )}

                <div className="space-y-6">
                    {/* Resumo */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Cliente
                            </p>
                            <p className="text-sm font-semibold">{receivable.customer}</p>
                            {(customerPhone || customerCpf) && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {customerPhone && <>Tel: {customerPhone} </>}
                                    {customerCpf && (
                                        <>
                                            {customerPhone && '· '}CPF: {customerCpf}
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                            <p className="text-xs font-medium text-muted-foreground">
                                Situação
                            </p>
                            {getStatusBadge(receivable.status)}
                            <p className="text-xs text-muted-foreground">
                                Parcela {receivable.installment}
                            </p>
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Data da venda
                            </p>
                            <p className="font-medium">
                                {receivable.saleDate
                                    ? formatDate(receivable.saleDate)
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Vencimento desta parcela
                            </p>
                            <p className="font-medium">
                                {formatDate(receivable.dueDate)}
                            </p>
                        </div>
                    </div>

                    {/* Valores */}
                    <div className="grid gap-4 sm:grid-cols-3 text-sm">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Valor original da parcela
                            </p>
                            <p className="font-semibold">
                                {formatCurrency(receivable.originalAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Total pago nesta parcela
                            </p>
                            <p className="font-semibold text-emerald-600">
                                {formatCurrency(totalPaid)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Em aberto nesta parcela
                            </p>
                            <p className="font-semibold text-amber-600">
                                {formatCurrency(receivable.outstanding)}
                            </p>
                        </div>
                    </div>

                    {totalSaleAmount !== null && (
                        <div className="text-xs text-muted-foreground">
                            Valor total da venda:{' '}
                            <span className="font-semibold">
                                {formatCurrency(totalSaleAmount)}
                            </span>
                        </div>
                    )}

                    {/* Itens da venda */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            Itens da venda
                        </p>
                        {items.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Nenhum item encontrado para esta venda.
                            </p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto rounded border">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">
                                                Produto
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Qtde
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-t last:border-b-0"
                                            >
                                                <td className="px-3 py-2">{it.productName}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {it.quantity}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatCurrency(it.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagamentos */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            Pagamentos desta parcela
                        </p>
                        {payments.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Nenhum pagamento registrado ainda.
                            </p>
                        ) : (
                            <div className="max-h-40 overflow-y-auto rounded border">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">
                                                Data
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Valor
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-t last:border-b-0"
                                            >
                                                <td className="px-3 py-2">
                                                    {formatDate(p.date)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatCurrency(p.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
