import { Link, usePath } from "raviger";
import { ActiveLinkProps } from "raviger/dist/Link";

export function ActiveLink({
  href,
  className,
  activeClass,
  links = [],
  ...props
}: ActiveLinkProps & { links: { url: string }[] }) {
  const pathname = usePath();

  const isNestedMatch =
    pathname?.startsWith(href) && pathname.length > href.length;

  const isExactCollison = links.some((link) => link.url === pathname);

  const isNestedCollison = links.some(
    (link) => pathname?.startsWith(link.url) && href.length < link.url.length,
  );

  const isExactMatch = pathname === href;

  const computedClassName = isExactMatch
    ? activeClass
    : isNestedMatch && !isExactCollison && !isNestedCollison
      ? activeClass
      : "";

  return (
    <Link
      href={href}
      className={`${className} ${computedClassName}`}
      {...props}
    />
  );
}
