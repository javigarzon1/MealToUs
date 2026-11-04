export default function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className={`brand${large ? " brand--lg" : ""}`}>
      <img src="/logo.svg" alt="" width={large ? 150 : 52} height={large ? 150 : 52} />
      <span>Meal<b>To</b>Us</span>
    </div>
  );
}
