import { ArrowLeft, FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="panel mx-auto my-14 max-w-lg p-10 text-center">
      <FileQuestion
        size={35}
        className="mx-auto mb-5 text-brand"
        strokeWidth={1.4}
      />
      <p className="text-xs font-medium text-muted">404 · PAGE NOT FOUND</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Let’s get you back on track.
      </h1>
      <p className="mt-3 mb-7 text-sm leading-6 text-muted">
        This page doesn’t exist. Your workspace is right this way.
      </p>
      <ButtonLink to="/">
        <ArrowLeft size={15} />
        Back to overview
      </ButtonLink>
    </div>
  );
}
