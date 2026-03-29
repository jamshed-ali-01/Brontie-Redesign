type Button = {
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  text?: string;
};

export default function Button({
  onClick,
  children,
  text,
  disabled,
  className,
}: Button) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`uppercase p-3.5 rounded-2xl text-black text-lg font-bold tracking-[-2%] w-full ${className} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {text || children}
    </button>
  );
}
