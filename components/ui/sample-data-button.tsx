type SampleDataButtonProps = {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
};

export function SampleDataButton({
  label = "샘플 입력",
  onClick,
  disabled = false,
}: SampleDataButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="button-secondary inline-flex min-h-9 items-center justify-center px-3 py-2 text-xs disabled:opacity-40"
    >
      {label}
    </button>
  );
}
