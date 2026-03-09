import { createServerSupabaseClient } from "@/lib/supabase/server";
import Features from "@/components/landing/features-one";
import HeroSection from "@/components/landing/hero-section";
import ContentSection from "@/components/landing/content-1";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";
import FAQs from "@/components/landing/faqs-section-two";
import FooterSection from "@/components/landing/footer-one";

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userInfo = user
    ? {
        email: user.email ?? "",
        name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "",
      }
    : null;

  return (
    <>
      <HeroSection user={userInfo} />
      <Features />
      <ContentSection />
      <Pricing />
      <Testimonials />
      <FAQs />
      <FooterSection />
    </>
  );
}
