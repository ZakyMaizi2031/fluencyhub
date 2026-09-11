import { notFound, redirect } from "next/navigation";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { getCourseById } from "@/lib/db/courses.queries";
import { getActivePaymentMethods, getInstructionsForMethod } from "@/lib/db/payment-methods.queries";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/payment/midtrans";
import { auth } from "@/lib/session";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const params = await searchParams;
  const courseId = Number(params.courseId);
  if (!courseId) notFound();

  const [course, methods, session] = await Promise.all([
    getCourseById(courseId),
    getActivePaymentMethods(),
    auth(),
  ]);
  if (!course || course.status !== "published") notFound();

  if (session?.user.id) {
    const enrolled = await checkEnrollment(Number(session.user.id), courseId);
    if (enrolled) redirect(`/dashboard/courses/${courseId}`);
  }

  const instructionsByMethod: Record<number, Awaited<ReturnType<typeof getInstructionsForMethod>>> = {};
  await Promise.all(
    methods.map(async (m) => {
      instructionsByMethod[m.id] = await getInstructionsForMethod(m.id);
    }),
  );

  return (
    <CheckoutStepper
      course={course}
      methods={methods}
      instructionsByMethod={instructionsByMethod}
      user={
        session?.user
          ? {
              name: session.user.name ?? "",
              email: session.user.email ?? "",
              whatsappNumber: null,
            }
          : null
      }
      midtransClientKey={midtransClientKey()}
      midtransSnapScriptUrl={midtransSnapScriptUrl()}
    />
  );
}
