"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createApplicationSchema, type CreateApplicationInput } from "@/dto/application.dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/types";

interface ApplicationFormProps {
  defaultValues?: Partial<CreateApplicationInput>;
  onSubmit: (data: CreateApplicationInput) => Promise<void>;
  submitLabel?: string;
}

export function ApplicationForm({ defaultValues, onSubmit, submitLabel = "Save" }: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      status: "APPLIED",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input id="company" {...register("company")} />
          {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input id="role" {...register("role")} />
          {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobUrl">Job URL</Label>
          <Input id="jobUrl" {...register("jobUrl")} placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" {...register("salary")} placeholder="$120,000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Input id="employmentType" {...register("employmentType")} placeholder="Full-time" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recruiterName">Recruiter Name</Label>
          <Input id="recruiterName" {...register("recruiterName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recruiterEmail">Recruiter Email</Label>
          <Input id="recruiterEmail" type="email" {...register("recruiterEmail")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch("status")} onValueChange={(v) => setValue("status", v as CreateApplicationInput["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description</Label>
        <Textarea id="jobDescription" rows={4} {...register("jobDescription")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
