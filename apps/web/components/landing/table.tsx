import { cn } from '@/lib/utils'

const MESCHAC_AVATAR = 'https://avatars.githubusercontent.com/u/47919550?v=4'
const BERNARD_AVATAR = 'https://avatars.githubusercontent.com/u/31113941?v=4'
const THEO_AVATAR = 'https://avatars.githubusercontent.com/u/68236786?v=4'
const GLODIE_AVATAR = 'https://avatars.githubusercontent.com/u/99137927?v=4'

export const Table = ({ className }: { className?: string }) => {
    const tasks = [
        {
            id: 1,
            date: '12/03/2026',
            status: 'Concluída',
            statusVariant: 'success',
            name: 'Dra. Ana Lima',
            avatar: BERNARD_AVATAR,
            source: 'E-mail',
        },
        {
            id: 2,
            date: '13/03/2026',
            status: 'Em revisão',
            statusVariant: 'warning',
            name: 'Dr. Paulo Costa',
            avatar: MESCHAC_AVATAR,
            source: 'Intimação',
        },
        {
            id: 3,
            date: '14/03/2026',
            status: 'Concluída',
            statusVariant: 'success',
            name: 'Dra. Carla Nunes',
            avatar: GLODIE_AVATAR,
            source: 'Andamento',
        },
        {
            id: 4,
            date: '15/03/2026',
            status: 'Atrasada',
            statusVariant: 'danger',
            name: 'Equipe Trabalhista',
            avatar: THEO_AVATAR,
            source: 'Prazo judicial',
        },
    ]

    return (
        <div className={cn('bg-background shadow-foreground/5 inset-ring-1 inset-ring-background ring-foreground/5 relative w-full overflow-hidden rounded-xl border border-transparent p-6 shadow-md ring-1', className)}>
            <div className="mb-6">
                <div className="flex gap-1.5">
                    <div className="bg-muted size-2 rounded-full border border-black/5"></div>
                    <div className="bg-muted size-2 rounded-full border border-black/5"></div>
                    <div className="bg-muted size-2 rounded-full border border-black/5"></div>
                </div>
                <div className="mt-3 text-lg font-medium">Painel de execução jurídica</div>
                <p className="mt-1 text-sm">Tarefas priorizadas por prazo, origem e responsável.</p>
            </div>
            <table
                className="w-max table-auto border-collapse lg:w-full"
                data-rounded="medium">
                <thead className="dark:bg-background bg-gray-950/5">
                    <tr className="*:border *:p-3 *:text-left *:text-sm *:font-medium">
                        <th className="rounded-l-[--card-radius]">#</th>
                        <th>Prazo</th>
                        <th>Status</th>
                        <th>Responsável</th>
                        <th className="rounded-r-[--card-radius]">Origem</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {tasks.map((task, index) => (
                        <tr
                            key={task.id}
                            className="*:border *:p-2">
                            <td>{task.id}</td>
                            <td>{task.date}</td>
                            <td>
                                <span className={cn('rounded-full px-2 py-1 text-xs', task.statusVariant == 'success' && 'bg-lime-500/15 text-lime-800', task.statusVariant == 'danger' && 'bg-red-500/15 text-red-800', task.statusVariant == 'warning' && 'bg-yellow-500/15 text-yellow-800')}>{task.status}</span>
                            </td>
                            <td>
                                <div className="flex items-center gap-2">
                                    <div className="size-6 overflow-hidden rounded-full">
                                        <img
                                            src={task.avatar}
                                            alt={task.name}
                                            width="120"
                                            height="120"
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="text-foreground">{task.name}</span>
                                </div>
                            </td>
                            <td>{task.source}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
