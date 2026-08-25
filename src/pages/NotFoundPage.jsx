import { useNavigate } from 'react-router-dom'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '../components/ui.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mb-5">
        <SearchX size={24} className="text-slate-400 dark:text-slate-500" />
      </div>
      <div className="text-[64px] font-bold text-slate-200 dark:text-slate-800 leading-none mb-4 tabular-nums select-none">404</div>
      <h1 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Página não encontrada</h1>
      <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
        A página que você está procurando não existe ou foi movida.
      </p>
      <div className="mt-7">
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/')}>Voltar para vagas</Button>
      </div>
    </div>
  )
}
