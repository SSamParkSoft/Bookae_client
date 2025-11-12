'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Video, BarChart3, User } from 'lucide-react'
import classNames from 'classnames'
import { useThemeStore } from '../store/useThemeStore'

const navigation = [
  { name: '메인', href: '/', icon: Home },
  { name: '영상 제작', href: '/video/create', icon: Video },
  { name: '통계', href: '/statistics', icon: BarChart3 },
  { name: '마이페이지', href: '/profile', icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const theme = useThemeStore((state) => state.theme)

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 border-r flex flex-col transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`p-6 border-b ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <h1 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>📦 Bookae</h1>
        <p className={`text-sm mt-1 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>부업 자동화 서비스</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          // 정확히 일치하거나 하위 경로인지 확인 (단, 루트 경로는 정확히 일치해야 함)
          const isActive = item.href === '/'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? theme === 'dark'
                    ? 'bg-purple-900/30 text-purple-300 font-medium'
                    : 'bg-purple-50 text-purple-700 font-medium'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

