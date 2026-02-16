"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBookmark(formData: FormData) {
    const title = formData.get("title") as string;
    const url = formData.get("url") as string;

    if (!title || !url) {
        return;
    }

    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return;
    }

    await supabase.from("bookmarks").insert({
        title,
        url,
        user_id: user.id,
    });

    revalidatePath("/");
}

export async function deleteBookmark(id: string) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return;
    }

    await supabase.from("bookmarks").delete().match({ id, user_id: user.id });

    revalidatePath("/");
}
