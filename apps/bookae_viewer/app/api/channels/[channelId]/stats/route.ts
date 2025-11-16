import { NextResponse } from 'next/server'
import { ChannelStats, TopProduct } from '@/lib/types/viewer'

// 쿠팡 통계 더미 데이터 (bookae_creator의 구조 참고)
const generateDummyStats = (channelId: string): ChannelStats => {
  // 더미 주문 데이터
  const dummyOrders = [
    {
      productId: 1234567,
      productName: '[모노마트] 와후카레 중간 맛(레토르트) 1kg',
      quantity: 45,
      gmv: 324000,
      thumbnailUrl: 'https://via.placeholder.com/200/f59e0b/ffffff?text=카레',
    },
    {
      productId: 1234568,
      productName: '[모노마트] 다이쇼 마파두부소스(마라소스) 1.16kg',
      quantity: 32,
      gmv: 486400,
      thumbnailUrl: 'https://via.placeholder.com/200/ef4444/ffffff?text=마파두부',
    },
    {
      productId: 1234569,
      productName: '등심 돈까스 800g (100g*8ea)',
      quantity: 28,
      gmv: 464800,
      thumbnailUrl: 'https://via.placeholder.com/200/10b981/ffffff?text=돈까스',
    },
    {
      productId: 1234570,
      productName: '빵가루 새우 튀김(헤드 OFF) 450g(45g*10ea)',
      quantity: 25,
      gmv: 170000,
      thumbnailUrl: 'https://via.placeholder.com/200/3b82f6/ffffff?text=새우',
    },
    {
      productId: 1234571,
      productName: '와후 치킨가라아게 1kg',
      quantity: 22,
      gmv: 275000,
      thumbnailUrl: 'https://via.placeholder.com/200/f97316/ffffff?text=치킨',
    },
    {
      productId: 1234572,
      productName: '고구마 치즈 고로케 720g(40g*18ea)',
      quantity: 18,
      gmv: 207000,
      thumbnailUrl: 'https://via.placeholder.com/200/a855f7/ffffff?text=고로케',
    },
  ]

  // productId별로 quantity 합계 계산
  const productMap = new Map<number, {
    productName: string
    totalQuantity: number
    totalGmv: number
    thumbnailUrl?: string
    orderCount: number
  }>()

  dummyOrders.forEach((order) => {
    const existing = productMap.get(order.productId)
    if (existing) {
      existing.totalQuantity += order.quantity
      existing.totalGmv += order.gmv
      existing.orderCount += 1
    } else {
      productMap.set(order.productId, {
        productName: order.productName,
        totalQuantity: order.quantity,
        totalGmv: order.gmv,
        thumbnailUrl: order.thumbnailUrl,
        orderCount: 1,
      })
    }
  })

  // Top 5 제품 계산 (주문 수 기준, 동일하면 GMV 기준)
  const topProducts: TopProduct[] = Array.from(productMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.productName,
      thumbnailUrl: data.thumbnailUrl,
      totalQuantity: data.totalQuantity,
      totalGmv: data.totalGmv,
      averagePrice: Math.floor(data.totalGmv / data.totalQuantity),
      orderCount: data.orderCount,
    }))
    .sort((a, b) => {
      // 주문 수 기준 정렬
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity
      }
      // 동일하면 GMV 기준 정렬
      return b.totalGmv - a.totalGmv
    })
    .slice(0, 5)

  const totalOrders = dummyOrders.reduce((sum, o) => sum + o.quantity, 0)
  const totalGmv = dummyOrders.reduce((sum, o) => sum + o.gmv, 0)
  const totalRevenue = Math.floor(totalGmv * 0.05) // 5% 수수료 가정

  return {
    topProducts,
    totalOrders,
    totalRevenue,
    totalGmv,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    // 통계 데이터 생성 (추후 실제 API 연동)
    const stats = generateDummyStats(channelId)

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('통계 API 오류:', error)
    return NextResponse.json(
      { error: '통계 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

