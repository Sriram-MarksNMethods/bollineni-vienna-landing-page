interface ButtonProps {
  href?: string;
  text: string;
  variant?: "primary" | "secondary" | "form-submit";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  download?: boolean | string;
}

export default function Button({
  href,
  text,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  download,
}: ButtonProps) {
  const variantClass =
    variant === "secondary" ? "bg-white text-black" : "bg-ink text-white";
  const btnClass = `text-center rounded-[25vw] py-[0.65vw] px-[1.35vw] font-medium cursor-pointer transition-colors duration-100 max-lg:rounded-[25rem] max-lg:py-[0.65rem] max-lg:px-[1.35rem] disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        download={download}
        className={`${btnClass} inline-block max-w-full`}
      >
        {text}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} className={btnClass}>
      {text}
    </button>
  );
}
