const PATHS = {
  Chips: (
    <path d="M8 4h8l2 4-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" />
  ),
  Soda: (
    <path d="M8 3h8l-1 3.5.9 13.6a1.6 1.6 0 0 1-1.6 1.9H9.7a1.6 1.6 0 0 1-1.6-1.9L9 6.5Z" />
  ),
  Snacks: <rect x="5" y="6" width="14" height="14" />,
  Beverages: <path d="M9 2h6l.6 4H8.4Zm-.9 4h7.8l1 13.2a1.8 1.8 0 0 1-1.8 1.8H8.9a1.8 1.8 0 0 1-1.8-1.8Z" />,
};

export const CATEGORY_COLOR = {
  Chips: "#d4823a",
  Soda: "#4fc3d9",
  Snacks: "#8b8cf0",
  Beverages: "#5b9df9",
};

export default function CategoryIcon({ category, size = 20 }) {
  const path = PATHS[category] ?? PATHS.Snacks;
  const color = CATEGORY_COLOR[category] ?? "var(--accent)";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
      {path}
    </svg>
  );
}
