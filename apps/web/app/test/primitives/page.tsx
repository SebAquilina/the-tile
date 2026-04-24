"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Search, Mail } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Modal,
  useModal,
  ToastProvider,
  useToast,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * /test/primitives — exhaustive visual catalogue of every UI primitive in
 * every state. Includes a manual theme toggle that flips
 * document.documentElement.dataset.theme between "light" and "dark".
 */
export default function PrimitivesTestPage() {
  return (
    <ToastProvider>
      <PrimitivesInner />
    </ToastProvider>
  );
}

function PrimitivesInner() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // On mount, read current theme (if any) or default to "light".
  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === "dark" || current === "light") setTheme(current);
    else document.documentElement.dataset.theme = "light";
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  const toast = useToast();
  const { modalRef: basicModal, open: openBasic } = useModal();
  const { modalRef: formModal, open: openForm, close: closeForm } = useModal();

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-10 bg-canvas/80 backdrop-blur border-b border-line">
        <div className="max-w-content mx-auto px-space-5 py-space-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-ink-subtle">Design system</p>
            <h1 className="font-display text-2xl">UI primitives</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            Theme: {theme}
          </Button>
        </div>
      </header>

      <main className="max-w-content mx-auto px-space-5 py-space-8 flex flex-col gap-space-9">
        <Section title="Buttons" description="primary, secondary, ghost, link × sm / md / lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-5">
            {(["primary", "secondary", "ghost", "link"] as const).map((variant) => (
              <div key={variant} className="flex flex-col gap-space-3">
                <p className="text-sm font-medium text-ink-muted capitalize">{variant}</p>
                {(["sm", "md", "lg"] as const).map((size) => (
                  <div key={size} className="flex items-center gap-space-3">
                    <Button variant={variant} size={size}>
                      {size.toUpperCase()}
                    </Button>
                  </div>
                ))}
                <Button variant={variant} disabled>
                  Disabled
                </Button>
                <Button variant={variant} loading>
                  Loading
                </Button>
                <Button variant={variant} trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  With icon
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Inputs" description="label, help text, error, disabled, adornments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
            <Input
              label="Full name"
              placeholder="Giulia Bianchi"
              helpText="As it should appear on the quote."
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leadingAdornment={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Search"
              placeholder="Search collections"
              leadingAdornment={<Search className="h-4 w-4" />}
              defaultValue="Marble"
            />
            <Input label="Disabled" defaultValue="Read-only value" disabled />
            <Input
              label="With error"
              required
              errorMessage="This field is required"
              aria-invalid
            />
            <Input label="With help" helpText="Help text beneath the input." />
          </div>
        </Section>

        <Section title="Textarea" description="same contract as Input">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
            <Textarea
              label="Project notes"
              placeholder="Tell us about the room, lighting, and feel…"
              helpText="The more detail, the better the recommendation."
            />
            <Textarea label="Disabled" defaultValue="Locked content." disabled />
            <Textarea label="With error" required errorMessage="Please describe the project." />
            <Textarea label="Filled" defaultValue="A warm living room with late-afternoon light; we want something Italian-quarry warm but not too red. Open to marble and travertine effects." />
          </div>
        </Section>

        <Section title="Select" description="native select, styled to match">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
            <Select label="Effect" placeholder="Choose an effect" required>
              <option value="marble">Marble</option>
              <option value="wood">Wood</option>
              <option value="stone">Stone</option>
              <option value="concrete">Concrete</option>
              <option value="terrazzo">Terrazzo</option>
            </Select>
            <Select label="Disabled" disabled defaultValue="wood">
              <option value="wood">Wood</option>
            </Select>
            <Select
              label="With error"
              errorMessage="Please choose an effect"
              placeholder="Choose an effect"
              required
            >
              <option value="marble">Marble</option>
              <option value="wood">Wood</option>
            </Select>
            <Select
              label="With help"
              helpText="Filters the collection grid."
              defaultValue="marble"
            >
              <option value="marble">Marble</option>
              <option value="wood">Wood</option>
            </Select>
          </div>
        </Section>

        <Section title="Checkbox" description="unchecked, checked, indeterminate, disabled, error">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-5">
            <Checkbox label="Unchecked" />
            <Checkbox label="Checked" defaultChecked />
            <Checkbox label="Indeterminate" indeterminate />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="Disabled + checked" disabled defaultChecked />
            <Checkbox
              label="Subscribe to the journal"
              helpText="Occasional updates on new collections and showroom events."
            />
            <Checkbox
              label="Consent"
              required
              errorMessage="You must accept to continue"
            />
          </div>
        </Section>

        <Section title="Radio" description="group of options">
          <fieldset className="flex flex-col gap-space-4">
            <legend className="text-sm font-medium text-ink mb-space-2">Preferred finish</legend>
            <Radio name="finish" value="matte" label="Matte" defaultChecked />
            <Radio name="finish" value="polished" label="Polished" />
            <Radio name="finish" value="structured" label="Structured" />
            <Radio name="finish" value="other" label="Other" disabled />
            <Radio
              name="finish-error"
              value="a"
              label="With error"
              errorMessage="Please make a selection"
            />
          </fieldset>
        </Section>

        <Section title="Modal" description="dialog-based, Esc closes, body scroll lock">
          <div className="flex flex-wrap gap-space-3">
            <Button onClick={openBasic}>Open basic modal</Button>
            <Button variant="secondary" onClick={openForm}>
              Open modal with form
            </Button>
          </div>
          <Modal
            ref={basicModal}
            title="A quiet modal"
            description="The UI framework disappears around the tile. Close with Esc or the X."
          >
            <p className="text-base text-ink-muted">
              Modals use <code className="font-display">&lt;dialog&gt;</code> with a focus trap
              and body scroll lock. Focus returns to the trigger on close.
            </p>
          </Modal>
          <Modal
            ref={formModal}
            title="Request a sample"
            description="We'll be in touch within 24 hours."
            footer={
              <>
                <Button variant="ghost" onClick={closeForm}>
                  Cancel
                </Button>
                <Button onClick={closeForm}>Send</Button>
              </>
            }
          >
            <div className="flex flex-col gap-space-4">
              <Input label="Name" placeholder="Full name" required />
              <Input label="Email" type="email" placeholder="you@example.com" required />
              <Textarea label="Notes" placeholder="Room, lighting, feel…" rows={3} />
            </div>
          </Modal>
        </Section>

        <Section title="Toast" description="aria-live, pause-on-hover, max 3 stacked">
          <div className="flex flex-wrap gap-space-3">
            <Button
              variant="secondary"
              onClick={() => toast.success("Saved to your list", { title: "Done" })}
            >
              Success toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.error("Could not send — try again", { title: "Error" })}
            >
              Error toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.info("The agent is thinking…")}
            >
              Info toast
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast.info("This one stays until dismissed.", {
                  duration: 0,
                  title: "Persistent",
                })
              }
            >
              Persistent toast
            </Button>
          </div>
        </Section>

        <Section title="Skeleton" description="respects prefers-reduced-motion">
          <div className="flex flex-col gap-space-5 max-w-prose">
            <Skeleton height={36} rounded="sm" />
            <Skeleton height={14} rounded="sm" style={{ width: "80%" }} />
            <Skeleton height={14} rounded="sm" style={{ width: "60%" }} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4">
              <Skeleton className="aspect-square w-full" rounded="sm" />
              <Skeleton className="aspect-square w-full" rounded="sm" />
              <Skeleton className="aspect-square w-full" rounded="sm" />
              <Skeleton className="aspect-square w-full" rounded="sm" />
            </div>
          </div>
        </Section>

        <Section title="Surface tokens" description="visual parity check, light + dark">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
            <TokenSwatch name="bg-canvas" className="bg-canvas border border-line" />
            <TokenSwatch name="bg-surface" className="bg-surface border border-line" />
            <TokenSwatch name="bg-surface-muted" className="bg-surface-muted border border-line" />
            <TokenSwatch name="bg-umber / text-canvas" className="bg-umber text-canvas" label="Brand" />
            <TokenSwatch name="bg-clay / text-canvas" className="bg-clay text-canvas" label="Accent" />
            <TokenSwatch name="bg-error / text-canvas" className="bg-error text-canvas" label="Error" />
          </div>
        </Section>
      </main>

      <footer className="border-t border-line mt-space-9 py-space-7">
        <div className="max-w-content mx-auto px-space-5 text-sm text-ink-subtle">
          The Tile — design system test page. Theme: {theme}.
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-space-5">
      <div className="flex flex-col gap-space-1 border-b border-line pb-space-3">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function TokenSwatch({
  name,
  className,
  label,
}: {
  name: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("rounded-lg p-space-5 min-h-[96px] flex flex-col justify-between", className)}>
      <span className="text-xs font-medium uppercase tracking-[0.12em]">{label ?? "Surface"}</span>
      <span className="font-display text-base">{name}</span>
    </div>
  );
}
