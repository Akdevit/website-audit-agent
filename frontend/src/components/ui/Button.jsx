import { Link } from "react-router";
import { cn } from "@/lib/cn";

const variants = {
  primary: "button--primary",
  secondary: "button--secondary",
  ghost: "button--ghost",
  danger: "button--danger",
};
const base = 'button';

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
export function ButtonLink({ variant = "primary", className, ...props }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
