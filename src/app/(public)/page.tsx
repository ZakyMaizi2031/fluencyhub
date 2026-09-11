import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { MethodSection } from "@/components/landing/MethodSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { getLandingBundle } from "@/lib/landing";

export default async function LandingPage() {
  const { settings, pains, methods, courses, testimonials, faqs } = await getLandingBundle();

  return (
    <main>
      <HeroSection settings={settings} />
      <ProblemSection items={pains} />
      <MethodSection items={methods} imageUrl={settings.method_image_url ?? ""} />
      <PricingSection courses={courses} />
      <TestimonialSection items={testimonials} />
      <FaqSection items={faqs} />
      <FinalCtaSection title={settings.cta_title ?? ""} subtitle={settings.cta_subtitle ?? ""} />
    </main>
  );
}
