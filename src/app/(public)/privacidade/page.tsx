import type { Metadata } from "next";
import { deleteMyDeviceData } from "./actions";

export const metadata: Metadata = { title: "Privacidade" };

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ apagado?: string }> }) {
  const deleted = (await searchParams).apagado === "1";
  return (
    <>
      <div className="page-intro">
        <h1>Privacidade</h1>
        <p>O que guardamos, por quanto tempo e como apagar.</p>
      </div>
      <div className="notice notice--warning" role="note">
        <strong>Texto provisório.</strong> Este aviso ainda será validado pelo shopping (controlador dos
        dados) e pelo seu encarregado de proteção de dados. Ele não é uma declaração de conformidade legal.
      </div>
      {deleted && (
        <div className="notice notice--success" role="status">
          Os dados deste dispositivo foram apagados e o identificador foi removido.
        </div>
      )}

      <h2>O que você pode fazer sem cadastro</h2>
      <p>
        Consultar a agenda, ver detalhes dos eventos, salvar eventos, adicionar à sua agenda pessoal e
        compartilhar.
      </p>

      <h2>O que guardamos</h2>
      <ul>
        <li>
          <strong>Identificador aleatório deste dispositivo</strong> (cookie <code>cs_device</code>, até 180
          dias). No nosso banco fica apenas uma versão cifrada (HMAC) desse identificador. Ele serve para
          contar acessos sem duplicar. Não é anônimo: é um dado pseudonimizado.
        </li>
        <li>
          <strong>Origem da visita</strong> (cookie de sessão <code>cs_visit</code>): por qual canal você
          chegou (Instagram, Wi-Fi, cartaz com QR Code…).
        </li>
        <li>
          <strong>Eventos salvos</strong> (botão de coração): a lista fica só no armazenamento deste navegador
          e nunca é enviada para nós. Para apagá-la, desmarque os eventos ou limpe os dados do site no
          navegador.
        </li>
        <li>
          <strong>Modo escuro</strong> (botão da lua no topo): a escolha entre modo claro e escuro fica só no
          armazenamento deste navegador e nunca é enviada para nós.
        </li>
        <li>
          <strong>Endereço IP</strong>: usado só em memória, por alguns minutos, para evitar abuso. Não é
          gravado no banco de dados.
        </li>
      </ul>
      <p>
        Não pedimos nome, e-mail, telefone ou CPF. Não usamos ferramentas de análise ou anúncios de terceiros.
        Os relatórios da equipe mostram apenas números agregados.
      </p>

      <h2>Por quanto tempo</h2>
      <p>
        Prazo proposto: uma rotina de retenção agrega e apaga os registros por dispositivo com mais de 30
        dias; ficam só os totais, sem identificador. Esse prazo ainda depende de validação pelo shopping. Você
        também pode usar o botão abaixo para apagar seus dados quando quiser.
      </p>

      <h2>Apagar meus dados deste dispositivo</h2>
      <p>Remove os registros ligados a este dispositivo e apaga o identificador do navegador.</p>
      <form action={deleteMyDeviceData}>
        <button type="submit" className="button button--danger">
          Apagar meus dados deste dispositivo
        </button>
      </form>

      <h2>Contato</h2>
      <p>Contato do encarregado de dados: a ser informado pelo shopping.</p>
    </>
  );
}
