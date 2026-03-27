"use client";

import { useState, useEffect } from "react";
import ProfilePage from "./ProfilePage";


export default function Page() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                const data = await res.json();
                console.log("profile page data:", data);



                if (data.success) {
                    setUser(data.data.userData);
                    switch (data.data.userData.role) {
                        case "ADMIN":
                            setProfile(data.data.adminProfile);
                            break
                        case "TEACHER":
                            setProfile(data.data.teacherProfile);
                            break
                        case "STUDENT":
                            setProfile(data.data.studentProfile);
                            break

                    }

                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    console.log("user data :", user)
    console.log("profile data :", profile);

    if (!user || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-sm text-muted-foreground">
                Failed to load profile.
            </div>
        );
    }

    return (
        <ProfilePage
            user={user}
            profile={profile}
            onSave={async (patch) => {
                await fetch("/api/auth/updateProfile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                    credentials: "include",
                });
            }}
        />
    );
}
