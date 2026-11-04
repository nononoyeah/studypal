import { modules } from '../content/learning'
import { ProjectCard } from './ProjectCard'

/**
 * 学习模块列表：复用 ProjectCard 渲染，数据源切换为 learning mock
 */
export function ModulesSection() {
  return (
    <section id="modules" className="bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
          学习模块
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
