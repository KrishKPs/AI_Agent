export default function Banner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="banner" role="alert">
      <span>{message}</span>
      <button className="banner-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
