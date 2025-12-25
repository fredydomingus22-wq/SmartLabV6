"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";

interface UserPickerProps {
    name: string;
    defaultValue?: string;
    placeholder?: string;
}

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
}

export function UserPicker({ name, defaultValue, placeholder = "Select user..." }: UserPickerProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [value, setValue] = useState(defaultValue || "");

    useEffect(() => {
        async function loadUsers() {
            const supabase = createClient();
            const { data } = await supabase
                .from("user_profiles")
                .select("id, full_name, email")
                .order("full_name");

            if (data) {
                setUsers(data);
            }
            setLoading(false);
        }
        loadUsers();
    }, []);

    return (
        <div>
            <Select value={value} onValueChange={setValue} name={name}>
                <SelectTrigger disabled={loading}>
                    <SelectValue placeholder={loading ? "Loading..." : placeholder}>
                        {value && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {users.find(u => u.id === value)?.full_name || placeholder}
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                                <span>{user.full_name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {/* Hidden input to submit the value */}
            <input type="hidden" name={name} value={value} />
        </div>
    );
}
