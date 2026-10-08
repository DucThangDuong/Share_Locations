import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface CustomSelectOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: (CustomSelectOption<T> | T)[];
  placeholder?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  id?: string;
}

export function CustomSelect<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  label,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  size = "md",
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options array into CustomSelectOption objects
  const normalizedOptions: CustomSelectOption<T>[] = options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt && "label" in opt) {
      return opt as CustomSelectOption<T>;
    }
    return {
      value: opt as T,
      label: String(opt),
    };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-3.5 py-2 text-xs sm:text-sm rounded-xl",
    lg: "px-4 py-2.5 text-sm sm:text-base rounded-2xl",
  }[size];

  const itemSizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-3.5 py-2 text-xs sm:text-sm rounded-xl",
    lg: "px-4 py-2.5 text-sm rounded-xl",
  }[size];

  return (
    <div className={`relative flex flex-col ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 mb-1.5 select-none"
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800 font-medium flex items-center justify-between gap-2 transition-all shadow-2xs cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${buttonClassName} ${
          isOpen ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={`truncate ${!selectedOption ? "text-slate-400 font-normal" : "text-slate-800"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={size === "sm" ? 14 : 16}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100 ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400 text-center">
              Không có lựa chọn
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2 w-full transition-colors cursor-pointer select-none ${itemSizeClasses} ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : isSelected
                      ? "bg-emerald-50 text-emerald-600 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
