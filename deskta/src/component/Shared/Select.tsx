interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  icon,
  disabled = false,
}: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && (
        <label
          style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: `8px 12px 8px ${icon ? '40px' : '12px'}`,
            border: "1px solid #D1D5DB",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: disabled ? "#F3F4F6" : "white",
            color: "#1F2937",
            cursor: disabled ? "not-allowed" : "pointer",
            outline: "none",
            appearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            backgroundSize: '16px',
          }}
        >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        </select>
      </div>
    </div>
  );
}
