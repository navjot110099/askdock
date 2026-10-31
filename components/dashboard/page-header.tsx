export function PageHeader({ title, description, actions, eyebrow }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-[13px] text-muted-foreground">{eyebrow}</div>}
        <h1 className="font-display text-[38px] leading-[1.05] tracking-[-0.015em] sm:text-[44px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, action, children, className = "" }: { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-[22px] border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(24,19,31,0.04)] ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-5 sm:px-6">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-black/10 bg-white/60 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-iris">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-[14px] text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
