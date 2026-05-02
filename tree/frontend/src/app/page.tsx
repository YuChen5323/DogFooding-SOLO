import Link from 'next/link'
import { 
  Boxes, 
  Activity, 
  Earthquake, 
  FileText,
  ChevronRight,
  Layers,
  Shield,
  BookOpen
} from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: <Boxes className="h-8 w-8" />,
      title: '木构架搭建沙盒',
      description: '从构件库拖拽柱、梁、斗拱，按宋《营造法式》材份制自动匹配尺寸与榫卯相合',
      href: '/sandbox',
      color: 'from-wood-400 to-wood-600'
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: '节点受力分析',
      description: '显示荷载下榫头接触压力分布，采用颜色映射直观展示应力集中区域',
      href: '/stress',
      color: 'from-red-400 to-red-600'
    },
    {
      icon: <Earthquake className="h-8 w-8" />,
      title: '抗震推演',
      description: '输入地震波数据，模拟屋架摇摆响应，实时记录位移与能量耗散',
      href: '/earthquake',
      color: 'from-orange-400 to-orange-600'
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: '构造图册导出',
      description: '生成各视图构件名称标注图，支持 SVG 矢量格式输出',
      href: '/export',
      color: 'from-bamboo-500 to-bamboo-700'
    }
  ]

  const highlights = [
    {
      icon: <Layers className="h-6 w-6" />,
      title: '材份制精确计算',
      description: '严格遵循宋《营造法式》材份等级制度，实现构件尺寸自动换算'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: '物理引擎模拟',
      description: '基于 Cannon-es 物理引擎实现真实的碰撞检测与力学分析'
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: '数字化传承',
      description: '将传统建筑技艺与现代科技结合，促进文化遗产保护与研究'
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-wood-100 via-wood-50 to-wood-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-wood-200 px-4 py-2 text-sm font-medium text-wood-700">
            <span className="mr-2">🏯</span>
            中国古建筑数字化研究平台
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-wood-900 sm:text-5xl lg:text-6xl">
            大木作榫卯构造
            <br />
            <span className="bg-gradient-to-r from-wood-600 to-wood-400 bg-clip-text text-transparent">
              与抗震模拟系统
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-wood-700">
            基于《营造法式》的中国古建筑木结构设计平台，集构件搭建、受力分析、抗震模拟于一体
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sandbox"
              className="wood-button inline-flex items-center text-lg"
            >
              开始搭建
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/about"
              className="wood-button-outline inline-flex items-center text-lg"
            >
              了解更多
            </Link>
          </div>
        </div>
        
        <div className="absolute inset-x-0 -bottom-10 h-40 bg-gradient-to-t from-wood-100 to-transparent"></div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-wood-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-wood-900 mb-4">核心功能模块</h2>
            <p className="text-wood-600 max-w-2xl mx-auto">
              四个主要功能模块覆盖从设计到分析的完整工作流程
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group wood-panel p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-wood-900 mb-2 group-hover:text-wood-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-wood-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-wood-500 font-medium group-hover:text-wood-600">
                  进入模块
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-wood-100 to-wood-200">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-wood-900 mb-4">技术特色</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-wood-500 text-white mb-4 shadow-md">
                  {highlight.icon}
                </div>
                <h3 className="text-lg font-semibold text-wood-900 mb-2">
                  {highlight.title}
                </h3>
                <p className="text-wood-600">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-wood-900 text-wood-100 py-8 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-wood-400 text-sm">
            中国古建筑大木作榫卯构造与抗震模拟系统 · 基于 Next.js + React Three Fiber
          </p>
          <p className="text-wood-500 text-xs mt-2">
            传承千年营造技艺 · 探索现代数字建筑
          </p>
        </div>
      </footer>
    </div>
  )
}
