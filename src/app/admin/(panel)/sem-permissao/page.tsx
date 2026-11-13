import Link from "next/link";

export default function NoPermissionPage() {
  return (
    <>
      <h1>Acesso negado</h1>
      <p>Seu perfil não tem permissão para essa área. Fale com um administrador se precisar de acesso.</p>
      <p>
        <Link href="/admin">Voltar ao painel</Link>
      </p>
    </>
  );
}
