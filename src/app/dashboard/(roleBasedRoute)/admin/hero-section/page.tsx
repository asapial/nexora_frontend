"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";

interface HeroEntry {
  id: string;
  displayName: string | null;
  displayDesignation: string | null;
  displayDepartment: string | null;
  displayBio: string | null;
  order: number;
  isActive: boolean;
}

interface Teacher {
  id: string;
  name: string;
  image: string | null;
  email: string;
  isActive: boolean;
  teacherProfile: {
    designation: string | null;
    department: string | null;
    specialization: string | null;
    researchInterests: string[];
    bio: string | null;
    isVerified: boolean;
    institution: string | null;
  } | null;
  heroSectionEntry: HeroEntry | null;
}

interface EditState {
  displayName: string;
  displayDesignation: string;
  displayDepartment: string;
  displayBio: string;
  order: number;
}

function TeacherAvatar({ src, name }: { src: string | null; name: string; }) {
  const [err, setErr] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!src || err) {
    return (
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {initials}
      </div>
    );
  }
  return (
    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
      <Image src={src} alt={name} fill className="object-cover" onError={() => setErr(true)} />
    </div>
  );
}

export default function HeroSectionAdmin() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/homePage/allTeachersForHeroSelection");
      const data = await res.json();
      if (data.success) {
        setTeachers(data.data);
        // Initialize edit states from existing hero section entries
        const states: Record<string, EditState> = {};
        data.data.forEach((t: Teacher) => {
          if (t.heroSectionEntry) {
            states[t.id] = {
              displayName: t.heroSectionEntry.displayName ?? "",
              displayDesignation: t.heroSectionEntry.displayDesignation ?? "",
              displayDepartment: t.heroSectionEntry.displayDepartment ?? "",
              displayBio: t.heroSectionEntry.displayBio ?? "",
              order: t.heroSectionEntry.order ?? 0,
            };
          }
        });
        setEditStates(states);
      } else {
        toast.error("Failed to load teachers");
      }
    } catch {
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const isInHero = (teacher: Teacher) => !!teacher.heroSectionEntry?.isActive;

  const getEditState = (teacher: Teacher): EditState => {
    return editStates[teacher.id] ?? {
      displayName: "",
      displayDesignation: "",
      displayDepartment: "",
      displayBio: "",
      order: 0,
    };
  };

  const updateEditField = (teacherId: string, field: keyof EditState, value: string | number) => {
    setEditStates(prev => ({
      ...prev,
      [teacherId]: {
        ...getEditState(teachers.find(t => t.id === teacherId)!),
        ...prev[teacherId],
        [field]: value,
      }
    }));
  };

  const handleAddToHero = async (teacher: Teacher) => {
    const edit = editStates[teacher.id] ?? {
      displayName: "",
      displayDesignation: "",
      displayDepartment: "",
      displayBio: "",
      order: 0,
    };

    setSaving(prev => ({ ...prev, [teacher.id]: true }));
    try {
      const res = await fetch("/api/homePage/heroSectionTeacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: teacher.id,
          displayName: edit.displayName || null,
          displayDesignation: edit.displayDesignation || null,
          displayDepartment: edit.displayDepartment || null,
          displayBio: edit.displayBio || null,
          order: edit.order,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${teacher.name} added to Hero Section`);
        await fetchData();
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(prev => ({ ...prev, [teacher.id]: false }));
    }
  };

  const handleUpdateHero = async (teacher: Teacher) => {
    const edit = editStates[teacher.id] ?? {};
    setSaving(prev => ({ ...prev, [teacher.id]: true }));
    try {
      const res = await fetch("/api/homePage/heroSectionTeacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: teacher.id,
          displayName: (edit as EditState).displayName || null,
          displayDesignation: (edit as EditState).displayDesignation || null,
          displayDepartment: (edit as EditState).displayDepartment || null,
          displayBio: (edit as EditState).displayBio || null,
          order: (edit as EditState).order,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Hero section updated");
        await fetchData();
        setExpandedId(null);
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(prev => ({ ...prev, [teacher.id]: false }));
    }
  };

  const handleRemoveFromHero = async (teacher: Teacher) => {
    setRemoving(prev => ({ ...prev, [teacher.id]: true }));
    try {
      const res = await fetch(`/api/homePage/heroSectionTeacher/${teacher.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${teacher.name} removed from Hero Section`);
        await fetchData();
      } else {
        toast.error("Failed to remove");
      }
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(prev => ({ ...prev, [teacher.id]: false }));
    }
  };

  const heroTeachers = teachers.filter(isInHero).sort((a, b) => (a.heroSectionEntry?.order ?? 0) - (b.heroSectionEntry?.order ?? 0));
  const availableTeachers = teachers.filter(t => !isInHero(t));

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Hero Section Manager</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Select teachers to feature on the homepage hero section. Override their display details if needed — null fields will fall back to their actual profile data.
        </p>
      </div>

      {/* Active in Hero */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Currently Featured</h2>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            {heroTeachers.length} active
          </Badge>
        </div>

        {heroTeachers.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-400 dark:text-zinc-500">
            No teachers are currently featured. Add some below.
          </div>
        ) : (
          <div className="space-y-3">
            {heroTeachers.map((teacher) => {
              const edit = getEditState(teacher);
              const isExpanded = expandedId === teacher.id;
              const isSaving = !!saving[teacher.id];
              const isRemoving = !!removing[teacher.id];
              return (
                <div key={teacher.id} className="rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-900/10 overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <TeacherAvatar src={teacher.image} name={teacher.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">{teacher.name}</span>
                        {teacher.teacherProfile?.isVerified && (
                          <Badge variant="outline" className="text-[10px] h-4 border-teal-400 text-teal-600 dark:text-teal-400">Verified</Badge>
                        )}
                        <span className="text-xs text-zinc-400">Order: {teacher.heroSectionEntry?.order ?? 0}</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span className="font-medium text-teal-600 dark:text-teal-400">Showing: </span>
                        {teacher.heroSectionEntry?.displayDesignation || teacher.teacherProfile?.designation || <span className="italic text-zinc-400">null</span>}
                        {" · "}
                        {teacher.heroSectionEntry?.displayDepartment || teacher.teacherProfile?.department || <span className="italic text-zinc-400">null</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setExpandedId(isExpanded ? null : teacher.id)}
                      >
                        {isExpanded ? "Collapse" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleRemoveFromHero(teacher)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-teal-200 dark:border-teal-800/60 p-4 bg-white/70 dark:bg-zinc-900/50">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        Override values are displayed in the hero section. Leave blank to use the teacher's actual profile data (shown in grey).
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Display Name <span className="text-zinc-400 font-normal">(actual: {teacher.name})</span>
                          </label>
                          <Input className="h-8 text-sm" placeholder={teacher.name} value={edit.displayName}
                            onChange={e => updateEditField(teacher.id, "displayName", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Display Order
                          </label>
                          <Input className="h-8 text-sm" type="number" placeholder="0" value={edit.order}
                            onChange={e => updateEditField(teacher.id, "order", Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Designation <span className="text-zinc-400 font-normal">(actual: {teacher.teacherProfile?.designation ?? "null"})</span>
                          </label>
                          <Input className="h-8 text-sm" placeholder={teacher.teacherProfile?.designation ?? "e.g. Senior Professor"} value={edit.displayDesignation}
                            onChange={e => updateEditField(teacher.id, "displayDesignation", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Department <span className="text-zinc-400 font-normal">(actual: {teacher.teacherProfile?.department ?? "null"})</span>
                          </label>
                          <Input className="h-8 text-sm" placeholder={teacher.teacherProfile?.department ?? "e.g. AI Research Lab"} value={edit.displayDepartment}
                            onChange={e => updateEditField(teacher.id, "displayDepartment", e.target.value)} />
                        </div>
                        <div className="col-span-full">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Bio Override
                          </label>
                          <Textarea className="text-sm resize-none" rows={3} placeholder={teacher.teacherProfile?.bio ?? "Enter a custom bio for the hero section…"} value={edit.displayBio}
                            onChange={e => updateEditField(teacher.id, "displayBio", e.target.value)} />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs" onClick={() => handleUpdateHero(teacher)} disabled={isSaving}>
                          {isSaving ? "Saving…" : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* All Available Teachers */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-4">
          All Registered Teachers <span className="text-zinc-400 font-normal text-sm">({availableTeachers.length} not featured)</span>
        </h2>
        {availableTeachers.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">All registered teachers are already featured.</p>
        ) : (
          <div className="space-y-3">
            {availableTeachers.map((teacher) => {
              const edit = getEditState(teacher);
              const isExpanded = expandedId === teacher.id;
              const isSaving = !!saving[teacher.id];
              return (
                <div key={teacher.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <TeacherAvatar src={teacher.image} name={teacher.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{teacher.name}</span>
                        {teacher.teacherProfile?.isVerified ? (
                          <Badge variant="outline" className="text-[10px] h-4 border-teal-400 text-teal-600 dark:text-teal-400">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 border-zinc-300 text-zinc-400">Unverified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-zinc-500">{teacher.teacherProfile?.designation ?? <span className="italic">designation: null</span>}</span>
                        {teacher.teacherProfile?.department && (
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        )}
                        <span className="text-xs text-zinc-400">{teacher.teacherProfile?.department ?? <span className="italic">department: null</span>}</span>
                      </div>
                      {teacher.teacherProfile?.institution && (
                        <p className="text-xs text-zinc-400 mt-0.5">{teacher.teacherProfile.institution}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setExpandedId(isExpanded ? null : teacher.id)}
                      >
                        {isExpanded ? "Collapse" : "Set Details"}
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => handleAddToHero(teacher)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Adding…" : "Add to Hero"}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/60">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                        Optionally provide custom display values. Leave blank to show the teacher's actual null or profile data.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">Display Name</label>
                          <Input className="h-8 text-sm" placeholder={teacher.name} value={edit.displayName}
                            onChange={e => updateEditField(teacher.id, "displayName", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">Display Order</label>
                          <Input className="h-8 text-sm" type="number" placeholder="0" value={edit.order}
                            onChange={e => updateEditField(teacher.id, "order", Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Designation <span className="text-zinc-400 font-normal">(actual: {teacher.teacherProfile?.designation ?? "null"})</span>
                          </label>
                          <Input className="h-8 text-sm" placeholder={teacher.teacherProfile?.designation ?? "e.g. Senior Professor"} value={edit.displayDesignation}
                            onChange={e => updateEditField(teacher.id, "displayDesignation", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Department <span className="text-zinc-400 font-normal">(actual: {teacher.teacherProfile?.department ?? "null"})</span>
                          </label>
                          <Input className="h-8 text-sm" placeholder={teacher.teacherProfile?.department ?? "e.g. AI Research Lab"} value={edit.displayDepartment}
                            onChange={e => updateEditField(teacher.id, "displayDepartment", e.target.value)} />
                        </div>
                        <div className="col-span-full">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">Bio Override</label>
                          <Textarea className="text-sm resize-none" rows={3} placeholder={teacher.teacherProfile?.bio ?? "Custom bio for hero section…"} value={edit.displayBio}
                            onChange={e => updateEditField(teacher.id, "displayBio", e.target.value)} />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs" onClick={() => handleAddToHero(teacher)} disabled={isSaving}>
                          {isSaving ? "Saving…" : "Add to Hero Section"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
