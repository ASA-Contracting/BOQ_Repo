"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { createProjectAction } from "@/app/(dashboard)/projects/actions";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/typography";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createProjectAction({
      name,
      client,
      description: description.trim() ? description : null,
    });

    setSubmitting(false);

    if (!result.success || !result.data) {
      setError(result.success ? "Failed to create project." : result.error.message);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <ShellContent className="mx-auto max-w-lg space-y-4">
      <div>
        <Text size="lg" weight="semibold">
          New project
        </Text>
        <Text variant="muted" size="sm" className="mt-0.5">
          Projects are the root container for BOQs. Name and client are required.
        </Text>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 rounded-xl border bg-white p-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={150}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-client">Client</Label>
          <Input
            id="project-client"
            value={client}
            onChange={(event) => setClient(event.target.value)}
            required
            maxLength={150}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description (optional)</Label>
          <Input
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
          />
        </div>

        {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create project
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/projects">Cancel</Link>
          </Button>
        </div>
      </form>
    </ShellContent>
  );
}
