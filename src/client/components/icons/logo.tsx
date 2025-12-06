export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <title>X-Tool Logo</title>
    <path d="M12 12c-3.333-3.333-5-5-5-5a7 7 0 1 1 10 0s-1.667 1.667-5 5z" />
    <path d="M12 12l5 5" />
    <path d="M12 12l-5 5" />
  </svg>
);
