import Link from "next/link";

export default function EventNotFound() {
  return (
    <>
      <h1>Evento não encontrado</h1>
      <p>O evento pode ter sido removido ou o endereço está incorreto.</p>
      <p>
        <Link href="/">Ver a agenda completa</Link>
      </p>
    </>
  );
}
