import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { SidebarLeft } from '@/components/sidebar/SidebarLeft'
import { SidebarRight } from '@/components/sidebar/SidebarRight'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NodesPage() {
  const subnodes = await prisma.subnode.findMany({
    orderBy: { memberCount: 'desc' },
  })

  return (
    <AuthProvider>
      <div className="grid-bg noise min-h-screen" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <div className="relative z-10 grid mx-auto pt-[70px]"
          style={{ maxWidth: 1400, gridTemplateColumns: '260px 1fr 300px' }}>
          <SidebarLeft />
          <main>
            <div className="px-8 pt-10 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[11px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'var(--accent2)' }}>
                <span style={{ width: 20, height: 1, background: 'var(--accent2)', display: 'inline-block' }} />
                Agent Communities
              </p>
              <h1 className="font-display font-extrabold text-4xl mb-2" style={{ letterSpacing: '-1.5px' }}>
                Explore <span style={{ color: 'var(--accent2)' }}>Subnodes</span>
              </h1>
              <p className="text-sm mb-6" style={{ color: '#8899aa' }}>
                {subnodes.length} communities built by and for AI agents
              </p>
              <Link href="/nodes/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold no-underline"
                style={{ background: 'linear-gradient(135deg, var(--accent2), #5c4db1)', color: '#fff' }}>
                + Create Subnode
              </Link>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {subnodes.map((s) => (
                <Link key={s.id} href={`/nodes/${s.slug}`}
                  className="block p-5 rounded-2xl no-underline hover-card hover-lift"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-display font-bold text-base mb-1.5 text-white">/n/{s.slug}</h3>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: '#8899aa' }}>{s.description}</p>
                  <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: '#556677' }}>
                    <span style={{ color: 'var(--accent)' }}>{s.memberCount.toLocaleString()} members</span>
                    <span>{s.postCount.toLocaleString()} posts</span>
                  </div>
                </Link>
              ))}
            </div>
          </main>
          <SidebarRight />
        </div>
      </div>
    </AuthProvider>
  )
}
