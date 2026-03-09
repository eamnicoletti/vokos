"use client";

import type { ComponentProps, FormEvent } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

type AuthMode = "login" | "signup";

type LoginFormProps = ComponentProps<"div"> & {
  mode?: AuthMode;
};

type PasswordRules = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

function evaluatePasswordStrength(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
}

export function LoginForm({ className, mode = "login", ...props }: LoginFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const passwordRules = useMemo(() => evaluatePasswordStrength(password), [password]);
  const isStrongPassword = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const hasConfirmPassword = confirmPassword.length > 0;
  const isSignupSubmitDisabled = !isStrongPassword || !hasConfirmPassword || !passwordsMatch;
  const showPasswordRules = isSignup && isPasswordFocused && password.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const supabase = createBrowserSupabaseClient();

    if (isSignup && !isStrongPassword) {
      toast.error("A senha precisa ser forte para concluir o cadastro.");
      setPending(false);
      return;
    }

    if (isSignup) {
      if (!passwordsMatch) {
        toast.error("As senhas digitadas precisam ser iguais.");
        setPending(false);
        return;
      }

      const callbackUrl = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl
        }
      });

      if (error) {
        toast.error(error.message);
        setPending(false);
        return;
      }

      if (data.session) {
        toast.success("Conta criada com sucesso.");
        router.replace("/dashboard");
      } else {
        toast.success("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
        router.replace("/login");
      }

      router.refresh();
      setPending(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setPending(false);
      return;
    }

    toast.success("Login realizado com sucesso.");
    router.replace("/dashboard");
    router.refresh();
    setPending(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-10" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{isSignup ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
                <p className="text-balance text-muted-foreground">
                  {isSignup ? "Cadastre-se com e-mail e senha forte." : "Acesse sua conta com e-mail e senha."}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                {isSignup ? (
                  <div className="relative">
                    <Input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      value={password}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsPasswordVisible((current) => !current)}
                    >
                      {isPasswordVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                    {showPasswordRules ? (
                      <div className="absolute left-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
                        <p className={cn("font-medium", isStrongPassword ? "text-emerald-600" : "text-amber-600")}>
                          Força da senha: {isStrongPassword ? "forte" : "fraca"}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <li className={passwordRules.minLength ? "text-emerald-600" : undefined}>Pelo menos 8 caracteres</li>
                          <li className={passwordRules.uppercase ? "text-emerald-600" : undefined}>Uma letra maiúscula</li>
                          <li className={passwordRules.lowercase ? "text-emerald-600" : undefined}>Uma letra minúscula</li>
                          <li className={passwordRules.number ? "text-emerald-600" : undefined}>Um número</li>
                          <li className={passwordRules.special ? "text-emerald-600" : undefined}>Um caractere especial</li>
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsPasswordVisible((current) => !current)}
                    >
                      {isPasswordVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                  </div>
                )}
              </div>

              {isSignup ? (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      aria-invalid={hasConfirmPassword && !passwordsMatch}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isConfirmPasswordVisible ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsConfirmPasswordVisible((current) => !current)}
                    >
                      {isConfirmPasswordVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                  </div>
                  {hasConfirmPassword && !passwordsMatch ? (
                    <p className="text-xs text-destructive">As senhas não conferem.</p>
                  ) : null}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={pending || (isSignup && isSignupSubmitDisabled)}>
                {pending ? "Processando..." : isSignup ? "Criar conta" : "Entrar"}
              </Button>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">ou</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => toast.info("Login com Google em modo mock por enquanto.")}
              >
                <svg className="mr-2 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continuar com Google
              </Button>

              <div className="text-center text-sm">
                {isSignup ? "Já tem conta?" : "Não tem conta?"}{" "}
                <Link href={isSignup ? "/login" : "/signup"} className="underline underline-offset-4">
                  {isSignup ? "Entrar" : "Cadastre-se"}
                </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <Image src="/images/vokos_submark_white.svg" alt="Vokos" width={220} height={220} className="h-auto w-56" />
            </div>
            <Image src="/images/front-view-blurry-lawyer-working.webp" alt="Ilustração de autenticação" fill className="object-cover" />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com nossos termos de uso e política de privacidade.
      </div>
    </div>
  );
}
