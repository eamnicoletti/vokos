import { getOptionalResendEnv } from "@/lib/env";

type SendInvitationEmailParams = {
  to: string;
  organizationName: string;
  inviteLink: string;
  expiresAt: string;
};

export async function sendOrganizationInvitationEmail(params: SendInvitationEmailParams) {
  const resend = getOptionalResendEnv();

  // TODO: Replace the test sender with a verified production domain on Resend before go-live.
  if (!resend.apiKey || !resend.fromEmail) {
    return {
      ok: false,
      error: "Resend não configurado. O convite foi criado, mas o envio automático não está ativo."
    };
  }

  const expiresLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(params.expiresAt));

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resend.fromEmail,
        to: [params.to],
        subject: `Convite para ${params.organizationName} na Vokos`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
            <h2 style="margin-bottom: 16px;">Você recebeu um convite para entrar em ${params.organizationName}</h2>
            <p style="margin-bottom: 16px;">
              A Vokos gerou um link seguro para você aceitar o convite e acessar a organização.
            </p>
            <p style="margin-bottom: 24px;">
              Este convite expira em <strong>${expiresLabel}</strong>.
            </p>
            <a
              href="${params.inviteLink}"
              style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none;"
            >
              Aceitar convite
            </a>
            <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
              Se o botão não funcionar, use este link:<br />
              <a href="${params.inviteLink}">${params.inviteLink}</a>
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const payload = (await response.text()) || "unknown error";
      return {
        ok: false,
        error: `Falha ao enviar e-mail pelo Resend: ${payload}`
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha desconhecida ao chamar o Resend."
    };
  }
}
