import React from "react";
import { Bell, Search } from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface ActionButtonProps {
  icon: React.ReactNode;
  iconBg?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "pill" | "bubble";
}

function ActionButton({
  icon,
  iconBg,
  children,
  className,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-10 rounded-full px-5 text-[13px] font-semibold inline-flex items-center gap-2",
        "border border-border-soft bg-white text-slate-800 shadow-apple-sm",
        "transition-all active:opacity-80 active:scale-[0.98]",
        "hover:bg-slate-50",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 bg-slate-100 text-slate-700",
            iconBg,
          )}
        >
          {icon}
        </span>
      )}
      <span className="leading-none whitespace-nowrap">{children}</span>
    </button>
  );
}

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
  variant?: "pill" | "bubble";
}

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  actions?: {
    primary?: ActionConfig;
    secondary?: ActionConfig;
  };
  userInitials?: string;
}

export default function Header({
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = "Tìm kiếm nhanh...",
  onSearchChange,
  actions,
  userInitials = "VT",
}: HeaderProps) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col items-start">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1.5">
          F4 Ecosystem
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <div className="text-[13px] text-slate-500 mt-1.5 flex flex-col sm:flex-row sm:items-center gap-2">
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showSearch && (
          <div className="hidden xl:flex items-center gap-2.5 rounded-full bg-white border border-border-soft px-4 py-2 w-[260px] shadow-apple-inset focus-within:ring-2 focus-within:ring-primary/15 transition-shadow" role="search">
            <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              className="w-full bg-transparent outline-none text-[14px] text-slate-700 placeholder:text-slate-500 font-normal"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {actions?.secondary && (
            <ActionButton
              onClick={actions.secondary.onClick}
              className={actions.secondary.bgColor}
              icon={actions.secondary.icon}
            >
              {actions.secondary.label}
            </ActionButton>
          )}

          {actions?.primary && (
            <ActionButton
              onClick={actions.primary.onClick}
              className={actions.primary.bgColor}
              icon={actions.primary.icon}
            >
              {actions.primary.label}
            </ActionButton>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-border-soft ml-1">
          <button
            type="button"
            aria-label="Thông báo"
            className="relative w-11 h-11 rounded-full bg-white border border-border-soft flex items-center justify-center transition-all active:opacity-80 active:scale-[0.98] hover:bg-slate-50 shadow-flat"
          >
            <Bell className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-white" aria-label="Có thông báo mới" />
          </button>

          <button
            type="button"
            aria-label="Tài khoản người dùng"
            className="w-11 h-11 rounded-full bg-primary flex items-center justify-center transition-all active:opacity-90 active:scale-[0.98] text-[14px] font-bold text-white shadow-flat"
          >
            {userInitials}
          </button>
        </div>
      </div>
    </header>
  );
}
