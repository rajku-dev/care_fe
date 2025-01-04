import { Link } from "raviger";
import { ActiveLinkProps } from "raviger/dist/Link";

export function NavLink({
  href,
  className,
  activeClass,
  activeLink,
  setActive,
  name,
  ...props
}: ActiveLinkProps & {
  activeLink: string | null;
  setActive: (name: string) => void;
  name: string;
}) {
  const handleClick = () => {
    setActive(name);
  };

  const computedClassName = activeLink == name ? activeClass : "";

  return (
    <div onClick={handleClick}>
      <Link
        href={href}
        className={`${className} ${computedClassName}`}
        {...props}
      />
    </div>
  );
}
