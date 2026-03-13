import type { Route } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/db/organizations";
import Features from "@/components/landing/features-one";
import HeroSection from "@/components/landing/hero-section";
import ContentSection from "@/components/landing/content-section";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";
import FAQs from "@/components/landing/faqs-section-two";
import FooterSection from "@/components/landing/footer-one";

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const organization = await getCurrentOrganization();
    redirect((organization ? "/dashboard" : "/organization/setup") as Route);
  }

  return (
    <>
      <HeroSection user={null} />
      <Features />
      <ContentSection />
      <Testimonials />
      <Pricing />
      <FAQs />
      <FooterSection />
    </>
  );
}
