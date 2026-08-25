import { useState, useEffect } from 'react'
import { X, Inbox } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', icon: Icon, iconRight: IconR, full, onClick, type = 'button', disabled, className = '', title }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'h-8 px-3 text-[13px] rounded-[6px]',
    md: 'h-9 px-3.5 text-[13px] rounded-[7px]',
    lg: 'h-10 px-4 text-sm rounded-[8px]',
  }
  const variants = {
    primary: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,23,42,0.18)]',
    secondary: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
    ghost: 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
    accent: 'bg-blue-600 text-white hover:bg-blue-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(37,99,235,0.25)]',
  }
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 14 : 15} strokeWidth={2} />}
      {children}
      {IconR && <IconR size={size === 'sm' ? 14 : 15} strokeWidth={2} />}
    </button>
  )
}

export function Input({ icon: Icon, value, onChange, placeholder, type = 'text', className = '', ...rest }) {
  return (
    <div className={`relative ${className}`}>
      {Icon && <Icon size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-9 ${Icon ? 'pl-8' : 'pl-3'} pr-3 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700/40 transition`}
        {...rest}
      />
    </div>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3, ...rest }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700/40 transition resize-none"
      {...rest}
    />
  )
}

export function Select({ value, onChange, options, placeholder = 'Selecionar', className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`h-9 px-2.5 pr-7 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700/40 transition appearance-none bg-no-repeat ${className}`}
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.6rem center',
        backgroundSize: '10px',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Badge({ children, tone = 'slate', icon: Icon, size = 'md' }) {
  const tones = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-700',
    amber: 'bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-700',
    rose: 'bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-700',
    violet: 'bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-700',
    dark: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100',
  }
  const sizes = { sm: 'text-[10.5px] px-1.5 h-4 gap-1', md: 'text-[11px] px-2 h-[22px] gap-1' }
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${tones[tone]} ${sizes[size]}`}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {children}
    </span>
  )
}

export function Card({ children, className = '', interactive }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] ${interactive ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Avatar({ initials, size = 32, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    violet: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
    rose: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
  }
  const t = tone === 'auto'
    ? Object.keys(tones)[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % Object.keys(tones).length]
    : tone
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-medium ${tones[t]}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

export function KPI({ label, value, delta, tone = 'slate', icon: Icon }) {
  const tones = {
    slate: 'text-slate-500 dark:text-slate-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    rose: 'text-rose-600 dark:text-rose-400',
  }
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">{value}</span>
        {delta && <span className={`text-[11px] font-medium tabular-nums ${tones[tone]}`}>{delta}</span>}
      </div>
    </Card>
  )
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_120ms_ease-out]">
      <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white dark:bg-slate-900 rounded-[12px] shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[88vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children, footer, width = 520 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div
        className={`absolute top-0 right-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-white dark:bg-slate-900">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon size={18} className="text-slate-500 dark:text-slate-400" />
      </div>
      <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{title}</p>
      {hint && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex items-center gap-0.5 border-b border-slate-200 dark:border-slate-700">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`relative h-9 px-3 text-[13px] font-medium transition ${value === t.value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            {t.icon && <t.icon size={14} />}
            {t.label}
            {typeof t.count === 'number' && (
              <span className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded ${value === t.value ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{t.count}</span>
            )}
          </span>
          {value === t.value && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-slate-100 rounded-t" />}
        </button>
      ))}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-[6px] ${className}`} />
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-[8px] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-1.5 mt-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 mt-3 pt-3 flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])
  const push = (msg, tone = 'slate') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }
  const node = (
    <div className="fixed bottom-5 right-5 z-[60] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto px-3.5 py-2.5 rounded-[8px] text-[13px] shadow-lg border animate-[slideUp_180ms_ease-out] ${t.tone === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-900 text-white border-slate-800'}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
  return { push, node }
}
