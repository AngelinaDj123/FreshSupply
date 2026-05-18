// Shared UI primitives for FarmDirect

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:border-green-200 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:   'bg-gray-100 text-gray-600',
    green:     'bg-green-100 text-green-700',
    amber:     'bg-amber-100 text-amber-700',
    red:       'bg-red-100 text-red-700',
    blue:      'bg-blue-100 text-blue-700',
    urgent:    'bg-red-100 text-red-700 font-semibold',
    delivered: 'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    in_transit:'bg-purple-100 text-purple-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'default', size = 'md', loading, className = '', ...props }) {
  const variants = {
    default: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    primary: 'bg-green-700 text-white hover:bg-green-800 border border-green-700',
    danger:  'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    ghost:   'text-gray-600 hover:bg-gray-100 border border-transparent',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5' };
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`px-3 py-2 rounded-lg border text-sm transition-colors outline-none
          ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`px-3 py-2 rounded-lg border text-sm bg-white outline-none transition-colors
          ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Stat({ label, value, sub, highlight }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function FreshnessBar({ pct, name, unit, qty, expiresAt }) {
  const color = pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-amber-400' : 'bg-red-500';
  const daysLeft = Math.max(0, Math.round((new Date(expiresAt) - new Date()) / 86400000));
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-600 w-32 truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs w-8 text-right font-medium ${pct < 30 ? 'text-red-600' : 'text-gray-500'}`}>{Math.round(pct)}%</span>
      <span className="text-xs text-gray-400 w-16 text-right">{daysLeft}d left</span>
    </div>
  );
}

export function OrderStatusBadge({ status }) {
  const map = {
    pending:    { label: 'Pending',    variant: 'amber' },
    confirmed:  { label: 'Confirmed',  variant: 'blue' },
    preparing:  { label: 'Preparing',  variant: 'blue' },
    in_transit: { label: 'In transit', variant: 'in_transit' },
    delivered:  { label: 'Delivered',  variant: 'delivered' },
    cancelled:  { label: 'Cancelled',  variant: 'cancelled' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-10 h-10 text-gray-300 mb-3" />}
      <p className="text-gray-600 font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
